import browser from 'webextension-polyfill';
import { z } from 'zod';
import { notUndef } from '../utils';
import { SuggestionSchema } from '../../edge/api/_db';
import { uniq, uniqBy } from 'lodash-es';

const apiUrl = import.meta.env.DEV
  ? 'https://humble-steam-sync-aumzauz0u-haaxor1689.vercel.app'
  : 'https://humble-steam-sync.haaxor1689.dev';

export type Message =
  | { action: 'suggestTag'; suggestion: SuggestionSchema }
  | { action: 'getUserData' }
  | { action: 'steamLogIn'; steamName: string }
  | { action: 'getTagMappings' };

export type Item = [name: string, id: number];

export type LocalData = {
  status: 'ok';
  cacheTime?: string;
  library: Item[];
  wishlist: Item[];
  ignored: Item[];
  recommended: Item[];
  steamName?: string;
  steamId?: string;
  avatar?: string;
  store?: boolean;
  alwaysShowTag?: boolean;
};

type AppList = { applist: { apps: { appid: number; name: string }[] } };

const fetchUserLibrary = (steamName: string): Promise<Item[]> =>
  fetch(`${apiUrl}/api/${steamName}/library`).then(r => r.json());

const getWishlistPages = async (
  steamId: string,
  page: number = 0
): Promise<Item[]> => {
  const response = await fetch(
    `https://store.steampowered.com/wishlist/profiles/${steamId}/wishlistdata/?p=${page}`
  );
  if (!response.ok) return [];
  const parsed = await response.json();

  if (parsed.length === 0 || parsed.success === 2) return [];

  const next = await getWishlistPages(steamId, page + 1);
  return [
    ...(Object.entries(parsed) as [string, { name: string }][]).map(
      ([id, v]) => [v.name, Number(id)] as Item
    ),
    ...next
  ];
};

const UserData = z.object({
  rgOwnedApps: z.array(z.number()),
  rgWishlist: z.array(z.number()),
  rgIgnoredApps: z.preprocess(
    v => (v && typeof v === 'object' ? Object.keys(v).map(Number) : []),
    z.array(z.number())
  ),
  rgRecommendedApps: z.array(z.number())
});

const mapApps = (items: number[], apps: AppList) =>
  items
    .map(g => {
      const item = apps.applist.apps.find(a => a.appid == g);
      if (!item) return undefined;
      return [item.name, item.appid] as Item;
    })
    .filter(notUndef);

const fetchStoreData = async () => {
  const userData = await fetch(
    `https://store.steampowered.com/dynamicstore/userdata/?cacheRefresh=${Math.random()}`
  )
    .then(r => r.json())
    .then(UserData.parse);

  if (!userData.rgOwnedApps.length) return { status: 'noData' } as const;

  const apps = await fetch(
    'https://api.steampowered.com/ISteamApps/GetAppList/v2/'
  ).then(r => r.json());

  return {
    status: 'ok',
    wishlist: mapApps(userData.rgWishlist, apps),
    library: mapApps(userData.rgOwnedApps, apps),
    ignored: mapApps(userData.rgIgnoredApps, apps),
    recommended: mapApps(userData.rgRecommendedApps, apps),
    cacheTime: new Date().toLocaleString(),
    store: true
  } satisfies LocalData as LocalData;
};

const steamLogIn = async (rawName: string) => {
  const steamName =
    rawName.match(
      /^(?:https?:\/\/)?steamcommunity\.com\/(?:id|profiles)\/(\w+)\/?$/
    )?.[1] ?? rawName;

  if (!steamName) throw new Error('Invalid Steam Id');

  try {
    const { steamId, avatar } = await fetch(
      `${apiUrl}/api/${steamName}/profile`
    ).then(r => r.json());

    const data = {
      steamId,
      steamName,
      avatar
    } satisfies Partial<LocalData>;
    await browser.storage.local.set(data);
    return data;
  } catch (e) {
    console.error(e);
    throw new Error('Steam account not found');
  }
};

const getUserData = async () => {
  const cache = (await browser.storage.local.get(null)) as LocalData;

  console.log('Cache:', cache);

  // Check 1 hour cache time
  if (
    cache.cacheTime &&
    new Date().getTime() - new Date(cache.cacheTime).getTime() < 1000 * 60 * 60
  )
    return cache;

  console.log(cache);

  let mergedData = cache;

  try {
    console.log('Fetching store data');
    const storeData = await fetchStoreData();

    if (storeData.status === 'ok') {
      mergedData = { ...mergedData, ...storeData };
    }

    if (cache.steamId) {
      console.log('Fetching owned games');
      const library = await fetchUserLibrary(cache.steamId);
      const wishlist = await getWishlistPages(cache.steamId);

      mergedData = {
        ...mergedData,
        library: uniqBy([...mergedData.library, ...library], v => v[1]),
        wishlist: uniqBy([...mergedData.wishlist, ...wishlist], v => v[1]),
        cacheTime: new Date().toLocaleString()
      };
    }

    if (storeData.status !== 'ok' && !cache.steamId)
      return { status: 'noData' } as const;

    await browser.storage.local.set(mergedData);
    return mergedData;
  } catch (e) {
    console.error(e);
    throw new Error('Unexpected error ocurred.');
  }
};

export const suggestTag = async (suggestion: SuggestionSchema) => {
  const response = await fetch('${apiUrl}/api/mappings/suggest', {
    method: 'POST',
    body: JSON.stringify(suggestion)
  });
  const parsed = (await response.json()) as
    | { status: 'exists' | 'created' | 'badRequest' }
    | { status: 'error'; message: string };
  return parsed;
};

export const getTagMappings = async () => {
  const response = await fetch(`${apiUrl}/api/mappings/list`);
  const parsed = (await response.json()) as SuggestionSchema[];
  return parsed;
};

export type SteamLogInResponse = Awaited<ReturnType<typeof steamLogIn>>;
export type GetUserDataResponse = Awaited<ReturnType<typeof getUserData>>;

browser.runtime.onMessage.addListener(async (message: Message) => {
  console.log('Received message:', message);
  switch (message.action) {
    case 'suggestTag':
      return await suggestTag(message.suggestion);
    case 'getTagMappings':
      return await getTagMappings();
    case 'steamLogIn':
      return await steamLogIn(message.steamName);
    case 'getUserData':
      return await getUserData();
  }
});

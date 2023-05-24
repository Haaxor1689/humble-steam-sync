import browser from 'webextension-polyfill';
import { z } from 'zod';
import { notUndef } from '../utils';
import { SuggestionSchema } from '../../api/_db';

export type Message =
  | { action: 'suggestTag'; suggestion: SuggestionSchema }
  | { action: 'getUserData' }
  | { action: 'steamLogIn'; steamId: string }
  | { action: 'getTagMappings' };

export type LocalData = {
  status: 'ok';
  cacheTime?: string;
  library: string[];
  wishlist: string[];
  ignored: string[];
  recommended: string[];
  steamId?: string;
  avatar?: string;
  store?: boolean;
  alwaysShowTag?: boolean;
};

type AppList = { applist: { apps: { appid: number; name: string }[] } };

const fetchOwnedGames = (steamId: string) =>
  fetch(`https://humble-steam-sync.haaxor1689.dev/api/${steamId}/games`)
    .then(r => r.json())
    .then(
      r =>
        ({
          status: 'ok',
          library: r,
          wishlist: [],
          ignored: [],
          recommended: [],
          cacheTime: new Date().toLocaleString()
        } satisfies LocalData as LocalData)
    );

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
    .map(g => apps.applist.apps.find(a => a.appid == g)?.name)
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

const steamLogIn = async (rawId: string) => {
  const steamId =
    rawId.match(
      /^(?:https?:\/\/)?steamcommunity\.com\/(?:id|profiles)\/(\w+)\/?$/
    )?.[1] ?? rawId;

  if (!steamId) throw new Error('Invalid Steam Id');

  try {
    const { avatarmedium } = await fetch(
      `https://humble-steam-sync.haaxor1689.dev/api/${steamId}/profile`
    ).then(r => r.json());

    const data = {
      steamId,
      avatar: avatarmedium
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

  try {
    console.log('Fetching store data');
    const storeData = await fetchStoreData();
    if (storeData.status === 'ok') {
      await browser.storage.local.set(storeData);
      return { ...cache, ...storeData };
    }

    if (cache.steamId) {
      console.log('Fetching owned games');
      const ownedGames = await fetchOwnedGames(cache.steamId);

      if (ownedGames.status === 'ok') {
        await browser.storage.local.set(storeData);
        return { ...cache, ...ownedGames };
      }
    }

    return { status: 'noData' } as const;
  } catch (e) {
    console.error(e);
    throw new Error('Unexpected error ocurred.');
  }
};

export const suggestTag = async (suggestion: SuggestionSchema) => {
  const response = await fetch(
    'https://humble-steam-sync.haaxor1689.dev/api/mappings/suggest',
    { method: 'POST', body: JSON.stringify(suggestion) }
  );
  const parsed = (await response.json()) as
    | { status: 'exists' | 'created' | 'badRequest' }
    | { status: 'error'; message: string };
  return parsed;
};

export const getTagMappings = async () => {
  const response = await fetch(
    'https://humble-steam-sync.haaxor1689.dev/api/mappings/list'
  );
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
      return await steamLogIn(message.steamId);
    case 'getUserData':
      return await getUserData();
  }
});

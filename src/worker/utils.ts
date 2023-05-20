import { z } from 'zod';

const notUndef = <T extends unknown | undefined>(
  obj: T
): obj is Exclude<T, undefined> => !!obj;

export type Message =
  | { action: 'getUserData' }
  | { action: 'getOwnedGames'; steamId: string };

type AppList = { applist: { apps: { appid: number; name: string }[] } };

const UserData = z.object({
  rgOwnedApps: z.array(z.number()),
  rgWishlist: z.array(z.number()),
  rgIgnoredApps: z.preprocess(
    v => (v && typeof v === 'object' ? Object.keys(v).map(Number) : []),
    z.array(z.number())
  ),
  rgRecommendedApps: z.array(z.number())
});

const getOwnedGames = (steamId: string) =>
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
        } as const)
    );

const mapApps = (items: number[], apps: AppList) =>
  items
    .map(g => apps.applist.apps.find(a => a.appid == g)?.name)
    .filter(notUndef);

const getUserData = async () => {
  const userData = await fetch(
    'https://store.steampowered.com/dynamicstore/userdata/'
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
    cacheTime: new Date().toLocaleString()
  } as const;
};

export const callAction = (message: Message) => {
  try {
    switch (message.action) {
      case 'getUserData':
        return getUserData();
      case 'getOwnedGames':
        return getOwnedGames(message.steamId);
    }
  } catch (error) {
    return {
      status: 'error',
      message:
        error instanceof Error ? error.message : 'Unexpected error ocurred'
    } as const;
  }
};

export type MessageResponse = Awaited<ReturnType<typeof callAction>>;
export type LocalData = Omit<
  Extract<MessageResponse, { status: 'ok' }>,
  'status'
> & { steamId?: string; avatar?: string };

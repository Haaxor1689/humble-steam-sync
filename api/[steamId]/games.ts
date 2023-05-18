import { getSteamId } from '../_helpers';

export const config = {
  runtime: 'edge'
};

type Item = { name: string };

const getWishlistPages = async (
  steamId: string,
  page: number = 0
): Promise<Item[]> => {
  const response = await fetch(
    `https://store.steampowered.com/wishlist/profiles/${steamId}/wishlistdata/?p=${page}`
  );
  console.log('getWishlistPages', await response.text());
  if (!response.ok) return [];
  const parsed = await response.json();
  console.log('getWishlistPages', parsed);

  // const r = await axios.get(
  //   `https://store.steampowered.com/wishlist/profiles/${steamId}/wishlistdata/?p=${p}`
  // );
  // if (r.data.length === 0 || r.data.success === 2) return [];

  // const next = await getWishlistPages(steamId, page + 1);
  // return [...(Object.values(r.data) as Item[]), ...next];
  return parsed;
};

export default async function games(request: Request) {
  const steamId = await getSteamId(request);

  const response = await fetch(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${process.env.STEAM_API_KEY}&format=json&steamid=${steamId}&include_appinfo=true`
  )
    .then(r => r.json())
    .then((r: { response: { games: Item[] } }) =>
      r.response.games.map(v => v.name)
    );

  return new Response(JSON.stringify(response));
}

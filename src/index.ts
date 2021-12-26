import express from 'express';
import axios from 'axios';

require('dotenv').config();

type Item = { name: string };

const app = express();

const getWishlistPages = async (
  steamId: string,
  p: number = 0
): Promise<Item[]> => {
  const r = await axios.get(
    `https://store.steampowered.com/wishlist/profiles/${steamId}/wishlistdata/?p=${p}`
  );
  if (r.data.length === 0 || r.data.success === 2) return [];

  const next = await getWishlistPages(steamId, p + 1);
  return [...(Object.values(r.data) as Item[]), ...next];
};

const getOwnedGames = (steamId: string): Promise<Item[]> =>
  axios
    .get(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${process.env.STEAM_API_KEY}&format=json&steamid=${steamId}&include_appinfo=true`
    )
    .then(r => r.data.response?.games ?? []);

const resolveVanityUrl = (name: string) =>
  axios
    .get(
      `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${process.env.STEAM_API_KEY}&vanityurl=${name}`
    )
    .then(r => r.data.response?.steamid ?? '');

const getUserProfile = (steamId: string) =>
  axios
    .get(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`
    )
    .then(r => r.data.response?.players?.[0]);

app.get('/:steamId/games', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.humblebundle.com');
  try {
    let steamId = req.params.steamId;
    if (!steamId.match(/$\d+^/)) {
      steamId = await resolveVanityUrl(steamId);
    }

    const [wishlist, games] = await Promise.all([
      getWishlistPages(req.params.steamId),
      getOwnedGames(req.params.steamId)
    ]);
    res.send([
      ...wishlist.map(({ name }) => ({
        name,
        source: 'on wishlist'
      })),
      ...games.map(({ name }) => ({
        name,
        source: 'in library'
      }))
    ]);
  } catch (e) {
    res.status(500).send(e);
  }
});

app.get('/:name/profile', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    let name = req.params.name;
    if (!name.match(/$\d+^/)) {
      name = await resolveVanityUrl(name);
    }

    res.send(await getUserProfile(name));
  } catch (e) {
    res.status(500).send(e);
  }
});

// start the Express server
app.listen(process.env.PORT, () => {
  console.log(`Server started at http://localhost:${process.env.PORT}`);
});

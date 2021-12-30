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

const getSteamId = (steamId: string) =>
  axios
    .get(
      `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${process.env.STEAM_API_KEY}&vanityurl=${steamId}`
    )
    .then(r => r.data.response?.steamid ?? steamId);

const getUserProfile = (steamId: string) =>
  axios
    .get(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`
    )
    .then(r => r.data.response?.players?.[0]);

app.get('/:steamId/games', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.humblebundle.com');
  try {
    const steamId = await getSteamId(req.params.steamId);

    const [wishlist, library] = await Promise.all([
      getWishlistPages(steamId),
      getOwnedGames(steamId)
    ]);
    res.send({
      wishlist: wishlist.map(w => w.name),
      library: library.map(g => g.name)
    });
  } catch (e) {
    res.status(500).send(e);
  }
});

app.get('/:steamId/profile', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.humblebundle.com');
  try {
    const steamId = await getSteamId(req.params.steamId);
    res.send(await getUserProfile(steamId));
  } catch (e) {
    res.status(500).send(e);
  }
});

// start the Express server
app.listen(process.env.PORT, () => {
  console.log(`Server started at http://localhost:${process.env.PORT}`);
});

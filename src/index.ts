import express from 'express';
import axios from 'axios';
require('dotenv').config();

type Item = { name: string };
type GamesResponse = { data: { response: { games: { name: string }[] } } };

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

app.get('/:steamId', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.humblebundle.com');

  Promise.all([
    getWishlistPages(req.params.steamId),
    getOwnedGames(req.params.steamId)
  ])
    .then(([wishlist, games]) => {
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
    })
    .catch(e => {
      res.send(e);
    });
});

// start the Express server
app.listen(process.env.PORT, () => {
  console.log(`server started at http://localhost:${process.env.PORT}`);
});

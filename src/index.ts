import express from 'express';
import axios from 'axios';
require('dotenv').config();

type WishlistResponse = { data: Record<string, { name: string }> };
type GamesResponse = { data: { response: { games: { name: string }[] } } };

const app = express();

app.get('/:steamId', (req, res) => {
  Promise.all([
    axios.get(
      `https://store.steampowered.com/wishlist/profiles/${req.params.steamId}/wishlistdata/`
    ),
    axios.get(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${process.env.STEAM_API_KEY}&format=json&steamid=${req.params.steamId}&include_appinfo=true`
    )
  ])
    .then(
      ([{ data: wishlist }, { data: games }]: [
        WishlistResponse,
        GamesResponse
      ]) => {
        res.send([
          ...Object.values(wishlist).map(({ name }) => ({
            name,
            source: 'wishlist'
          })),
          ...games.response.games.map(({ name }) => ({
            name,
            source: 'owned'
          }))
        ]);
      }
    )
    .catch(e => {
      res.send(e);
    });
});

// start the Express server
app.listen(process.env.PORT, () => {
  console.log(`server started at http://localhost:${process.env.PORT}`);
});

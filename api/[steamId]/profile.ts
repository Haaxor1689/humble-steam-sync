import { getSteamId } from '../_helpers';

export const config = {
  runtime: 'edge'
};

export default async function profile(request: Request) {
  const steamId = await getSteamId(request);

  const response = await fetch(
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`
  )
    .then(r => r.json())
    .then(r => r.response.players[0]);

  return new Response(JSON.stringify(response));
}

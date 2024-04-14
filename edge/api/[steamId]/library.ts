import { getSteamId } from '../_helpers';

export const config = {
	runtime: 'edge'
};

type Item = { appid: number; name: string };

export default async function library(request: Request) {
	const steamId = await getSteamId(request);

	const response = await fetch(
		`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${process.env.STEAM_API_KEY}&format=json&steamid=${steamId}&include_appinfo=true`
	)
		.then(r => r.json())
		.then((r: { response: { games: Item[] } }) =>
			r.response.games.map(v => [v.name, v.appid])
		);

	return new Response(JSON.stringify(response));
}

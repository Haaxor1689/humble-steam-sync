import { getSteamId } from '../_helpers';

export const config = {
	runtime: 'edge'
};

export default async function profile(request: Request) {
	const steamId = await getSteamId(request);

	const response = await fetch(
		`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`
	);

	if (!response.ok) return new Response(JSON.stringify('null'));
	const json = await response.json();

	console.log('getUserProfile', json);

	return new Response(
		JSON.stringify({ steamId, avatar: json.response.players[0].avatarmedium })
	);
}

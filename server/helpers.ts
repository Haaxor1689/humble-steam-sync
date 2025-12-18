import z from 'zod';

export const getSteamId = async (steamId: string) => {
	const response = await fetch(
		`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${process.env.STEAM_API_KEY}&vanityurl=${steamId}`,
		{ headers: { 'Content-Type': 'application/json' } }
	).then(r => r.json());

	console.log('getSteamId', response);
	return response.response.steamid ?? steamId;
};

export const SuggestionSchema = z
	.object({
		steam_name: z.string().min(1),
		humble_name: z.string().min(1)
	})
	.strict();

export type GetAppListResponse = {
	apps: { appid: number; name: string }[];
	have_more_results: boolean;
	last_appid: number;
};

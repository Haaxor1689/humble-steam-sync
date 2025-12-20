import { type BunRequest } from 'bun';
import z from 'zod';

export const getSteamId = async (steamId: string) => {
	const r = await fetch(
		`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${process.env.STEAM_API_KEY}&vanityurl=${steamId}`,
		{ headers: { 'Content-Type': 'application/json' } }
	).then(r => r.json());
	return r.response.steamid ?? steamId;
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

export const route =
	<T extends string>(callback: (req: BunRequest<T>) => unknown) =>
	async (req: BunRequest<T>) => {
		try {
			console.log(`${req.method} ${req.url}`);
			const res = await callback(req);
			if (res instanceof Response) return res;
			return new Response(JSON.stringify(res));
		} catch (error) {
			console.error(`[ERROR] ${req.method} ${req.url}`, error);
			return new Response(JSON.stringify({ error: String(error) }), {
				status: 500
			});
		}
	};

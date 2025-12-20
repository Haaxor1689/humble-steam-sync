import type { NextFunction, Request, Response } from 'express';
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
	<T extends Request>(callback: (req: T) => Promise<unknown>) =>
	async (req: T, res: Response, _next: NextFunction) => {
		try {
			console.log(`${req.method} ${req.url}`);

			const result = await callback(req);

			if (result instanceof Response) {
				// Express can't send Web Response, so unwrap manually
				const body = await result.text();
				res.status(result.status).send(body);
				return;
			}

			res.json(result);
		} catch (error) {
			console.error(`[ERROR] ${req.method} ${req.url}`, error);
			res.status(500).json({ error: String(error) });
		}
	};

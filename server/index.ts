import express from 'express';
import path from 'path';
import z from 'zod';

import { db } from './db/index.js';
import { apps, suggestions } from './db/schema.js';
import {
	type GetAppListResponse,
	getSteamId,
	route,
	SuggestionSchema
} from './helpers.js';

const app = express();
app.use(express.json({ type: () => true }));

const __dirname = new URL('.', import.meta.url).pathname.slice(1);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/favicon.ico', (_, res) => {
	res.redirect(301, '/logo.png');
});

app.get(
	'/api/:steamId/library',
	route(async req => {
		const steamId = await getSteamId(req.params.steamId!);

		const r = await fetch(
			`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${process.env.STEAM_API_KEY}&format=json&steamid=${steamId}&include_appinfo=true`
		).then(r => r.json());

		type Item = { appid: number; name: string };
		const items = (r.response.games as Item[]).map(v => [v.name, v.appid]);

		return items;
	})
);

app.get(
	'/api/:steamId/profile',
	route(async req => {
		const steamId = await getSteamId(req.params.steamId!);

		const r = await fetch(
			`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`
		).then(r => r.json());

		return {
			steamId,
			avatar: r.response.players[0].avatarmedium
		};
	})
);

app.get(
	'/api/mappings/list',
	route(async () =>
		db.query.suggestions.findMany({
			columns: { approved: false }
		})
	)
);

app.post(
	'/api/mappings/suggest',
	route(async req => {
		const body = SuggestionSchema.safeParse(req.body);

		if (!body.success) {
			return {
				status: 'badRequest',
				message: body.error
			};
		}

		await db.insert(suggestions).values(body.data);
		return { status: 'created' };
	})
);

app.post(
	'/api/apps',
	route(async req => {
		const data = z.array(z.number()).parse(req.body);

		const cached = await db.query.apps.findMany({
			where: (app, { inArray }) => inArray(app.app_id, data)
		});

		const entries: [number, string | null][] = cached.map(v => [
			v.app_id,
			v.name
		]);

		const missing = data.filter(id => !cached.find(c => c.app_id === id));

		if (missing.length) {
			await Promise.allSettled(
				missing.map(async app_id => {
					const r = await fetch(
						`https://api.steampowered.com/IStoreService/GetAppList/v1/?key=${process.env.STEAM_API_KEY}&format=json&last_appid=${app_id - 1}&max_results=1`
					)
						.then(r => r.json())
						.then(r => r.response as GetAppListResponse);

					const e = r.apps[0];
					const name = e?.appid === app_id ? e.name : null;

					entries.push([app_id, name]);
					await db.insert(apps).values({ app_id, name });
				})
			);
		}

		return Object.fromEntries(entries.filter(([, name]) => name !== null));
	})
);

if (process.env.NODE_ENV !== 'production') {
	app.listen(3005, () => {
		console.log('Server running at http://localhost:3005');
	});
}

export default app;

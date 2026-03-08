import express from 'express';
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

app.get('/favicon.ico', (_, res) => {
	res.redirect(301, 'https://haaxor1689.dev/humble-steam-sync-logo.png');
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

		return { steamId, avatar: r.response.players[0].avatarmedium };
	})
);

// TODO: Remove after new version is released
app.get(
	'/api/mappings/list',
	route(async () => [])
);

// TODO: Remove after new version is released
app.post(
	'/api/mappings/suggest',
	route(async () => ({ status: 'created' }))
);

app.post(
	'/api/apps',
	route(async req => {
		const data = z.array(z.number()).parse(req.body).slice(0, 500);

		const cached = await db.query.apps.findMany({
			where: (app, { inArray }) => inArray(app.app_id, data)
		});
		const cachedIds = new Set(cached.map(v => v.app_id));

		const entries: [number, string | null][] = cached.map(v => [
			v.app_id,
			v.name
		]);

		const missing = data.filter(id => !cachedIds.has(id));

		if (missing.length) {
			const toInsert = await Promise.allSettled(
				missing.map(async app_id => {
					const r = await fetch(
						`https://api.steampowered.com/IStoreService/GetAppList/v1/?key=${process.env.STEAM_API_KEY}&format=json&last_appid=${app_id - 1}&max_results=1`
					)
						.then(r => r.json())
						.then(r => r.response as GetAppListResponse);

					const e = r.apps[0];
					const name = e?.appid === app_id ? e.name : null;

					entries.push([app_id, name]);
					return { app_id, name };
				})
			).then(r => r.filter(v => v.status === 'fulfilled').map(v => v.value));

			if (toInsert.length) await db.insert(apps).values(toInsert);
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

import { db } from './db';
import { apps, suggestions } from './db/schema';
import {
	type GetAppListResponse,
	getSteamId,
	route,
	SuggestionSchema
} from './helpers';

const server = Bun.serve({
	port: 3005,

	routes: {
		'/api/:steamId/library': route(async request => {
			const steamId = await getSteamId(request.params.steamId);

			type Item = { appid: number; name: string };
			return fetch(
				`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${process.env.STEAM_API_KEY}&format=json&steamid=${steamId}&include_appinfo=true`
			)
				.then(r => r.json())
				.then((r: { response: { games: Item[] } }) =>
					r.response.games.map(v => [v.name, v.appid])
				);
		}),

		'/api/:steamId/profile': route(async request => {
			const steamId = await getSteamId(request.params.steamId);

			const r = await fetch(
				`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`
			).then(r => r.json());

			return { steamId, avatar: r.response.players[0].avatarmedium };
		}),

		'/api/mappings/list': route(() =>
			db.query.suggestions.findMany({
				columns: { approved: false }
			})
		),

		'/api/mappings/suggest': route(async request => {
			const body = SuggestionSchema.safeParse(
				await request.json().catch(() => ({}))
			);

			if (!body.success)
				return new Response(
					JSON.stringify({ status: 'badRequest', message: body.error }),
					{ status: 400 }
				);

			await db.insert(suggestions).values(body.data);
			return { status: 'created' };
		}),

		'/api/apps': route(async request => {
			const data = (await request.json()) as number[];

			console.log(`Fetching names for ${data.length} apps.`);
			const cached = await db.query.apps.findMany({
				where: (app, { inArray }) => inArray(app.app_id, data)
			});

			console.log(`Found ${cached.length} cached apps.`);

			const entries = cached.map(
				v => [v.app_id, v.name] as [number, string | null]
			);
			const missing = data.filter(id => !cached.find(c => c.app_id === id));

			if (missing.length) {
				console.log(`Fetching ${missing.length} missing apps from Steam API.`);
				await Promise.allSettled(
					missing.map(async app_id => {
						const r = await fetch(
							`https://api.steampowered.com/IStoreService/GetAppList/v1/?key=${
								process.env.STEAM_API_KEY
							}&format=json&last_appid=${app_id - 1}&max_results=1`
						)
							.then(r => r.json())
							.then(r => r.response as GetAppListResponse);

						const e = r.apps[0];
						const name = e?.appid !== app_id ? null : e.name;
						entries.push([app_id, name]);
						await db.insert(apps).values({ app_id, name });
					})
				);
			}

			return Object.fromEntries(entries.filter(([, name]) => name !== null));
		})
	}
});

console.log(`Server running at ${server.url}`);

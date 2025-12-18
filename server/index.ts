import { db } from './db';
import { apps, suggestions } from './db/schema';
import {
	type GetAppListResponse,
	getSteamId,
	SuggestionSchema
} from './helpers';

const server = Bun.serve({
	port: 3005,

	routes: {
		'/api/:steamId/library': async request => {
			const steamId = await getSteamId(request.params.steamId);

			type Item = { appid: number; name: string };
			const response = await fetch(
				`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${process.env.STEAM_API_KEY}&format=json&steamid=${steamId}&include_appinfo=true`
			)
				.then(r => r.json())
				.then((r: { response: { games: Item[] } }) =>
					r.response.games.map(v => [v.name, v.appid])
				);

			return new Response(JSON.stringify(response));
		},

		'/api/:steamId/profile': async request => {
			const steamId = await getSteamId(request.params.steamId);

			const response = await fetch(
				`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`
			);

			if (!response.ok) return new Response(JSON.stringify('null'));
			const json = await response.json();

			console.log('getUserProfile', json);

			return new Response(
				JSON.stringify({
					steamId,
					avatar: json.response.players[0].avatarmedium
				})
			);
		},

		'/api/mappings/list': async () => {
			const suggestions = await db.query.suggestions.findMany({
				columns: { approved: false }
			});
			return new Response(JSON.stringify(suggestions));
		},

		'/api/mappings/suggest': async request => {
			const json = await request.json().catch(() => ({}));
			const body = SuggestionSchema.safeParse(json);
			if (body.success === false)
				return new Response(
					JSON.stringify({
						status: 'badRequest',
						message: body.error
					}),
					{ status: 400 }
				);

			await db.insert(suggestions).values(body.data);

			return new Response(JSON.stringify({ status: 'created' }));
		},

		'/api/apps': async request => {
			const data = (await request.json()) as number[];

			console.log(`Fetching names for ${data.length} apps.`);
			const cached = await db.query.apps.findMany({
				where: (app, { inArray }) => inArray(app.app_id, data)
			});

			console.log(`Found ${cached.length} cached apps.`);

			const entries = cached.map(v => [v.app_id, v.name] as [number, string]);
			const missing = data.filter(id => !cached.find(c => c.app_id === id));

			console.log(`Fetching ${missing.length} missing apps from Steam API.`);

			await Promise.allSettled(
				missing.map(async id => {
					const r = await fetch(
						`https://api.steampowered.com/IStoreService/GetAppList/v1/?key=${
							process.env.STEAM_API_KEY
						}&format=json&last_appid=${id - 1}&max_results=1`
					)
						.then(r => r.json())
						.then(r => r.response as GetAppListResponse);

					const e = r.apps[0];
					if (e?.appid !== id) {
						console.warn(`App ID ${id} not found in Steam App List.`);
						return;
					}

					entries.push([e.appid, e.name]);
					await db.insert(apps).values({ app_id: e.appid, name: e.name });
				})
			);

			return new Response(JSON.stringify(Object.fromEntries(entries)));
		}
	}
});

console.log(`Server running at ${server.url}`);

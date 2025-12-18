import { db } from '../db';
import * as schema from '../db/schema';
import { handler } from '../helpers';

export const config = {
	runtime: 'edge'
};

type GetAppListResponse = {
	apps: { appid: number; name: string }[];
	have_more_results: boolean;
	last_appid: number;
};

export default handler(async request => {
	const data = (await request.json()) as number[];

	const cached = await db.query.apps.findMany({
		where: (app, { inArray }) => inArray(app.app_id, data)
	});

	const entries = cached.map(v => [v.app_id, v.name] as [number, string]);
	const missing = data.filter(id => !cached.find(c => c.app_id === id));

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
			if (!e || e.appid !== id) {
				console.warn(`App ID ${id} not found in Steam App List.`);
				return;
			}

			entries.push([e.appid, e.name]);
			await db.insert(schema.apps).values({ app_id: e.appid, name: e.name });
		})
	);

	return new Response(JSON.stringify(Object.fromEntries(entries)));
});

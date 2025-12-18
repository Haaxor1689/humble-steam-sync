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

	const entries: [number, string][] = [];
	let hasMore = true;
	let lastId = data[0] - 1;
	do {
		const r = await fetch(
			`https://api.steampowered.com/IStoreService/GetAppList/v1/?key=${process.env.STEAM_API_KEY}&format=json&last_appid=${lastId}`
		)
			.then(r => r.json())
			.then(r => r.response as GetAppListResponse);

		entries.push(
			...r.apps
				.filter(v => data.includes(v.appid))
				.map(v => [v.appid, v.name] as [number, string])
		);

		// Fetch until we have all required apps
		hasMore = entries.length !== data.length && r.have_more_results;
		// Start next fetch from lowest unfetched app id
		lastId = (data.find(id => id > r.last_appid) ?? r.last_appid) - 1;
	} while (hasMore);

	return new Response(JSON.stringify(Object.fromEntries(entries)));
});

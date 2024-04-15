export const getSteamId = async (request: Request) => {
	console.log('GET', request.url);
	const steamId = new URLSearchParams(new URL(request.url).search).get(
		'steamId'
	);

	const response = await fetch(
		`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${process.env.STEAM_API_KEY}&vanityurl=${steamId}`,
		{ headers: { 'Content-Type': 'application/json' } }
	).then(r => r.json());

	console.log('getSteamId', response);
	return response.response.steamid ?? steamId;
};

export const handler =
	(callback: (req: Request) => Promise<Response>) => (req: Request) => {
		try {
			return callback(req);
		} catch (e) {
			return new Response(
				JSON.stringify({
					status: 'error',
					message: e instanceof Error ? e.message : 'Unexpected error'
				}),
				{ status: 500 }
			);
		}
	};

import { uniqBy } from 'es-toolkit';
import browser from 'webextension-polyfill';
import { z } from 'zod';

import { getCache, setCache } from './helpers';
import { CachedData, type Item, SuggestionSchema } from './schemas';

import { apiUrl } from '@/permissions';

const fetchUserLibrary = (steamName: string): Promise<Item[]> =>
	fetch(`${apiUrl}/${steamName}/library`).then(r => r.json());

const getWishlistPages = async (steamId: string, page = 0): Promise<Item[]> => {
	const response = await fetch(
		`https://store.steampowered.com/wishlist/profiles/${steamId}/wishlistdata/?p=${page}`
	);
	if (!response.ok) return [];
	const parsed = await response.json();

	if (parsed.length === 0 || parsed.success === 2) return [];

	const next = await getWishlistPages(steamId, page + 1);
	return [
		...(Object.entries(parsed) as [string, { name: string }][]).map(
			([id, v]) => [v.name, Number(id)] as Item
		),
		...next
	];
};

const UserData = z.object({
	rgOwnedApps: z.array(z.number()),
	rgWishlist: z.array(z.number()),
	rgIgnoredApps: z.preprocess(
		v => (v && typeof v === 'object' ? Object.keys(v).map(Number) : []),
		z.array(z.number())
	),
	rgRecommendedApps: z.array(z.number())
});

const mapApps = (items: number[], apps: Record<number, string>) =>
	items
		.map(g => (apps[g] ? ([apps[g], g] as Item) : undefined))
		.filter(g => g !== undefined);

const fetchStoreData = async () => {
	const userData = await fetch(
		`https://store.steampowered.com/dynamicstore/userdata/?cacheRefresh=${Math.random()}`
	)
		.then(r => r.json())
		.then(UserData.safeParse);

	if (!userData.success || !userData.data.rgOwnedApps.length)
		return { status: 'noData' } as const;

	const data = [
		...new Set([
			...userData.data.rgWishlist,
			...userData.data.rgOwnedApps,
			...userData.data.rgIgnoredApps,
			...userData.data.rgRecommendedApps
		]).values()
	];

	const apps = await fetch(`${apiUrl}/apps`, {
		method: 'POST',
		body: JSON.stringify(data)
	}).then(r => r.json());

	const parsed = CachedData.safeParse({
		status: 'ok',
		wishlist: mapApps(userData.data.rgWishlist, apps),
		library: mapApps(userData.data.rgOwnedApps, apps),
		ignored: mapApps(userData.data.rgIgnoredApps, apps),
		recommended: mapApps(userData.data.rgRecommendedApps, apps),
		cacheTime: new Date().toLocaleString(),
		store: true
	});

	if (!parsed.success) return { status: 'noData' } as const;
	return parsed.data;
};

const Api = {
	steamLogIn: async (rawName: string) => {
		const steamName =
			rawName.match(
				/^(?:https?:\/\/)?steamcommunity\.com\/(?:id|profiles)\/(\w+)\/?$/
			)?.[1] ?? rawName;

		if (!steamName) throw new Error('Invalid Steam Id');

		try {
			const { steamId, avatar } = await fetch(
				`${apiUrl}/${steamName}/profile`
			).then(r => r.json());

			const data = {
				steamId,
				steamName,
				avatar
			} satisfies Partial<CachedData>;
			await setCache(data);
			return data;
		} catch (e) {
			console.error(e);
			throw new Error('Steam account not found');
		}
	},

	getUserData: async (): Promise<CachedData> => {
		const cache = await getCache();

		// Check 1 hour cache time
		// Skip cache if store data is not loaded
		if (
			cache.store &&
			cache.cacheTime &&
			new Date().getTime() - new Date(cache.cacheTime).getTime() <
				1000 * 60 * 60
		)
			return cache;

		let mergedData = cache;
		try {
			console.log('[HSS] Fetching store data');
			const storeData = await fetchStoreData();

			if (storeData.status === 'ok') {
				mergedData = { ...mergedData, ...storeData };
			}

			if (cache.steamId) {
				console.log('[HSS] Fetching owned games');
				const library = await fetchUserLibrary(cache.steamId);
				const wishlist = await getWishlistPages(cache.steamId);

				mergedData = {
					...mergedData,
					library: uniqBy([...mergedData.library, ...library], v => v[1]),
					wishlist: uniqBy([...mergedData.wishlist, ...wishlist], v => v[1]),
					cacheTime: new Date().toLocaleString()
				};
			}

			if (storeData.status !== 'ok' && !cache.steamId)
				return CachedData.parse({ status: 'noData' });

			await setCache(mergedData);
			return mergedData;
		} catch (e) {
			console.error(e);
			throw new Error('Unexpected error ocurred.');
		}
	},

	suggestTag: async (suggestion: SuggestionSchema) => {
		const response = await fetch(`${apiUrl}/mappings/suggest`, {
			method: 'POST',
			body: JSON.stringify(suggestion)
		});
		const parsed = (await response.json()) as
			| { status: 'created' | 'badRequest' }
			| { status: 'error'; message: string };
		return parsed;
	},

	getTagMappings: async () => {
		try {
			const response = await fetch(`${apiUrl}/mappings/list`);
			if (!response.ok) return [];
			const json = await response.json();
			const parsed = z.array(SuggestionSchema).parse(JSON.parse(json));
			console.log('[HSS] Mappings:', parsed);
			return parsed;
		} catch (e) {
			console.error(e);
			return [];
		}
	}
} as const;

export type ApiMethods = keyof typeof Api;
export type ApiMethodsData<T extends ApiMethods> = Parameters<(typeof Api)[T]>;
export type ApiMethodsReturn<T extends ApiMethods> = ReturnType<
	(typeof Api)[T]
>;

browser.runtime.onMessage.addListener(
	async <T extends ApiMethods>(message: {
		action: T;
		data: ApiMethodsData<T>;
	}) => {
		console.log('[HSS] Received message:', message);
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		return Api[message.action](...message.data);
	}
);

import { uniqBy } from 'es-toolkit';
import browser from 'webextension-polyfill';

import { safeFetch, Storage } from './helpers';
import { type Item, UserData } from './schemas';

const mapApps = (items: number[], apps: Record<number, string>) =>
	items
		.map(g => (apps[g] ? ([apps[g], g] as Item) : undefined))
		.filter(g => g !== undefined);

const fetchStoreData = async () => {
	const userData = await safeFetch(
		`https://store.steampowered.com/dynamicstore/userdata/?cacheRefresh=${Math.random()}`
	).then(UserData.parse);

	const maxAppsPerRequest = 500;
	const uniqueAppIds = [
		...new Set([
			...userData.rgWishlist,
			...userData.rgOwnedApps,
			...userData.rgIgnoredApps,
			...userData.rgRecommendedApps
		]).values()
	];

	const apps: Record<number, string> = {};
	for (let i = 0; i < uniqueAppIds.length; i += maxAppsPerRequest) {
		const response = await safeFetch<Record<number, string>>('/apps', {
			method: 'POST',
			body: JSON.stringify(uniqueAppIds.slice(i, i + maxAppsPerRequest))
		});

		Object.assign(apps, response);
	}

	return {
		wishlist: mapApps(userData.rgWishlist, apps),
		library: mapApps(userData.rgOwnedApps, apps),
		ignored: mapApps(userData.rgIgnoredApps, apps),
		recommended: mapApps(userData.rgRecommendedApps, apps)
	};
};

export const Api = {
	steamLogIn: {
		query: async (rawName?: string) => {
			if (!rawName) {
				await Storage.set('steamName', undefined);
				return null;
			}

			const steamName =
				rawName.match(
					/^(?:https?:\/\/)?steamcommunity\.com\/(?:id|profiles)\/(\w+)\/?$/
				)?.[1] ?? rawName;

			if (!steamName) throw new Error('Invalid Steam Id');

			try {
				const { steamId, avatar } = await safeFetch<{
					steamId: string;
					avatar: string;
				}>(`/${steamName}/profile`);

				await Storage.set('steamName', steamName);
				return { steamId, steamName, avatar };
			} catch (e) {
				console.error(e);
				throw new Error('Steam account not found');
			}
		},
		ttl: 60 * 60
	},

	getUserData: {
		query: async (steamId?: string) => {
			const [storeData, library = []] = await Promise.all([
				fetchStoreData(),
				steamId ? safeFetch<Item[]>(`/${steamId}/library`) : undefined
			]);

			return {
				...storeData,
				library: uniqBy([...storeData.library, ...library], v => v[1])
			};
		},
		ttl: 60 * 60
	}
} as const;

export type ApiMethods = keyof typeof Api;
export type ApiMethodsArgs<T extends ApiMethods> = Parameters<
	(typeof Api)[T]['query']
>;
export type ApiMethodsReturn<T extends ApiMethods> = ReturnType<
	(typeof Api)[T]['query']
>;

const pendingFetches = new Map<string, Promise<unknown>>();

browser.runtime.onMessage.addListener(
	async <T extends ApiMethods>(message: {
		action: T;
		data: ApiMethodsArgs<T>;
	}) => {
		const key = `${message.action}${JSON.stringify(message.data)}`;

		const pending = pendingFetches.get(key);
		if (pending) {
			console.log(`[HSS][Worker] Deduped ${key}`);
			return pending;
		}

		console.log(`[HSS][Worker] Calling ${key}`);
		const query = Api[message.action].query as unknown as (
			...args: ApiMethodsArgs<T>
		) => ApiMethodsReturn<T>;

		const promise = query(...message.data).finally(() =>
			pendingFetches.delete(key)
		);

		pendingFetches.set(key, promise as Promise<unknown>);
		return await promise;
	}
);

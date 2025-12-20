import browser from 'webextension-polyfill';

import {
	Api,
	type ApiMethods,
	type ApiMethodsArgs,
	type ApiMethodsReturn
} from '.';

import { apiUrl } from '@/permissions';

export const callApi = async <T extends ApiMethods>(
	action: T,
	...data: ApiMethodsArgs<T>
): Promise<Awaited<ApiMethodsReturn<T>>> => {
	const key = `${action}${JSON.stringify(data)}`;

	const cached = await Storage.get<Awaited<ApiMethodsReturn<T>>>(key);
	if (cached !== undefined) {
		console.log(`[API] Using cached ${action} with`, data);
		return cached;
	}

	console.log(`[API] Calling ${action} with`, data);
	browser.storage.local.get().then(r => console.log(r));
	const result = await browser.runtime.sendMessage({ action, data });

	const ttl = Api[action].ttl;
	if (ttl) await Storage.set(key, result, ttl);

	return result;
};

export const revalidateApi = async <T extends ApiMethods>(
	action: T,
	...args: ApiMethodsArgs<T>
) => Storage.set(`${action}${JSON.stringify(args)}`, undefined);

export const Storage = {
	get: async <T>(key: string) => {
		const entry = await browser.storage.local.get(key).then(r => r[key]);
		if (!entry) {
			console.log(`[Storage] Missing ${key}`);
			return undefined;
		}
		if (entry.expiresAt !== 0 && entry.expiresAt < Date.now()) {
			console.log(`[Storage] Expired ${key}`);
			await browser.storage.local.remove(key);
			return undefined;
		}
		console.log(`[Storage] Hit ${key}`, entry);
		return entry.data as T;
	},
	set: async (key: string, data: unknown, ttl?: number) => {
		if (data === undefined) {
			await browser.storage.local.remove(key);
			return;
		}
		await browser.storage.local.set({
			[key]: { expiresAt: ttl ? Date.now() + ttl * 1000 : 0, data }
		});
	},
	clear: () => browser.storage.local.clear()
};

export const safeFetch = async <T = unknown>(
	url: string,
	options?: RequestInit
) => {
	const response = await fetch(
		url.startsWith('http') ? url : `${apiUrl}${url}`,
		options
	);
	if (!response.ok) throw new Error(`Returned status ${response.status}`);
	const text = await response.text();
	try {
		return JSON.parse(text) as T;
	} catch {
		console.error(`[Fetch] Invalid JSON response for ${url}:`, { text });
		throw new Error('Invalid JSON response');
	}
};

import browser from 'webextension-polyfill';

import { type ApiMethods, type ApiMethodsData, type ApiMethodsReturn } from '.';
import { CachedData } from './schemas';

export const sendWorkerMessage = async <T extends ApiMethods>(
	action: T,
	...data: ApiMethodsData<T>
): Promise<Awaited<ApiMethodsReturn<T>>> =>
	browser.runtime.sendMessage({ action, data });

export const setCache = async (data: Partial<CachedData>) => {
	await browser.storage.local.set(data);
};

export const getCache = async () => {
	try {
		const rawCache = await browser.storage.local.get(null);
		console.log('[HSS] Cache:', rawCache);
		return CachedData.parse(rawCache);
	} catch (e) {
		console.error(e);
		return CachedData.parse({});
	}
};

export const clearCache = async () => {
	await browser.storage.local.clear();
};

import browser from 'webextension-polyfill';
import { callAction, LocalData, type Message } from './utils';

browser.runtime.onMessage.addListener(async (message: Message) => {
  const cache = (await browser.storage.local.get(null)) as LocalData;

  console.log('Received message:', message);
  console.log('Cache:', cache);

  // Check 1 hour cache time
  if (
    cache.cacheTime &&
    new Date().getTime() - new Date(cache.cacheTime).getTime() < 1000 * 60 * 60
  )
    return cache;

  try {
    const response = await callAction(message);
    console.log('Returning data:', response);

    if (response.status === 'ok') await browser.storage.local.set(response);

    return response;
  } catch (e) {
    console.error(e);

    return { status: 'error', message: 'Unexpected error ocurred.' };
  }
});

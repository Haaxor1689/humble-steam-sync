import browser from 'webextension-polyfill';
import { callAction, type Message } from './utils';

browser.runtime.onMessage.addListener(async (message: Message) => {
  const { cacheTime, wishlist, library } = await browser.storage.local.get([
    'cacheTime',
    'wishlist',
    'library'
  ]);

  console.log('Received message:', message);

  // Check 1 hour cache time
  if (new Date().getTime() - new Date(cacheTime).getTime() < 1000 * 60 * 60) {
    return { wishlist, library };
  }

  const response = await callAction(message);

  if (response.status === 'ok') await browser.storage.local.set(response);

  return response;
});

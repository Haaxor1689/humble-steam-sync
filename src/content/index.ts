import browser from 'webextension-polyfill';

import './content.css';

const toastElem = document.createElement('div');
toastElem.className = 'hss-toast';

const titleElem = document.createElement('h3');
titleElem.innerText = 'Steam tags extension';
titleElem.className = 'hss-title';
toastElem.appendChild(titleElem);

const contentElem = document.createElement('p');
contentElem.innerText = '...';
contentElem.className = 'hss-content';
toastElem.appendChild(contentElem);

document.body.appendChild(toastElem);

const removeHighlight = () =>
  setTimeout(() => toastElem.classList.remove('hss-highlight'), 2000);

const getItemName = (item: Element) =>
  // Library
  (
    item.querySelector('.text-holder h2')?.innerText ??
    // Keys
    item.querySelector('.game-name h4')?.innerText ??
    // Choice
    item.querySelector('.content-choice-title')?.innerText ??
    item.querySelector('[data-machine-name]')?.dataset.machineName ??
    // Bundle
    item.querySelector('.item-title')?.innerText ??
    // Store
    item.querySelector('.entity-title')?.innerText ??
    ''
  )
    .replace(/ \(Steam\)/i, '')
    .replace(/\W/g, '')
    .replace(/_/g, '')
    .toLowerCase();

const getItemElements = (node: Element) =>
  'querySelectorAll' in node
    ? [
        // Library
        ...(node.classList?.contains('subproduct-selector') ? [node] : []),
        ...node.querySelectorAll('.subproduct-selector'),
        // Keys
        ...[
          node.localName === 'tr' ? node : undefined,
          ...node.querySelectorAll('tr')
        ].filter(n => n?.querySelector('.platform .hb-steam')),
        // Choice
        ...node.querySelectorAll('.content-choice'),
        // Bundle
        ...node.querySelectorAll('.tier-item-view'),
        // Store
        ...[...node.querySelectorAll('.entity')].filter(n =>
          n.querySelector('.entity-pricing')
        )
      ].filter(n => !n.querySelector('.hss-tag'))
    : [];

const matchesItem = (game: string) => (item: string) =>
  game === item.replace(/\W/g, '').toLowerCase();

/**
 * @param {{ wishlist: string[]; library: string[]; ignored: string[] }} response
 * @returns {((item: Element) => void)}
 */
const insertTag =
  ({ wishlist, library, ignored }) =>
  (item: Element) => {
    const game = getItemName(item);

    const wish = wishlist?.find(matchesItem(game));
    const lib = library?.find(matchesItem(game));
    const ign = ignored?.find(matchesItem(game));

    const source = wish
      ? 'on wishlist'
      : lib
      ? 'in library'
      : ign
      ? 'ignored'
      : undefined;
    if (!source) return;

    const tagElem = document.createElement('a');
    tagElem.href = `https://store.steampowered.com/search/?term=${
      wish ?? lib ?? ign
    }`;
    tagElem.target = `_blank`;
    tagElem.innerText = source;
    tagElem.className = 'hss-tag';
    tagElem.dataset.source = source;

    if (ign) item.classList.add('hss-ignored');

    if (item.localName === 'tr') {
      const td = item.querySelector('.platform');
      td.style = 'position: relative';
      td.appendChild(tagElem);
      return;
    }

    item.appendChild(tagElem);
  };

/** @param {{ wishlist: string[]; library: string[] }} response */
const processResponse = r => {
  removeHighlight();
  if ('error' in r) {
    console.error(r.error);
    toastElem.classList.add('hss-shake');
    contentElem.innerText = 'An error occurred';
    return;
  }
  getItemElements(document).forEach(insertTag(r));
  contentElem.innerText = 'Wishlist and library info added';
};

browser.storage.local.get('steamId').then(({ steamId }) => {
  toastElem.classList.add('hss-highlight');
  contentElem.innerText = 'Loading...';
  browser.runtime.sendMessage({ action: 'getUserData' }).then(r => {
    if (!r.noUserData) {
      processResponse(r);
      return;
    }

    if (!steamId) {
      toastElem.classList.add('hss-shake');
      contentElem.innerText =
        'Please login to Steam store or enter your SteamId in extension settings';
      removeHighlight();
      return;
    }

    return browser.runtime
      .sendMessage({ action: 'getOwnedGames', steamId })
      .then(processResponse);
  });
});

new MutationObserver(mutations => {
  browser.storage.local.get(null).then(data =>
    mutations
      .filter(m => m.type === 'childList')
      .flatMap(m => [...m.addedNodes].flatMap(getItemElements))
      .forEach(insertTag(data))
  );
}).observe(document.querySelector('body')!, {
  subtree: true,
  childList: true
});

const backgroundStyle = {
  'on wishlist':
    'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAKCAYAAABi8KSDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QTM3OEVDNTUyMUM0MTFFNDgxN0ZEN0MzNjYzNzcxOTYiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QTM3OEVDNTYyMUM0MTFFNDgxN0ZEN0MzNjYzNzcxOTYiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpBMzc4RUM1MzIxQzQxMUU0ODE3RkQ3QzM2NjM3NzE5NiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpBMzc4RUM1NDIxQzQxMUU0ODE3RkQ3QzM2NjM3NzE5NiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Ps9jzFQAAACPSURBVHjaYvz//z+DkJDQdQYGhpsMCMAKxMZAHPXu3bt9cFGQYkFBwQ0gGoaBfAEgzgfibUDsBxNnYsAOfgKxJBBvAeIZMEEWZBVA52xA5gOdUAEUc8NQDBTkBEoGMOAByCYLAjUsRzM5AKtioMQzIEW0ydjcHIBTMSE3M0Ij5RKQfQ6HGiOgIXogBkCAAQDGVT+0v+n6EQAAAABJRU5ErkJggg==) no-repeat 4px 4px #d3deea',
  'in library':
    'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAKCAYAAABi8KSDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6OUNDNzBFNTUyMUM0MTFFNDk1REVFODRBNUU5RjA2MUYiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OUNDNzBFNTYyMUM0MTFFNDk1REVFODRBNUU5RjA2MUYiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo5Q0M3MEU1MzIxQzQxMUU0OTVERUU4NEE1RTlGMDYxRiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo5Q0M3MEU1NDIxQzQxMUU0OTVERUU4NEE1RTlGMDYxRiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pv3vUKAAAAAlSURBVHjaYvz//z8DsYARpFhISAivjnfv3jGSp3jUGeQ4AyDAADZHNe2nyOBrAAAAAElFTkSuQmCC) no-repeat 4px 4px #4F95BD'
};

const toastElem = document.createElement('div');
toastElem.className = 'hss-toast';

const titleElem = document.createElement('h3');
titleElem.innerText = 'Humble Steam Sync extension';
titleElem.className = 'hss-title';
toastElem.appendChild(titleElem);

const contentElem = document.createElement('p');
contentElem.innerText = '...';
contentElem.className = 'hss-content';
toastElem.appendChild(contentElem);

document.body.appendChild(toastElem);

const removeHighlight = () =>
  setTimeout(() => toastElem.classList.remove('hss-highlight'), 2000);

/** @param {string} steamId */
const getOwnedGames = steamId =>
  fetch(`https://humble-steam-sync.herokuapp.com/${steamId}/games`).then(r =>
    r.json()
  );

/** @param {Element} item */
const getItemName = item =>
  (
    item.querySelector('[data-machine-name]')?.dataset.machineName ??
    item.querySelector('.item-title')?.innerText ??
    item.querySelector('.entity-title')?.innerText ??
    ''
  )
    .replace(/\W/g, '')
    .toLowerCase();

/** @param {Element} node */
const getItemElements = node =>
  'querySelectorAll' in node
    ? [
        ...node.querySelectorAll('.content-choice'),
        ...node.querySelectorAll('.tier-item-view'),
        ...[...node.querySelectorAll('.entity')].filter(n =>
          n.querySelector('.entity-pricing')
        )
      ]
    : [];

/**
 * @param {string} game
 * @returns {((item: string) => boolean)}
 */
const matchesItem = game => item =>
  item.replace(/\W/g, '').toLowerCase() === game;

/**
 * @param {{ wishlist: string[]; library: string[] }} response
 * @returns {((item: Element) => void)}
 */
const insertTag =
  ({ wishlist, library }) =>
  item => {
    if (item.querySelector('.hss-tag')) return;

    const game = getItemName(item);
    const source = wishlist?.find(matchesItem(game))
      ? 'on wishlist'
      : library?.find(matchesItem(game))
      ? 'in library'
      : undefined;
    if (!source) return;

    const tagElem = document.createElement('div');
    tagElem.innerText = source;
    tagElem.className = 'hss-tag';
    tagElem.style = `background: ${backgroundStyle[source]};`;
    item.appendChild(tagElem);
  };

/** @param {{ wishlist: string[]; library: string[] }} response */
const processResponse = ({ wishlist, library }) => {
  chrome.storage.local.set({
    cacheTime: new Date().toLocaleString(),
    wishlist,
    library
  });
  getItemElements(document).forEach(insertTag({ wishlist, library }));
  contentElem.innerText = 'Wishlist and library info added';
};

chrome.storage.sync.get('steamId').then(({ steamId }) => {
  toastElem.classList.add('hss-highlight');
  if (!steamId) {
    toastElem.classList.add('hss-shake');
    contentElem.innerText = 'Please enter your SteamId in extension settings';
    removeHighlight();
    return;
  }

  contentElem.innerText = 'Loading...';
  chrome.storage.local
    .get(['cacheTime', 'wishlist', 'library'])
    .then(({ cacheTime, wishlist, library }) => {
      // Check 1 hour cache time
      if (new Date() - new Date(cacheTime) < 1000 * 60 * 60) {
        return { wishlist, library };
      }
      return getOwnedGames(steamId);
    })
    .then(processResponse)
    .catch(e => {
      console.error(e);
      toastElem.classList.add('hss-shake');
      contentElem.innerText = 'Network error occurred';
    })
    .finally(removeHighlight);
});

const tagger = new MutationObserver(mutations =>
  chrome.storage.local.get(null).then(data =>
    mutations
      .filter(m => m.type === 'childList')
      .flatMap(m => [...m.addedNodes].flatMap(getItemElements))
      .forEach(insertTag(data))
  )
);

[document.querySelector('body')]
  .filter(n => n)
  .map(n =>
    tagger.observe(n, {
      subtree: true,
      childList: true
    })
  );

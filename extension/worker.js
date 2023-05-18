/** @param {string} steamId */
const getOwnedGames = steamId =>
  fetch(`https://humble-steam-sync.herokuapp.com/${steamId}/games`)
    .then(r => r.json())
    .then(r => ({ ...r, ignored: [] }));

const mapAppIdToName = apps => g =>
  [g, apps.applist.apps.find(a => a.appid == g)?.name];

const getUserData = () =>
  fetch('https://store.steampowered.com/dynamicstore/userdata/')
    .then(r => r.json())
    .then(r => {
      if (!r.rgOwnedApps.length) return { noUserData: true };
      return fetch('https://api.steampowered.com/ISteamApps/GetAppList/v2/')
        .then(apps => apps.json())
        .then(apps => ({
          wishlist: r.rgWishlist.map(mapAppIdToName(apps)).filter(v => v[1]),
          library: r.rgOwnedApps.map(mapAppIdToName(apps)).filter(v => v[1]),
          ignored: Object.keys(r.rgIgnoredApps)
            .map(mapAppIdToName(apps))
            .filter(v => v[1])
        }));
    });

browser.runtime.onMessage.addListener(message =>
  browser.storage.local
    .get(['cacheTime', 'wishlist', 'library'])
    .then(({ cacheTime, wishlist, library }) => {
      console.log('Received message:', message);
      // Check 1 hour cache time
      if (new Date() - new Date(cacheTime) < 1000 * 60 * 60) {
        return { wishlist, library };
      }
      switch (message.action) {
        case 'getUserData':
          return getUserData();
        case 'getOwnedGames':
          return getOwnedGames(message.steamId);
      }
      throw `Unknown action "${message.action}"`;
    })
    .then(r => {
      if (r.noUserData) return r;
      const data = {
        cacheTime: new Date().toLocaleString(),
        wishlist: r.wishlist,
        library: r.library,
        ignored: r.ignored
      };
      console.log('Returned data: ', data);
      browser.storage.local.set(data);
      return data;
    })
    .catch(error => {
      console.error('Returned data: ', error);
      return { error: error.message };
    })
);

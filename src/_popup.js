const body = document.querySelector('body');
const form = document.querySelector('form');
// const loginElem = document.getElementById('store-login');
const logoutElem = document.getElementById('logout');
const avatarElem = document.getElementById('avatar');
const input = document.getElementById('input');
// const buttonElem = document.getElementById('submit-button');
const loaderElem = document.querySelector('.lds-ring');
const errorElem = document.getElementById('error');
const savedDataElem = document.getElementById('saved-data');
const savedWishlistElem = document.getElementById('saved-wishlist');
const savedLibraryElem = document.getElementById('saved-library');
const savedIgnoredElem = document.getElementById('saved-ignored');
const savedTimeElem = document.getElementById('saved-time');
const resetButtonElem = document.getElementById('reset-button');

// let loading = true;

// const startLoading = () => {
//   buttonElem.className = 'loading';
//   loginElem.className = 'loading';
//   loading = true;
// };

// const stopLoading = () => {
//   buttonElem.className = undefined;
//   loginElem.className = undefined;
//   loading = false;
// };

const updateValues = (storage, error, steamId, avatar) => {
  storage &&
    browser.storage.local.set({
      steamId: steamId ?? '',
      avatar: avatar ?? ''
    });
  storage && updateSavedData({});

  if (!steamId) {
    body.classList.remove('steam-id');
    input.disabled = false;
  }

  errorElem.innerText = error;
  errorElem.style = !error ? 'display: none;' : undefined;
  input.value = steamId ?? '';
  avatarElem.style = avatar ? `background-image: url(${avatar})` : undefined;
};

const updateSavedData = ({ cacheTime, wishlist, library, ignored }) => {
  !cacheTime
    ? savedDataElem.classList.add('no-data')
    : savedDataElem.classList.remove('no-data');

  !cacheTime && body.classList.remove('store');

  savedTimeElem.innerText = cacheTime;
  savedWishlistElem.innerText = wishlist?.length ?? '-';
  savedLibraryElem.innerText = library?.length ?? '-';
  savedIgnoredElem.innerText = ignored?.length ?? '-';
};

// On load
browser.storage.local
  .get(null)
  .then(({ steamId, avatar, ...data }) => {
    updateSavedData(data);
    updateValues(false, '', steamId, avatar);
    if (steamId) {
      // If has steam id, return
      body.classList.add('steam-id');
      input.disabled = true;
      return;
    }
    // If doesn't have steam id but have saved data, logged in through store
    data.cacheTime && body.classList.add('store');
  })
  .finally(stopLoading);

form.addEventListener('submit', e => {
  e.preventDefault();
  if (loading) return;
  startLoading();

  const steamId =
    input.value.match(
      /^(?:https?:\/\/)?steamcommunity\.com\/(?:id|profiles)\/(\w+)\/?$/
    )?.[1] ?? input.value;

  if (!steamId) return;

  fetch(`https://humble-steam-sync.haaxor1689.dev/api/${steamId}/profile`)
    .then(r => r.json())
    .then(profile => {
      if (!profile) {
        updateValues(true, 'No player found');
        return;
      }
      updateValues(true, '', steamId, profile.avatarmedium);
      body.classList.add('steam-id');
      input.disabled = true;
      return browser.runtime
        .sendMessage({ action: 'getOwnedGames', steamId })
        .then(updateSavedData);
    })
    .catch(() => updateValues(true, 'An error occurred'))
    .finally(stopLoading);
});

// resetButtonElem.addEventListener('click', e => {
//   e.preventDefault();
//   browser.storage.local.clear();
//   updateValues();
//   updateSavedData({});
// });

// logoutElem.addEventListener('click', e => {
//   e.preventDefault();
//   browser.storage.local.clear();
//   updateValues();
//   updateSavedData({});
// });

// loginElem.addEventListener('click', e => {
//   e.preventDefault();
//   if (loading) return;
//   startLoading();

//   browser.runtime
//     .sendMessage({ action: 'getUserData' })
//     .then(r => {
//       if (r.noUserData) {
//         updateValues(
//           false,
//           'Looks like you are not logged in through store.steampowered.com'
//         );
//         return;
//       }
//       body.classList.add('store');
//       updateSavedData(r);
//     })
//     .finally(stopLoading);
// });

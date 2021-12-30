const form = document.querySelector('form');
const avatarElem = document.getElementById('avatar');
const input = document.getElementById('input');
const buttonElem = document.getElementById('submit-button');
const loaderElem = document.querySelector('.lds-ring');
const errorElem = document.getElementById('error');
const savedDataElem = document.getElementById('saved-data');
const savedWishlistElem = document.getElementById('saved-wishlist');
const savedLibraryElem = document.getElementById('saved-library');
const savedIgnoredElem = document.getElementById('saved-ignored');
const savedTimeElem = document.getElementById('saved-time');
const resetButtonElem = document.getElementById('reset-button');

let loading = false;

const updateValues = (storage, error, steamId, avatar) => {
  storage &&
    chrome.storage.sync.set({
      steamId: steamId ?? '',
      avatar: avatar ?? ''
    });
  storage && updateSavedData({});

  errorElem.innerText = error;
  errorElem.style = !error ? 'display: none;' : undefined;
  input.value = steamId ?? '';
  avatarElem.style = avatar ? `background-image: url(${avatar})` : undefined;
};

chrome.storage.sync
  .get(['steamId', 'avatar'])
  .then(({ steamId, avatar }) => updateValues(false, '', steamId, avatar));

form.addEventListener('submit', e => {
  e.preventDefault();
  if (loading) return;

  buttonElem.className = 'loading';
  loading = true;

  const steamId =
    input.value.match(
      /^(?:https?:\/\/)?steamcommunity\.com\/(?:id|profiles)\/(\w+)\/?$/
    )?.[1] ?? input.value;

  fetch(`https://humble-steam-sync.herokuapp.com/${steamId}/profile`)
    .then(r => r.json())
    .then(profile => {
      if (!profile) {
        updateValues(true, 'No player found');
        return;
      }
      updateValues(true, '', steamId, profile.avatarmedium);
      chrome.runtime.sendMessage({ action: 'getOwnedGames', steamId });
    })
    .catch(() => updateValues(true, 'An error occurred'))
    .finally(() => {
      buttonElem.className = undefined;
      loading = false;
    });
});

const updateSavedData = ({ cacheTime, wishlist, library, ignored }) => {
  if (!cacheTime) {
    savedDataElem.classList.add('no-data');
    return;
  }
  savedTimeElem.innerText = cacheTime;
  savedWishlistElem.innerText = wishlist?.length ?? '-';
  savedLibraryElem.innerText = library?.length ?? '-';
  savedIgnoredElem.innerText = ignored?.length ?? '-';
};

chrome.storage.local.get(null).then(updateSavedData);

resetButtonElem.addEventListener('click', e => {
  e.preventDefault();
  chrome.storage.local.clear();
  updateSavedData({});
});

const form = document.querySelector('form');
const avatarElem = document.getElementById('avatar');
const input = document.getElementById('input');
const buttonElem = document.getElementById('submit-button');
const loaderElem = document.querySelector('.lds-ring');
const errorElem = document.getElementById('error');
const savedDataElem = document.getElementById('saved-data');
const savedWishlistElem = document.getElementById('saved-wishlist');
const savedLibraryElem = document.getElementById('saved-library');
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

  fetch(`https://humble-steam-sync.herokuapp.com/${input.value}/profile`)
    .then(r => r.json())
    .then(profile => {
      if (!profile) {
        updateValues(true, 'No player found');
        return;
      }
      updateValues(true, '', input.value, profile.avatarmedium);
    })
    .catch(() => updateValues(true, 'Network error occurred'))
    .finally(() => {
      buttonElem.className = undefined;
      loading = false;
    });
});

const updateSavedData = ({ cacheTime, wishlist, library }) => {
  if (!cacheTime) {
    savedDataElem.classList.add('no-data');
    return;
  }
  savedTimeElem.innerText = cacheTime;
  savedWishlistElem.innerText = wishlist.length;
  savedLibraryElem.innerText = library.length;
};

chrome.storage.local.get(null).then(updateSavedData);

resetButtonElem.addEventListener('click', e => {
  e.preventDefault();
  chrome.storage.local.clear();
  updateSavedData({});
});

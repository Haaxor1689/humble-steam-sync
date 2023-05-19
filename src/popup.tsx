import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';
import cls from 'classnames';
import {
  useQuery,
  useMutation,
  QueryClientProvider,
  QueryClient
} from '@tanstack/react-query';

const App = () => {
  const response = useQuery(['data'], async () => {
    const d = browser.storage.local.get(null);
    // TODO:
    return d;
  });

  const getUserData = useMutation(() =>
    browser.runtime.sendMessage({
      action: 'getUserData'
    })
  );

  const loading = response.isLoading || getUserData.isLoading;

  return (
    <>
      <h1>Settings</h1>
      <button id="logout">Log out</button>
      <div id="store-login-info">
        <div>
          <div>
            Try logging in with
            <a href="https://store.steampowered.com/" target="_blank">
              store.steampowered.com
            </a>
            :
          </div>
          <button
            type="button"
            className={cls({ loading })}
            onClick={async () => {
              if (loading) return;

              const r = await getUserData.mutateAsync();

              // if (r.noUserData) {
              //   updateValues(
              //     false,
              //     'Looks like you are not logged in through store.steampowered.com'
              //   );
              //   return;
              // }
              // body.classList.add('store');
              // updateSavedData(r);
            }}
          >
            <div className="loader"></div>
            <span>Log in</span>
          </button>
        </div>
        <strong>or</strong>
      </div>
      <form>
        <div id="avatar"></div>
        <div id="field">
          <label htmlFor="input">SteamId or CustomUrl:</label>
          <input id="input" required />
        </div>
        {/* TODO: Disable submit while loading */}
        <button className={cls({ loading })}>
          <div className="loader"></div>
          <span>Submit</span>
        </button>
      </form>
      <div className="logged-in">
        Logged in through
        <a href="https://store.steampowered.com/" target="_blank">
          store.steampowered.com
        </a>
      </div>
      <div id="error"></div>
      <h2>Instructions</h2>
      <div>
        You can get your SteamId or CustomUrl from your steam community profile
        page url:
      </div>
      <ul>
        <li>
          https://steamcommunity.com/profiles/<strong>SteamId</strong>/
        </li>
        <li>
          https://steamcommunity.com/id/<strong>CustomUrl</strong>/
        </li>
      </ul>
      <h2>Saved data</h2>
      <div id="saved-data">
        <div className="data-grid">
          <div>Last updated at:</div>
          <div id="saved-time">...</div>
          <div>Wishlisted items:</div>
          <div id="saved-wishlist">...</div>
          <div>Library items:</div>
          <div id="saved-library">...</div>
          <div>Ignored items:</div>
          <div id="saved-ignored">...</div>
          <button id="reset-button">Reset saved data</button>
        </div>
      </div>
    </>
  );
};

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);

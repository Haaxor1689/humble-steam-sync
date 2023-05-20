import { StrictMode, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';
import cls from 'classnames';
import {
  useQuery,
  useMutation,
  QueryClientProvider,
  QueryClient
} from '@tanstack/react-query';

import './popup.css';
import './loader.css';
import {
  type LocalData,
  type MessageResponse,
  type Message
} from './worker/utils';
import useField from './hooks/useField';

const Query = {
  LocalData: ['localData']
};

const App = () => {
  const localData = useQuery(
    Query.LocalData,
    // TODO: Zod?
    async () => (await browser.storage.local.get(null)) as LocalData
  );

  const { value, props } = useField('steamId');

  const getUserData = useMutation(
    async () =>
      (await browser.runtime.sendMessage({
        action: 'getUserData'
      } satisfies Message)) as MessageResponse
  );

  const getOwnedGames = useMutation(
    async (steamId: string) =>
      (await browser.runtime.sendMessage({
        action: 'getOwnedGames',
        steamId
      } satisfies Message)) as MessageResponse
  );

  const getUserProfile = useMutation(async () => {
    const steamId =
      value.match(
        /^(?:https?:\/\/)?steamcommunity\.com\/(?:id|profiles)\/(\w+)\/?$/
      )?.[1] ?? value;

    if (!steamId) throw new Error('Invalid Steam Id');

    const profile = await fetch(
      `https://humble-steam-sync.haaxor1689.dev/api/${steamId}/profile`
    ).then(r => r.json());

    if (!profile) throw new Error('No player found');

    return { steamId, avatar: profile.avatarmedium };
  });

  const loading = localData.isLoading || getUserData.isLoading;
  const error =
    localData.error ??
    getUserData.error ??
    getOwnedGames.error ??
    getUserProfile.error;

  const loggedIn = !!localData.data?.cacheTime;

  const resetData = useCallback(() => {
    browser.storage.local.clear();
    queryClient.invalidateQueries(Query.LocalData);
  }, []);

  return (
    <>
      <h1>Settings</h1>
      {loggedIn && (
        <button id="logout" onClick={resetData}>
          Log out
        </button>
      )}
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
            className={cls({ loading })}
            onClick={async () => {
              if (loading) return;
              await getUserData.mutateAsync();
            }}
          >
            <div className="loader"></div>
            <span>Log in</span>
          </button>
        </div>
        <strong>or</strong>
      </div>
      <form
        onSubmit={async e => {
          e.preventDefault();
          if (loading) return;
          const { steamId } = await getUserProfile.mutateAsync();
          await getOwnedGames.mutateAsync(steamId);
        }}
      >
        <div id="avatar"></div>
        <div id="field">
          <label htmlFor="input">SteamId or CustomUrl:</label>
          <input {...props} />
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
      {error && (
        <div id="error">
          {error instanceof Error ? error.message : 'Unexpected error occured'}
        </div>
      )}
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
      {localData.data?.cacheTime && (
        <>
          <h2>Saved data</h2>
          <div className="data-grid">
            <div>Last updated at:</div>
            <div>{localData.data.cacheTime}</div>
            <div>Wishlisted items:</div>
            <div>{localData.data.wishlist.length}</div>
            <div>Library items:</div>
            <div>{localData.data.library.length}</div>
            <div>Ignored items:</div>
            <div>{localData.data.ignored.length}</div>
            <div>Recommended items:</div>
            <div>{localData.data.recommended.length}</div>
            <button onClick={resetData}>Reset saved data</button>
          </div>
        </>
      )}
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

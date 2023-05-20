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
import { LogOut, LogIn, RefreshCcw, Check } from 'lucide-react';

import {
  type LocalData,
  type MessageResponse,
  type Message
} from './worker/utils';
import useField from './hooks/useField';
import Button from './components/Button';
import Spinner from './components/Spinner';

import './global.css';

const Query = {
  LocalData: ['localData'],
  UserData: ['userData']
};

const App = () => {
  const localData = useQuery(
    Query.LocalData,
    async () => (await browser.storage.local.get(null)) as LocalData
  );
  console.log('localData', localData.data);

  const userData = useQuery(
    Query.UserData,
    async () =>
      (await browser.runtime.sendMessage({
        action: 'getUserData'
      } satisfies Message)) as MessageResponse,
    { onSuccess: () => queryClient.invalidateQueries(Query.LocalData) }
  );
  console.log('userData', userData.data);

  const steamIdField = useField('steamId', localData.data?.steamId);

  const getOwnedGames = useMutation(
    async (steamId: string) =>
      (await browser.runtime.sendMessage({
        action: 'getOwnedGames',
        steamId
      } satisfies Message)) as MessageResponse,
    { onSuccess: () => queryClient.invalidateQueries(Query.LocalData) }
  );

  const getUserProfile = useMutation(
    async () => {
      const steamId =
        steamIdField.props.value.match(
          /^(?:https?:\/\/)?steamcommunity\.com\/(?:id|profiles)\/(\w+)\/?$/
        )?.[1] ?? steamIdField.props.value;

      if (!steamId) throw new Error('Invalid Steam Id');

      const profile = await fetch(
        `https://humble-steam-sync.haaxor1689.dev/api/${steamId}/profile`
      ).then(r => r.json());

      if (!profile) throw new Error('No player found');

      return { steamId, avatar: profile.avatarmedium as string };
    },
    {
      onSuccess: v => {
        browser.storage.local.set(v);
        queryClient.invalidateQueries(Query.LocalData);
      }
    }
  );

  const loading =
    localData.isFetching ||
    userData.isFetching ||
    getOwnedGames.isLoading ||
    getUserProfile.isLoading;
  const error =
    localData.error ??
    userData.error ??
    getOwnedGames.error ??
    getUserProfile.error;

  const storeLogIn = userData.data?.status === 'ok';
  const loggedIn = !!localData.data?.cacheTime;

  return (
    <>
      {loading && (
        <div className="text-[var(--main-text-color)] flex justify-center absolute top-0 left-0 right-0 bottom-0 items-center backdrop-blur-sm">
          <Spinner />
        </div>
      )}
      <div className="flex justify-between items-center gap-2">
        <h1 className="text-2xl">Settings</h1>
        {loggedIn && (
          <Button
            onClick={() => {
              browser.storage.local.clear();
              queryClient.invalidateQueries(Query.LocalData);
              queryClient.invalidateQueries(Query.UserData);
            }}
          >
            <LogOut />
          </Button>
        )}
      </div>

      {/* Store login */}
      {storeLogIn ? (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Check />
          <p className="flex-grow">
            Logged in through{' '}
            <a
              href="https://store.steampowered.com/"
              target="_blank"
              className="underline"
            >
              store.steampowered.com
            </a>
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <p className="flex-grow whitespace-nowrap">
              Check{' '}
              <a
                href="https://store.steampowered.com/"
                target="_blank"
                className="underline"
              >
                store.steampowered.com
              </a>{' '}
              login:
            </p>
            <Button
              onClick={() => queryClient.invalidateQueries(Query.UserData)}
            >
              <RefreshCcw size={18} />
            </Button>
          </div>

          {/* Steam api login */}
          <form
            className="flex items-end gap-2"
            onSubmit={async e => {
              e.preventDefault();
              const { steamId } = await getUserProfile.mutateAsync();
              await getOwnedGames.mutateAsync(steamId);
            }}
          >
            <div
              className={cls(
                'w-[36px] aspect-square border border-dashed border-[var(--btn-outline)] bg-cover',
                { 'border-none': !!localData.data?.avatar }
              )}
              style={
                localData.data?.avatar
                  ? { backgroundImage: `url(${localData.data?.avatar})` }
                  : undefined
              }
            />
            <div className="flex flex-col flex-grow">
              <label htmlFor="input">SteamId or CustomUrl:</label>
              <input
                className="mt-1 text-md text-[var(--main-text-color)] border-b border-[var(--btn-outline)] bg-transparent"
                {...steamIdField.props}
              />
            </div>
            <Button type="submit">
              <LogIn size={18} />
            </Button>
          </form>
        </>
      )}

      {error && (
        <p className="text-[#ff4646]">
          {error instanceof Error ? error.message : 'Unexpected error occured'}
        </p>
      )}

      {!loggedIn && (
        <details>
          <summary className="text-xl cursor-pointer">
            <h2 className="inline">Instructions</h2>
          </summary>
          <p>
            You can get your SteamId or CustomUrl from your steam community
            profile page url:
          </p>
          <ul className="list-disc list-inside">
            <li className="whitespace-nowrap">
              https://steamcommunity.com/profiles/
              <span className="font-bold">SteamId</span>/
            </li>
            <li className="whitespace-nowrap">
              https://steamcommunity.com/id/
              <span className="font-bold">CustomUrl</span>/
            </li>
          </ul>
        </details>
      )}

      {loggedIn && (
        <details>
          <summary className="text-xl cursor-pointer">
            <h2 className="inline">Saved data</h2>
          </summary>
          <div className="grid grid-cols-2">
            <div>Last updated at:</div>
            <div>{localData.data?.cacheTime}</div>
            <div>Library items:</div>
            <div>{localData.data?.library.length}</div>
            <div>Wishlisted items:</div>
            <div>{localData.data?.wishlist.length}</div>
            <div>Ignored items:</div>
            <div>{localData.data?.ignored.length}</div>
            <div>Recommended items:</div>
            <div>{localData.data?.recommended.length}</div>
          </div>
          <Button
            className="mt-2"
            onClick={async () => {
              await browser.storage.local.set({ cacheTime: null });
              storeLogIn
                ? queryClient.invalidateQueries(Query.UserData)
                : getOwnedGames.mutate(localData.data?.steamId!);
            }}
          >
            <RefreshCcw size={16} /> Refresh
          </Button>
        </details>
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

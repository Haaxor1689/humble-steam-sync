import browser from 'webextension-polyfill';
import cls from 'classnames';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LogOut,
  LogIn,
  RefreshCcw,
  Check,
  Bug,
  Github,
  History
} from 'lucide-react';

import {
  GetUserDataResponse,
  SteamLogInResponse,
  type Message
} from './worker';
import useField from './utils/useField';
import Button from './components/Button';
import Spinner from './components/Spinner';

const UserDataQuery = ['userData'];

const Popup = () => {
  const queryClient = useQueryClient();

  const { data, isFetching, error } = useQuery(
    UserDataQuery,
    async () =>
      (await browser.runtime.sendMessage({
        action: 'getUserData'
      } satisfies Message)) as GetUserDataResponse
  );
  console.log('userData', data);

  const steamIdField = useField(
    'steamId',
    data?.status === 'ok' ? data.steamId : undefined
  );

  const steamLogIn = useMutation(
    async (steamId: string) =>
      (await browser.runtime.sendMessage({
        action: 'steamLogIn',
        steamId
      } satisfies Message)) as SteamLogInResponse,
    { onSuccess: () => queryClient.invalidateQueries(UserDataQuery) }
  );

  const err = error ?? steamLogIn.error;

  return (
    <>
      {(isFetching || steamLogIn.isLoading) && (
        <div className="text-[var(--main-text-color)] flex justify-center absolute top-0 left-0 right-0 bottom-0 items-center backdrop-blur-sm">
          <Spinner />
        </div>
      )}
      <div className="flex justify-between items-center gap-2">
        <h1 className="text-2xl">Settings</h1>
        {data?.status === 'ok' && (
          <Button
            onClick={() => {
              browser.storage.local.clear();
              queryClient.invalidateQueries(UserDataQuery);
            }}
            title="SignOut"
          >
            <LogOut />
          </Button>
        )}
      </div>

      {/* Store login */}
      {data?.status === 'ok' && data.store ? (
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
            onClick={() => queryClient.invalidateQueries(UserDataQuery)}
            title="Retry"
          >
            <RefreshCcw size={18} />
          </Button>
        </div>
      )}

      {/* Steam api login */}
      <form
        className="flex items-end gap-2"
        onSubmit={async e => {
          e.preventDefault();
          await steamLogIn.mutateAsync(steamIdField.props.value);
        }}
      >
        <div
          className={cls(
            'w-[48px] aspect-square border border-dashed border-[var(--btn-outline)] bg-cover',
            { 'border-none': data?.status == 'ok' && !!data?.avatar }
          )}
          style={
            data?.status == 'ok' && data?.avatar
              ? { backgroundImage: `url(${data?.avatar})` }
              : undefined
          }
        />
        <div className="flex flex-col flex-grow">
          <label htmlFor={steamIdField.props.id}>SteamId or CustomUrl:</label>
          <input
            className="mt-1 text-lg text-[var(--main-text-color)] border-b border-[var(--btn-outline)] bg-transparent"
            {...steamIdField.props}
          />
        </div>
        <Button type="submit" title="SignIn">
          <LogIn size={18} />
        </Button>
      </form>

      {err && (
        <p className="text-[#ff4646]">
          {err instanceof Error ? err.message : 'Unexpected error occured'}
        </p>
      )}

      {data?.status !== 'ok' && (
        <details>
          <summary className="text-lg cursor-pointer">
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

      {data?.status === 'ok' && (
        <details>
          <summary className="text-lg cursor-pointer">
            <h2 className="inline">Saved data</h2>
          </summary>
          <div className="grid grid-cols-2">
            <div>Last updated at:</div>
            <div>{data.cacheTime}</div>
            <div>Library items:</div>
            <div>{data.library.length}</div>
            <div>Wishlisted items:</div>
            <div>{data.wishlist.length}</div>
            <div>Ignored items:</div>
            <div>{data.ignored.length}</div>
            <div>Recommended items:</div>
            <div>{data.recommended.length}</div>
          </div>
          <Button
            className="mt-2"
            onClick={async () => {
              await browser.storage.local.set({ cacheTime: null });
              queryClient.invalidateQueries(UserDataQuery);
            }}
          >
            <RefreshCcw size={16} /> Refresh
          </Button>
        </details>
      )}

      <details>
        <summary className="text-lg cursor-pointer">
          <h2 className="inline">About</h2>
        </summary>

        <p className="text-sm flex gap-1 items-center">
          <History size={16} />
          <span>v2.0</span>
        </p>

        <a
          href="https://github.com/Haaxor1689/humble-steam-sync"
          target="_blank"
          className="text-[#7cb8e4] text-sm flex gap-1 items-center"
        >
          <Github size={16} />
          <span>Homepage</span>
        </a>

        <a
          href="https://github.com/Haaxor1689/humble-steam-sync/issues/new"
          target="_blank"
          className="text-[#ff4646] text-sm flex gap-1 items-center"
        >
          <Bug size={16} />
          <span>Report issues</span>
        </a>
      </details>
    </>
  );
};
export default Popup;

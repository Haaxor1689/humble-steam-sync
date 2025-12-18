import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import cls from 'classnames';
import {
	AlertCircle,
	AlertTriangle,
	Bug,
	Check,
	Github,
	History,
	LogIn,
	LogOut,
	RefreshCcw,
	Trash2,
	Unlock
} from 'lucide-react';
import browser from 'webextension-polyfill';

import pkg from '../../package.json';
import allTagsPreview from './all-tags-preview.png';

import Button from '@/components/Button';
import Input from '@/components/Input';
import Spinner from '@/components/Spinner';
import { host_permissions, matches } from '@/permissions';
import useField from '@/utils/useField';
import { clearCache, sendWorkerMessage, setCache } from '@/worker/helpers';

const toLastUpdated = (updatedAt?: string | null) => {
	const updatedTime = new Date(updatedAt ?? '').getTime();
	if (isNaN(updatedTime)) return 'Never';

	const diff = new Date().getTime() - updatedTime;
	const minutes = Math.floor(diff / 1000 / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
	if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
	if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
	return 'Just now';
};

// Permissions
const mapPerm = (arr?: string[]) => [
	...new Set([
		...(arr ?? [])
			.map(p => p.match(/https:\/\/(.+?)\//)?.[1])
			.filter((v): v is string => !!v)
	])
];

const allPermissions = [...host_permissions, ...matches];

// Keys
const PermissionsQuery = ['permissions'];
const UserDataQuery = ['userData'];

const Popup = () => {
	const queryClient = useQueryClient();

	const permissions = useQuery(PermissionsQuery, () =>
		browser.permissions.getAll()
	);

	const grantPermissions = useMutation(
		() => browser.permissions.request({ origins: allPermissions }),
		{ onSuccess: () => queryClient.invalidateQueries(PermissionsQuery) }
	);

	const hasAllPermissions = useMemo(
		() =>
			mapPerm(allPermissions).every(p =>
				mapPerm(permissions.data?.origins)?.find(o => o === p)
			),
		[permissions.data]
	);

	const userData = useQuery(
		UserDataQuery,
		() => sendWorkerMessage('getUserData'),
		{ enabled: hasAllPermissions }
	);
	console.log('[HSS] userData:', userData.data);

	const steamNameField = useField(
		'steamName',
		userData.data?.status === 'ok' ? userData.data.steamName : undefined
	);

	const steamLogIn = useMutation(
		(rawName: string) => sendWorkerMessage('steamLogIn', rawName),
		{ onSuccess: () => queryClient.invalidateQueries(UserDataQuery) }
	);

	const err = userData.error ?? steamLogIn.error;

	return (
		<>
			{(userData.isFetching ||
				steamLogIn.isLoading ||
				grantPermissions.isLoading) && (
				<div className="text-light absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center backdrop-blur-sm">
					<Spinner />
				</div>
			)}
			<div className="flex items-center justify-between gap-2">
				<h1 className="text-2xl">Settings</h1>
				{userData.data?.status === 'ok' && (
					<Button
						onClick={async () => {
							await clearCache();
							await queryClient.invalidateQueries(UserDataQuery);
						}}
						title="SignOut"
					>
						<LogOut />
					</Button>
				)}
			</div>

			{/* Permissions check */}
			{!hasAllPermissions && (
				<div className="flex items-center gap-2 text-yellow-500">
					<AlertTriangle size={48} />
					<p className="text-center font-semibold">
						Please, grant all required permissions to this extension, for it to
						function properly
					</p>
					<Button
						title="Grant permissions"
						onClick={() => grantPermissions.mutateAsync()}
					>
						<Unlock size={18} />
					</Button>
				</div>
			)}

			{/* Store login */}
			{userData.data?.status === 'ok' && userData.data.store ? (
				<div className="flex items-center gap-2 whitespace-nowrap">
					<Check />
					<p className="grow">
						Logged in through{' '}
						<a
							href="https://store.steampowered.com/"
							target="_blank"
							className="underline"
							rel="noreferrer"
						>
							store.steampowered.com
						</a>
					</p>
				</div>
			) : (
				<div className="flex items-center gap-2">
					<p className="grow whitespace-nowrap">
						Check{' '}
						<a
							href="https://store.steampowered.com/"
							target="_blank"
							className="underline"
							rel="noreferrer"
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
					await steamLogIn.mutateAsync(steamNameField.props.value);
				}}
			>
				<div
					className={cls(
						'aspect-square w-12 shrink-0 border border-dashed border-(--btn-outline) bg-cover',
						{
							'border-none':
								userData.data?.status === 'ok' && !!userData.data?.avatar
						}
					)}
					style={
						userData.data?.status === 'ok' && userData.data?.avatar
							? { backgroundImage: `url(${userData.data?.avatar})` }
							: undefined
					}
				/>
				<div className="flex grow flex-col gap-1">
					<label htmlFor={steamNameField.props.id}>SteamId or CustomUrl:</label>
					<Input {...steamNameField.props} className="p-0! text-lg" />
				</div>
				<Button type="submit" title="Log in">
					<LogIn size={18} />
				</Button>
			</form>

			{err && (
				<p className="text-error">
					{err instanceof Error ? err.message : 'Unexpected error occurred'}
				</p>
			)}

			{(userData.data?.status === 'noData' ||
				!userData.data?.store ||
				!userData.data.steamId) && (
				<div className="text-primary flex items-center gap-1 text-xs">
					<AlertCircle size={14} />
					<p>Use both login options for best results.</p>
				</div>
			)}

			{userData.data?.status === 'ok' && (
				<details>
					<summary className="cursor-pointer text-lg">
						<h2 className="inline">Options</h2>
					</summary>

					<div className="mt-2 flex gap-2">
						<img
							src={allTagsPreview}
							className="aspect-auto w-1/3"
							alt="Preview of how steam link tag looks like"
						/>
						<div className="flex flex-col items-start gap-2">
							<label htmlFor="alwaysShowTag" className="">
								Always show a tag with link to Steam store next to all items on
								HumbleBundle pages?
							</label>

							<Button
								type="submit"
								title={userData.data.alwaysShowTag ? 'Show' : "Don't show"}
								onClick={async () => {
									await setCache({
										alwaysShowTag: !userData.data?.alwaysShowTag
									});
									await queryClient.invalidateQueries(UserDataQuery);
								}}
							>
								{userData.data.alwaysShowTag ? 'Always show' : "Don't show"}
								<img
									src="https://store.cloudflare.steamstatic.com/public/images/v6/icon_platform_linux.png"
									alt="Steam logo"
								/>
							</Button>
						</div>
					</div>
				</details>
			)}

			{userData.data?.status !== 'ok' && (
				<details>
					<summary className="cursor-pointer text-lg">
						<h2 className="inline">Instructions</h2>
					</summary>
					<p>
						You can get your SteamId or CustomUrl from your steam community
						profile page url:
					</p>
					<ul className="list-inside list-disc">
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

			{userData.data?.status === 'ok' && (
				<details>
					<summary className="cursor-pointer text-lg">
						<h2 className="inline">Saved data</h2>
					</summary>
					<div className="grid grid-cols-[auto_1fr] gap-x-2">
						<div>Last updated at:</div>
						<div className="text-white">
							{toLastUpdated(userData.data.cacheTime)}
						</div>
						<div>Library items:</div>
						<div className="text-white">{userData.data.library.length}</div>
						<div>Wishlisted items:</div>
						<div className="text-white">{userData.data.wishlist.length}</div>
						<div>Ignored items:</div>
						<div className="text-white">{userData.data.ignored.length}</div>
						<div>Recommended items:</div>
						<div className="text-white">{userData.data.recommended.length}</div>
					</div>
					<Button
						className="mt-2"
						onClick={async () => {
							await setCache({ cacheTime: null });
							queryClient.invalidateQueries(UserDataQuery);
						}}
					>
						<RefreshCcw size={16} /> Refresh
					</Button>
				</details>
			)}

			<details>
				<summary className="cursor-pointer text-lg">
					<h2 className="inline">About</h2>
				</summary>

				<div className="flex flex-col items-start gap-1">
					<p className="flex items-center gap-1 text-sm text-white/50">
						<History size={16} />
						<span>v{pkg.version}</span>
					</p>

					<a
						href="https://github.com/Haaxor1689/humble-steam-sync"
						target="_blank"
						className="flex items-center gap-1 text-sm"
						rel="noreferrer"
					>
						<Github size={16} />
						<span>Homepage</span>
					</a>

					<a
						href="https://github.com/Haaxor1689/humble-steam-sync/issues/new"
						target="_blank"
						className="text-primary flex items-center gap-1 text-sm"
						rel="noreferrer"
					>
						<Bug size={16} />
						<span>Report issues</span>
					</a>

					<button
						className="text-error flex items-center gap-1 text-sm"
						onClick={async () => {
							await clearCache();
							await queryClient.invalidateQueries(UserDataQuery);
						}}
					>
						<Trash2 size={16} />
						<span>Reset ALL data</span>
					</button>
				</div>
			</details>
		</>
	);
};
export default Popup;

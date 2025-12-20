import cls from 'classnames';
import { AlertCircle, Check, LogIn, RefreshCcw } from 'lucide-react';

import About from './About';
import Instructions from './Instructions';
import Options from './Options';

import Button from '@/components/Button';
import Input from '@/components/Input';
import Spinner from '@/components/Spinner';
import useApi from '@/utils/useApi';
import useField from '@/utils/useField';
import useStorage from '@/utils/useStorage';

const Popup = () => {
	const steamName = useStorage<string>('steamName');
	const steamNameField = useField('steamName', steamName.value);

	const steamLogIn = useApi({
		action: 'steamLogIn',
		args: [steamName.value],
		disabled: steamName.loading
	});

	const userData = useApi({
		action: 'getUserData',
		args: [steamLogIn.data?.steamId],
		disabled: steamName.loading || steamLogIn.loading
	});

	const isStoreLoggedIn = userData.data?.recommended !== undefined;
	const isUsernameLoggedIn = steamLogIn.data?.steamId !== undefined;

	const loading = steamLogIn.loading || userData.loading;
	const error = steamLogIn.error ?? userData.error;

	return (
		<>
			{loading && (
				<div className="text-light absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center backdrop-blur-sm">
					<Spinner />
				</div>
			)}

			<div className="flex items-center justify-between gap-2">
				<h1 className="text-2xl">Settings</h1>
			</div>

			{/* Store login */}
			{isStoreLoggedIn ? (
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
					<Button onClick={userData.revalidate} title="Retry">
						<RefreshCcw size={18} />
					</Button>
				</div>
			)}

			{/* Steam api login */}
			<form
				className="flex items-end gap-2"
				onSubmit={async e => {
					e.preventDefault();
					await steamName.set(steamNameField.props.value || undefined);
				}}
			>
				<div
					className={cls(
						'aspect-square w-12 shrink-0 border border-dashed border-(--btn-outline) bg-cover',
						{ 'border-none': steamLogIn.data?.avatar }
					)}
					style={{
						backgroundImage: steamLogIn.data?.avatar
							? `url(${steamLogIn.data?.avatar})`
							: undefined
					}}
				/>
				<div className="flex grow flex-col gap-1">
					<label htmlFor={steamNameField.props.id}>SteamId or CustomUrl:</label>
					<Input {...steamNameField.props} className="p-0! text-lg" />
				</div>
				<Button type="submit" title="Log in">
					<LogIn size={18} />
				</Button>
			</form>

			{error && (
				<p className="text-error">
					{error instanceof Error ? error.message : 'Unexpected error occurred'}
				</p>
			)}

			{(!isStoreLoggedIn || !isUsernameLoggedIn) && (
				<div className="text-primary flex items-center gap-1 text-xs">
					<AlertCircle size={14} />
					<p>Use both login options for best results.</p>
				</div>
			)}

			<Options />
			<Instructions />

			{userData.data && (
				<details>
					<summary className="cursor-pointer text-lg">
						<h2 className="inline">Saved data</h2>
					</summary>
					<div className="grid grid-cols-[auto_1fr] gap-x-2">
						<div>Library items:</div>
						<div className="text-white">{userData.data.library.length}</div>
						<div>Wishlisted items:</div>
						<div className="text-white">{userData.data.wishlist.length}</div>
						<div>Ignored items:</div>
						<div className="text-white">{userData.data.ignored.length}</div>
						<div>Recommended items:</div>
						<div className="text-white">{userData.data.recommended.length}</div>
					</div>
					<Button className="mt-2" onClick={userData.revalidate}>
						<RefreshCcw size={16} /> Refresh
					</Button>
				</details>
			)}

			<About />
		</>
	);
};
export default Popup;

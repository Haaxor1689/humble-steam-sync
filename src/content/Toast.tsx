import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import cls from 'classnames';
import { FileWarning, UserCheck, UserX, XOctagon } from 'lucide-react';

import Spinner from '../components/Spinner';
import DialogButton from '../components/DialogButton';
import { type ApiMethodsReturn } from '../worker';
import { sendWorkerMessage } from '../worker/helpers';
import { type Item } from '../worker/schemas';

import Suggestion from './Suggestion';

const getRawName = (item: HTMLElement) =>
	// Library
	item.querySelector('.text-holder h2' as 'div')?.innerText ??
	// Keys
	item.querySelector('.game-name h4' as 'div')?.innerText ??
	// Choice
	item.querySelector('.content-choice-title' as 'div')?.innerText ??
	item.querySelector('[data-machine-name]' as 'div')?.dataset.machineName ??
	// Bundle
	item.querySelector('.item-title' as 'div')?.innerText ??
	// Store
	item.querySelector('.entity-title' as 'div')?.innerText ??
	// Store detail
	item.querySelector('h1.human_name-view' as 'div')?.innerText ??
	'';

const getCleanedUpName = (item: string) =>
	item.replace(/ \d+% Off Coupon/i, '').replace(/ \(Steam\)/i, '');

const getItemName = (item: string) =>
	getCleanedUpName(item).replace(/\W/g, '').replace(/_/g, '').toLowerCase();

const getItemElements = (node?: Node) => {
	if (!(node instanceof HTMLElement) && !(node instanceof Document)) return [];
	return [
		// Library
		node instanceof HTMLElement &&
		node.classList?.contains('subproduct-selector')
			? node
			: undefined,
		...node.querySelectorAll('.subproduct-selector' as 'div'),
		// Keys
		...[
			node instanceof HTMLElement && node.localName === 'tr' ? node : undefined,
			...node.querySelectorAll('tr' as 'div')
		].filter(n => n?.querySelector('.platform .hb-steam' as 'div')),
		// Choice
		...node.querySelectorAll('.content-choice' as 'div'),
		// Bundle
		...node.querySelectorAll('.tier-item-view' as 'div'),
		// Store
		...[...node.querySelectorAll('.entity' as 'div')].filter(n =>
			n.querySelector('.entity-pricing' as 'div')
		),
		// Store detail
		node.querySelector('.product-header-view' as 'div')
	].filter(
		(n): n is Exclude<typeof n, undefined | null> =>
			!!n && !n?.querySelector('.hss-tag')
	);
};

const insertTag = async (
	item: HTMLElement,
	cache: Awaited<ApiMethodsReturn<'getUserData'>>,
	mappings: Awaited<ApiMethodsReturn<'getTagMappings'>>
) => {
	if (cache?.status !== 'ok') throw new Error('Data not ready');

	// Free up the main thread
	await new Promise(r => setTimeout(r, 0));

	const rawName = getRawName(item);
	const game =
		mappings
			?.find(i => i.humble_name === rawName)
			?.steam_name?.replace(/\W/g, '')
			.toLowerCase() ?? getItemName(rawName);

	console.log(
		'[HSS] Adding tag:',
		game,
		cache.wishlist.find(i => i[0].startsWith('Rain'))
	);

	const result = (
		[
			[cache.wishlist, 'on wishlist'],
			[cache.library, 'in library'],
			[cache.ignored, 'ignored']
		] as const
	).reduce<[Item, string] | undefined>((r, [arr, message]) => {
		if (r) return r;
		const item = arr.find(i => game === i[0].replace(/\W/g, '').toLowerCase());
		if (!item) return undefined;
		return [item, message];
	}, undefined);

	if (!cache.alwaysShowTag && !result) return;

	const tagElem = document.createElement('a');
	tagElem.href = result?.[0][1]
		? `https://store.steampowered.com/app/${result?.[0][1]}`
		: `https://store.steampowered.com/search/?term=${
				result?.[0][0] ?? getCleanedUpName(rawName)
		  }`;
	tagElem.target = `_blank`;
	tagElem.innerText = result?.[1] ?? '.';
	tagElem.className = 'hss-tag';
	tagElem.dataset.source = result?.[1] ?? 'other';

	let target = item;

	// Keys
	if (item.localName === 'tr') {
		const newTarget = item.querySelector('.platform' as 'div');
		if (!newTarget) {
			console.error("Couldn't find elem to connect to");
			return;
		}
		target = newTarget;
	}

	// Store detail
	if (item.classList.contains('product-header-view')) {
		const newTarget = item.parentElement?.parentElement?.querySelector(
			'.pricing-info-view' as 'div'
		);
		if (!newTarget) {
			console.error("Couldn't find elem to connect to");
			return;
		}
		target = newTarget;
	}

	if (result?.[1] === 'ignored') target.classList.add('hss-ignored');

	target.style.position = 'relative';

	const existingTag = target.querySelector('.hss-tag');
	if (existingTag) existingTag.remove();
	target.appendChild(tagElem);
};

const Toast = () => {
	const userData = useMutation(() => sendWorkerMessage('getUserData'));
	const tagMappings = useMutation(() => sendWorkerMessage('getTagMappings'));

	const [fade, setFade] = useState(false);

	useEffect(() => {
		let observer: MutationObserver | null = null;
		(async () => {
			try {
				// Load user data
				const mappings = await tagMappings.mutateAsync();
				const cache = await userData.mutateAsync();

				if (cache.status !== 'ok') throw new Error('No data');

				// Insert tags to existing DOM
				getItemElements(document).forEach(e => insertTag(e, cache, mappings));

				// Listen for DOM changes
				observer = new MutationObserver(mutations => {
					mutations
						.filter(m => m.type === 'childList')
						.flatMap(m => [...m.addedNodes].flatMap(getItemElements))
						.forEach(n => insertTag(n, cache, mappings));
				});

				const bodyElem = document.querySelector('body');
				if (!bodyElem) throw new Error('Body not found');
				observer.observe(bodyElem, { subtree: true, childList: true });
			} catch (e) {
				console.error(e);
			} finally {
				setTimeout(() => setFade(true), 2000);
			}
		})();
		return () => {
			observer?.disconnect();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div
			className={cls('hss-toast hss-background', {
				'hss-shake': userData.error || userData.data?.status === 'noData',
				'hss-highlight': !fade
			})}
		>
			<h3 className="text-lg text-white">Steam tags extension</h3>
			<div className="flex items-center gap-1 text-primary">
				{userData.isLoading ? (
					<>
						<Spinner size={16} />
						<span>Loading tags...</span>
					</>
				) : userData.error ? (
					<>
						<XOctagon size={16} />
						<span>
							{userData.error instanceof Error
								? userData.error.message
								: 'Unexpected error ocurred'}
						</span>
					</>
				) : userData.data?.status === 'noData' ? (
					<>
						<UserX size={16} />
						<span>
							No tag info found, please log in through extension settings
						</span>
					</>
				) : (
					<>
						<UserCheck size={16} />
						<span>Steam tags added</span>
					</>
				)}
			</div>
			{userData.data?.status === 'ok' && (
				<DialogButton clickAway dialog={close => <Suggestion close={close} />}>
					{open => (
						<button
							type="button"
							onClick={open}
							className="flex items-center gap-1 text-white/60"
						>
							<FileWarning size={16} />
							<span>Report missing tag</span>
						</button>
					)}
				</DialogButton>
			)}
		</div>
	);
};

export default Toast;

import { useEffect, useState } from 'react';
import cls from 'classnames';
import { UserCheck, UserX, XOctagon } from 'lucide-react';

import Spinner from '@/components/Spinner';
import useApi from '@/utils/useApi';
import useStorage from '@/utils/useStorage';
import { type ApiMethodsReturn } from '@/worker';
import { type Item } from '@/worker/schemas';

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

const getItemName = (item: string) =>
	item
		.replace(/ \d+% Off Coupon/i, '')
		.replace(/ \(Steam\)/i, '')
		.replace(/\W/g, ' ')
		.replace(/ +/g, ' ')
		.toLowerCase();

const getEscapedName = (item: string) =>
	encodeURIComponent(item).replace(/%20/g, '+');

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
	alwaysShowTag?: boolean
) => {
	// Free up the main thread
	await new Promise(r => setTimeout(r, 0));

	const rawName = getRawName(item);
	const gameName = getItemName(rawName);

	console.log('[HSS] Adding tag:', rawName, gameName);
	gameName.startsWith('smalland') &&
		console.log({
			rawName,
			gameName,
			item,
			ignore: cache.ignored.find(i => getItemName(i[0]).startsWith('smalland'))
		});

	const result = (
		[
			[cache.wishlist, 'on wishlist'],
			[cache.library, 'in library'],
			[cache.ignored, 'ignored']
		] as const
	).reduce<[Item, string] | undefined>((r, [arr, message]) => {
		if (r) return r;
		const item = arr.find(i => gameName === getItemName(i[0]));
		if (!item) return undefined;
		return [item, message];
	}, undefined);

	if (!alwaysShowTag && !result) return;

	const tagElem = document.createElement('a');
	tagElem.href = result
		? `https://store.steampowered.com/app/${result[0][1]}`
		: `https://store.steampowered.com/search/?term=${getEscapedName(gameName)}`;
	tagElem.target = `_blank`;
	tagElem.innerText = result?.[1] ?? '.';
	tagElem.className = 'hss-tag';
	tagElem.dataset.source = result?.[1] ?? 'other';

	let target = item;

	// Keys
	if (item.localName === 'tr') {
		const newTarget = item.querySelector('.platform' as 'div');
		if (!newTarget) {
			console.error("[HSS] Couldn't find elem to connect to");
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
			console.error("[HSS] Couldn't find elem to connect to");
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
	const steamName = useStorage<string>('steamName');
	const alwaysShowTag = useStorage<boolean>('alwaysShowTag');

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

	const [fade, setFade] = useState(false);

	useEffect(() => {
		if (!userData.data) return;
		let observer: MutationObserver | null = null;
		try {
			// Insert tags to existing DOM
			getItemElements(document).forEach(e =>
				insertTag(e, userData.data!, alwaysShowTag.value)
			);

			// Listen for DOM changes
			observer = new MutationObserver(mutations => {
				mutations
					.filter(m => m.type === 'childList')
					.flatMap(m => [...m.addedNodes].flatMap(getItemElements))
					.forEach(n => insertTag(n, userData.data!, alwaysShowTag.value));
			});

			const bodyElem = document.querySelector('body');
			if (!bodyElem) throw new Error('Body not found');
			observer.observe(bodyElem, { subtree: true, childList: true });
		} catch (e) {
			console.error('[HSS]', e);
		} finally {
			setTimeout(() => setFade(true), 2000);
		}
		return () => {
			observer?.disconnect();
		};
	}, [userData.data, alwaysShowTag.value]);

	return (
		<div
			className={cls('hss-toast hss-background', {
				'hss-shake': !!userData.error || !userData.data,
				'hss-highlight': !fade
			})}
		>
			<h3 className="text-lg text-white">Steam tags extension</h3>
			<div className="text-primary flex items-center gap-1">
				{userData.loading ? (
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
				) : !userData.data ? (
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
		</div>
	);
};

export default Toast;

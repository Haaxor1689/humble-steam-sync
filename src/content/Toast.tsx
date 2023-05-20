import { useEffect } from 'react';
import browser from 'webextension-polyfill';
import { GetUserDataResponse, Message } from '../worker';
import { useMutation, useQuery } from '@tanstack/react-query';
import cls from 'classnames';

const Toast = () => {
  const { mutateAsync, data, isLoading, error } = useMutation(
    async () =>
      (await browser.runtime.sendMessage({
        action: 'getUserData'
      } satisfies Message)) as GetUserDataResponse
  );
  console.log('userData', data);

  const getItemName = (item: HTMLElement) =>
    // Library
    (
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
      ''
    )
      .replace(/ \(Steam\)/i, '')
      .replace(/\W/g, '')
      .replace(/_/g, '')
      .toLowerCase();

  const getItemElements = (node?: Node) => {
    if (!(node instanceof HTMLElement) && !(node instanceof Document))
      return [];
    return [
      // Library
      node instanceof HTMLElement &&
      node.classList?.contains('subproduct-selector')
        ? node
        : undefined,
      ...node.querySelectorAll('.subproduct-selector' as 'div'),
      // Keys
      ...[
        node instanceof HTMLElement && node.localName === 'tr'
          ? node
          : undefined,
        ...node.querySelectorAll('tr' as 'div')
      ].filter(n => n?.querySelector('.platform .hb-steam' as 'div')),
      // Choice
      ...node.querySelectorAll('.content-choice' as 'div'),
      // Bundle
      ...node.querySelectorAll('.tier-item-view' as 'div'),
      // Store
      ...[...node.querySelectorAll('.entity' as 'div')].filter(n =>
        n.querySelector('.entity-pricing' as 'div')
      )
    ].filter(
      (n): n is Exclude<typeof n, undefined> =>
        !!n && !n?.querySelector('.hss-tag')
    );
  };

  const insertTag = (item: HTMLElement, cache = data) => {
    const game = getItemName(item);

    if (cache?.status !== 'ok') {
      console.log(cache);
      throw new Error('Data not ready');
    }

    const result = (
      [
        [cache.wishlist, 'on wishlist'],
        [cache.library, 'in library'],
        [cache.ignored, 'ignored']
      ] as const
    ).reduce<[string, string] | undefined>((r, [arr, message]) => {
      if (r) return r;
      const item = arr.find(i => game === i.replace(/\W/g, '').toLowerCase());
      if (!item) return undefined;
      return [item, message];
    }, undefined);

    if (!result) return;

    const tagElem = document.createElement('a');
    tagElem.href = `https://store.steampowered.com/search/?term=${result[0]}`;
    tagElem.target = `_blank`;
    tagElem.innerText = result[1];
    tagElem.className = 'hss-tag';
    tagElem.dataset.source = result[1];

    if (result[1] === 'ignored') item.classList.add('hss-ignored');

    if (item.localName === 'tr') {
      const td = item.querySelector<'td'>('.platform' as never);
      if (!td) {
        console.error("Couldn't find elem to connect to");
        return;
      }
      td.style.position = 'relative';
      td.appendChild(tagElem);
      return;
    }

    item.appendChild(tagElem);
  };

  useEffect(() => {
    const observer = new MutationObserver(mutations => {
      mutations
        .filter(m => m.type === 'childList')
        .flatMap(m => [...m.addedNodes].flatMap(getItemElements))
        .forEach(n => insertTag(n));
    });

    (async () => {
      // Load user data
      const cache = await mutateAsync();

      // Insert tags to existing DOM
      getItemElements(document).forEach(e => insertTag(e, cache));

      // Listen for DOM changes
      observer.observe(document.querySelector('body')!, {
        subtree: true,
        childList: true
      });
    })();
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      className={cls('hss-toast', {
        'hss-shake': data && data?.status !== 'ok',
        'hss-highlight': isLoading
      })}
    >
      <h3 className="text-xl text-white">Steam tags extension</h3>
      <p className="text-[#7cb8e4]">
        {isLoading
          ? 'Loading...'
          : error
          ? error instanceof Error
            ? error.message
            : 'Unexpected error ocurred'
          : data?.status === 'noData'
          ? 'Please login to Steam store or enter your SteamId in extension settings'
          : 'Steam tags added'}
      </p>
    </div>
  );
};

export default Toast;

import { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';
import { GetUserDataResponse, Message, getTagMappings } from '../worker';
import { useMutation } from '@tanstack/react-query';
import cls from 'classnames';
import Spinner from '../components/Spinner';
import { FileWarning, UserCheck, UserX, XOctagon } from 'lucide-react';
import DialogButton from '../components/DialogButton';

import Suggestion from './Suggestion';

const Toast = () => {
  const { mutateAsync, data, isLoading, error } = useMutation(
    async () =>
      (await browser.runtime.sendMessage({
        action: 'getUserData'
      } satisfies Message)) as GetUserDataResponse
  );
  const tagMappings = useMutation(
    async () =>
      (await browser.runtime.sendMessage({
        action: 'getTagMappings'
      } satisfies Message)) as ReturnType<typeof getTagMappings>
  );

  const [fade, setFade] = useState(false);

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
      ),
      // Store detail
      node.querySelector('.product-header-view' as 'div')
    ].filter(
      (n): n is Exclude<typeof n, undefined | null> =>
        !!n && !n?.querySelector('.hss-tag')
    );
  };

  const insertTag = (
    item: HTMLElement,
    cache = data,
    mappings = tagMappings.data
  ) => {
    const rawName = getRawName(item);
    const game =
      mappings
        ?.find(i => i.humble_name === rawName)
        ?.steam_name?.replace(/\W/g, '')
        .toLowerCase() ?? getItemName(rawName);

    if (cache?.status !== 'ok') {
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

    if (result[1] === 'ignored') target.classList.add('hss-ignored');

    target.style.position = 'relative';
    target.appendChild(tagElem);
  };

  useEffect(() => {
    let observer: MutationObserver | null = null;
    (async () => {
      try {
        // Load user data
        const mappings = await tagMappings.mutateAsync();
        const cache = await mutateAsync();

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

        observer.observe(document.querySelector('body')!, {
          subtree: true,
          childList: true
        });
      } catch (e) {
        console.log(e);
      } finally {
        setTimeout(() => setFade(true), 2000);
      }
    })();
    return () => {
      observer?.disconnect();
    };
  }, []);

  return (
    <div
      className={cls('hss-toast hss-background', {
        'hss-shake': error || data?.status === 'noData',
        'hss-highlight': !fade
      })}
    >
      <h3 className="text-lg text-white">Steam tags extension</h3>
      <div className="text-[#7cb8e4] flex gap-1 items-center">
        {isLoading ? (
          <>
            <Spinner size={16} />
            <span>Loading tags...</span>
          </>
        ) : error ? (
          <>
            <XOctagon size={16} />
            <span>
              {error instanceof Error
                ? error.message
                : 'Unexpected error ocurred'}
            </span>
          </>
        ) : data?.status === 'noData' ? (
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
      {data?.status === 'ok' && (
        <DialogButton clickaway dialog={close => <Suggestion close={close} />}>
          {open => (
            <button
              type="button"
              onClick={open}
              className="text-white/60 flex gap-1 items-center"
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

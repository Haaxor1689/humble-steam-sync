import { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';

import { host_permissions, matches } from '@/permissions';

const allPermissions = [...host_permissions, ...matches];

// Permissions
const mapPermissions = (arr?: string[]) => [
	...new Set([
		...(arr ?? [])
			.map(p => p.match(/https:\/\/(.+?)\//)?.[1])
			.filter((v): v is string => !!v)
	])
];

const checkPermissions = async () => {
	const permissions = await browser.permissions.getAll();
	return mapPermissions(allPermissions).every(p =>
		mapPermissions(permissions.origins)?.find(o => o === p)
	);
};

const usePermissions = () => {
	const [hasAll, setHasAll] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		checkPermissions()
			.then(setHasAll)
			.finally(() => setLoading(false));
	}, []);

	const request = async () => {
		setLoading(true);
		try {
			const granted = await browser.permissions.request({
				origins: allPermissions
			});
			if (granted) setHasAll(true);
		} finally {
			setLoading(false);
		}
	};

	return { hasAll, loading, request };
};

export default usePermissions;

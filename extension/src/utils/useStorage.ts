import { useEffect, useState } from 'react';

import { Storage } from '@/worker/helpers';

const useStorage = <T>(key: string) => {
	const [value, setValue] = useState<T>();
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		Storage.get<T>(key)
			.then(setValue)
			.finally(() => setLoading(false));
	}, [key]);

	return {
		value,
		set: (val: T | undefined) =>
			Storage.set(key, val).then(() => setValue(val)),
		loading
	};
};

export default useStorage;

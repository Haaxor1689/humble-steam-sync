import { useEffect, useState } from 'react';

import {
	type ApiMethods,
	type ApiMethodsArgs,
	type ApiMethodsReturn
} from '@/worker';
import { callApi, revalidateApi } from '@/worker/helpers';

const useApi = <T extends ApiMethods>({
	action,
	args,
	disabled
}: {
	action: T;
	args: ApiMethodsArgs<T>;
	disabled?: boolean;
}) => {
	const [data, setData] = useState<Awaited<ApiMethodsReturn<T>>>();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error>();

	useEffect(() => {
		if (disabled) return;
		setError(undefined);
		setLoading(true);
		callApi(action, ...args)
			.then(res => setData(res))
			.catch(err => setError(err))
			.finally(() => setLoading(false));
	}, [action, ...args, disabled]);

	return {
		data,
		loading,
		error,
		revalidate: async () => {
			if (loading || disabled) return;
			setLoading(true);
			setError(undefined);
			await revalidateApi(action, ...args);
			await callApi(action, ...args)
				.then(res => setData(res))
				.catch(err => setError(err))
				.finally(() => setLoading(false));
		}
	};
};

export default useApi;

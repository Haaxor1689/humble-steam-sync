import { type ChangeEvent, useCallback, useEffect, useState } from 'react';

const useField = (id: string, initialValue = '') => {
	const [value, setValue] = useState(initialValue);
	const [touched, setTouched] = useState(false);

	useEffect(() => setValue(initialValue), [initialValue]);

	const error = touched && !value;

	return {
		// Meta props of the input
		meta: {
			error,
			helperText: error ? 'Required' : undefined,
			setValue
		},
		// Props for the TextField
		props: {
			id,
			value,
			onChange: useCallback(
				(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
					setValue(e.target.value),
				[]
			),
			onBlur: useCallback(() => setTouched(true), [])
		}
	} as const;
};

export default useField;

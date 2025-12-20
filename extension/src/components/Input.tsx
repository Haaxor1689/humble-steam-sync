import { type InputHTMLAttributes } from 'react';
import classNames from 'classnames';

const Input = (props: InputHTMLAttributes<HTMLInputElement>) => (
	<input
		{...props}
		className={classNames(
			'self-stretch border-b border-(--btn-outline) bg-transparent p-2 text-white',
			props.className
		)}
	/>
);

export default Input;

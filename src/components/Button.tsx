import { type ButtonHTMLAttributes } from 'react';
import classNames from 'classnames';

import Spinner from './Spinner';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
	loading?: boolean;
};

const Button = ({ loading, children, ...props }: Props) => (
	<button
		type="button"
		{...props}
		className={classNames('hss-button', props.className)}
	>
		{loading && <Spinner size={20} />}
		{children}
	</button>
);

export default Button;

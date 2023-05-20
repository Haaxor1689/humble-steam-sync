import { ButtonHTMLAttributes } from 'react';
import Spinner from './Spinner';
import classNames from 'classnames';

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

import { type ReactElement, useRef } from 'react';
import { createPortal } from 'react-dom';
import cls from 'classnames';

type Props = {
	clickAway?: boolean;
	dialog: (close: () => void) => ReactElement;
	children: (open: () => void) => ReactElement;
};

const DialogButton = ({ clickAway, dialog, children }: Props) => {
	const ref = useRef<HTMLDialogElement | null>(null);
	const open = () => ref.current?.showModal();
	const close = () => ref.current?.close();

	return (
		<>
			{createPortal(
				<dialog
					ref={ref}
					onClick={e => clickAway && e.target === ref.current && close()}
					className={cls(
						'flex h-full w-full items-center justify-center bg-transparent backdrop:backdrop-blur-sm [&:not([open])]:hidden'
					)}
				>
					{dialog(close)}
				</dialog>,
				document.body
			)}
			{children(open)}
		</>
	);
};

export default DialogButton;

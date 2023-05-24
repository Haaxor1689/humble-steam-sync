/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import cls from 'classnames';
import { useRef, type ReactElement } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  clickaway?: boolean;
  dialog: (close: () => void) => ReactElement;
  children: (open: () => void) => ReactElement;
};

const DialogButton = ({ clickaway, dialog, children }: Props) => {
  const ref = useRef<HTMLDialogElement | null>(null);
  const open = () => ref.current?.showModal();
  const close = () => ref.current?.close();

  return (
    <>
      {createPortal(
        <dialog
          ref={ref}
          onClick={e => clickaway && e.target === ref.current && close()}
          className={cls(
            'flex h-full w-full items-center justify-center bg-[transparent] backdrop:backdrop-blur-sm [&:not([open])]:hidden'
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

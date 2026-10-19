import { useEffect, useRef, type ReactNode } from 'react';
import styles from './NavDrawer.module.css';

interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/** Wysuwane z lewej menu nawigacji na telefonach i tabletach (natywny <dialog>). */
export function NavDrawer({ open, onClose, children }: NavDrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.drawer}
      aria-label="Menu nawigacji"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {open ? <div className={styles.content}>{children}</div> : null}
    </dialog>
  );
}

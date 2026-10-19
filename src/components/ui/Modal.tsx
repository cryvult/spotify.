import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IconButton } from './IconButton';
import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md';
}

/**
 * Okno dialogowe oparte na natywnym elemencie <dialog>. Przeglądarka sama dba o
 * pułapkę fokusu, klawisz Escape i warstwę przyciemnienia; po zamknięciu fokus wraca
 * do elementu, który otworzył okno.
 */
export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={`${styles.dialog} ${styles[size]}`}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        // Escape: zamykamy przez stan Reacta, aby zachować jedno źródło prawdy.
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // Kliknięcie w przyciemnione tło (poza zawartością) zamyka okno.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {open ? (
        <div className={styles.content}>
          <header className={styles.header}>
            <div>
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
              {description ? (
                <p id={descriptionId} className={styles.description}>
                  {description}
                </p>
              ) : null}
            </div>
            <IconButton icon={X} label="Zamknij" size="sm" onClick={onClose} showTooltip={false} />
          </header>
          {children ? <div className={styles.body}>{children}</div> : null}
          {footer ? <footer className={styles.footer}>{footer}</footer> : null}
        </div>
      ) : null}
    </dialog>
  );
}

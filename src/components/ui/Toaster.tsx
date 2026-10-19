import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { ToastItem } from '../../context/ToastContext';
import styles from './Toaster.module.css';

const ICONS = { info: Info, success: CircleCheck, error: CircleAlert } as const;

interface ToasterProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

/** Lista powiadomień. Region aria-live sprawia, że czytniki ekranu odczytują nowe komunikaty. */
export function Toaster({ toasts, onDismiss }: ToasterProps) {
  return createPortal(
    <div className={styles.region} aria-live="polite" aria-relevant="additions" role="status">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.tone];
        return (
          <div key={toast.id} className={`${styles.toast} ${styles[toast.tone]}`}>
            <Icon className={styles.icon} size={18} aria-hidden />
            <p className={styles.message}>{toast.message}</p>
            {toast.action ? (
              <button
                type="button"
                className={styles.action}
                onClick={() => {
                  toast.action?.onClick();
                  onDismiss(toast.id);
                }}
              >
                {toast.action.label}
              </button>
            ) : null}
            <button
              type="button"
              className={styles.close}
              aria-label="Zamknij powiadomienie"
              onClick={() => onDismiss(toast.id)}
            >
              <X size={16} aria-hidden />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}

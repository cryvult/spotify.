import { Modal } from '../../components/ui/Modal';
import { SHORTCUTS } from '../../hooks/shortcuts';
import styles from './Dialogs.module.css';

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Skróty klawiaturowe"
      description="Działają, gdy kursor nie jest w polu tekstowym."
    >
      <dl className={styles.shortcuts}>
        {SHORTCUTS.map((shortcut) => (
          <div key={shortcut.description} className={styles.shortcutRow}>
            <dt>{shortcut.description}</dt>
            <dd className={styles.keys}>
              {shortcut.keys.map((key) => (
                <kbd key={key}>{key}</kbd>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}

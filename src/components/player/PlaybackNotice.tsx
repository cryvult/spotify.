import { CircleAlert, RotateCcw } from 'lucide-react';
import { usePlayerControls, usePlayerState } from '../../context/PlayerContext';
import styles from './PlaybackNotice.module.css';

/**
 * Czytelny komunikat, gdy utworu nie da się odtworzyć albo przeglądarka zablokowała
 * automatyczne odtwarzanie. Aplikacja nie udaje wtedy, że muzyka gra.
 */
export function PlaybackNotice() {
  const { state } = usePlayerState();
  const { retry, togglePlay } = usePlayerControls();

  if (state.status === 'error' && state.error) {
    return (
      <p className={`${styles.notice} ${styles.error}`} role="alert">
        <CircleAlert size={14} aria-hidden />
        {/* Krótki tekst na pasku; pełny powód jest w podpowiedzi i dla czytników ekranu. */}
        <span title={state.error}>
          Nie można odtworzyć utworu.<span className="visually-hidden"> {state.error}</span>
        </span>
        <button type="button" className={styles.action} onClick={retry}>
          <RotateCcw size={13} aria-hidden />
          Spróbuj ponownie
        </button>
      </p>
    );
  }
  if (state.autoplayBlocked) {
    return (
      <p className={styles.notice} role="status">
        <span>Przeglądarka wstrzymała dźwięk.</span>
        <button type="button" className={styles.action} onClick={togglePlay}>
          Odtwórz
        </button>
      </p>
    );
  }
  return null;
}

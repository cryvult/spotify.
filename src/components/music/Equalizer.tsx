import styles from './Equalizer.module.css';

/** Animowane słupki przy odtwarzanym utworze. Przy pauzie zatrzymują się. */
export function Equalizer({ playing }: { playing: boolean }) {
  return (
    <span className={`${styles.equalizer} ${playing ? styles.playing : ''}`} aria-hidden>
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

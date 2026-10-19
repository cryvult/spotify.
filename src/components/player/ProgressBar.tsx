import { useState } from 'react';
import { usePlaybackProgress, usePlayerControls, usePlayerState } from '../../context/PlayerContext';
import { describeDuration, formatDuration } from '../../utils/formatDuration';
import { Slider } from '../ui/Slider';
import styles from './ProgressBar.module.css';

/**
 * Pasek postępu z czasem bieżącym i całkowitym. Podczas przeciągania pokazujemy
 * podgląd pozycji, a przewijamy dopiero po puszczeniu suwaka (mniej przerw w buforowaniu).
 */
export function ProgressBar({ compact = false }: { compact?: boolean }) {
  const { currentTime, duration: mediaDuration, buffered } = usePlaybackProgress();
  const { currentTrack } = usePlayerState();
  const { seek } = usePlayerControls();
  const [dragValue, setDragValue] = useState<number | null>(null);

  // Zanim przeglądarka odczyta długość pliku, używamy długości z danych katalogu.
  const duration = mediaDuration > 0 ? mediaDuration : (currentTrack?.durationSec ?? 0);
  const shown = dragValue ?? Math.min(currentTime, duration);
  const disabled = !currentTrack || duration <= 0;

  const commit = () => {
    if (dragValue !== null) seek(dragValue);
    setDragValue(null);
  };

  return (
    <div className={`${styles.progress} ${compact ? styles.compact : ''}`}>
      <span className={styles.time} aria-hidden>
        {formatDuration(shown)}
      </span>
      <Slider
        label="Pozycja w utworze"
        value={shown}
        min={0}
        max={Math.max(duration, 1)}
        step={0.1}
        disabled={disabled}
        valueText={`${describeDuration(shown)} z ${describeDuration(duration)}`}
        bufferedPercent={duration > 0 ? (buffered / duration) * 100 : 0}
        onChange={setDragValue}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
        onTouchEnd={commit}
      />
      <span className={styles.time} aria-hidden>
        {formatDuration(duration)}
      </span>
    </div>
  );
}

import { Volume, Volume1, Volume2, VolumeX } from 'lucide-react';
import { usePlayerControls, usePlayerState } from '../../context/PlayerContext';
import { IconButton } from '../ui/IconButton';
import { Slider } from '../ui/Slider';
import styles from './VolumeControl.module.css';

export function VolumeControl() {
  const { state } = usePlayerState();
  const { setVolume, toggleMute, canControlVolume } = usePlayerControls();
  const effective = state.muted ? 0 : state.volume;
  const Icon = effective === 0 ? VolumeX : effective < 0.35 ? Volume : effective < 0.7 ? Volume1 : Volume2;

  if (!canControlVolume) {
    return <p className={styles.note}>Głośność regulujesz przyciskami urządzenia.</p>;
  }

  return (
    <div className={styles.volume}>
      <IconButton
        icon={Icon}
        label={state.muted ? 'Włącz dźwięk' : 'Wycisz'}
        size="sm"
        onClick={toggleMute}
      />
      <Slider
        className={styles.slider}
        label="Głośność"
        value={Math.round(effective * 100)}
        min={0}
        max={100}
        valueText={`${Math.round(effective * 100)}%`}
        onChange={(value) => setVolume(value / 100)}
      />
    </div>
  );
}

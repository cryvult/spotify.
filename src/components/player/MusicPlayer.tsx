import { ListMusic } from 'lucide-react';
import { usePlayerState } from '../../context/PlayerContext';
import { useUI } from '../../context/UIContext';
import { IconButton } from '../ui/IconButton';
import { PlaybackNotice } from './PlaybackNotice';
import { PlayerControls } from './PlayerControls';
import { ProgressBar } from './ProgressBar';
import { TrackInfo } from './TrackInfo';
import { VolumeControl } from './VolumeControl';
import styles from './MusicPlayer.module.css';

/** Stały odtwarzacz na dole ekranu (tablety i komputery). */
export function MusicPlayer() {
  const { currentTrack } = usePlayerState();
  const { isQueueOpen, toggleQueue } = useUI();

  return (
    <section className={styles.player} aria-label="Odtwarzacz">
      <div className={styles.left}>
        <TrackInfo track={currentTrack} />
      </div>
      <div className={styles.center}>
        <PlayerControls />
        <ProgressBar />
        <div className={styles.notice}>
          <PlaybackNotice />
        </div>
      </div>
      <div className={styles.right}>
        <IconButton
          icon={ListMusic}
          label="Kolejka odtwarzania"
          tooltip="Kolejka"
          size="sm"
          active={isQueueOpen}
          onClick={toggleQueue}
        />
        <VolumeControl />
      </div>
    </section>
  );
}

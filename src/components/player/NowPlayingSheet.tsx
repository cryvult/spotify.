import { ChevronDown, ListMusic } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { usePlayerState } from '../../context/PlayerContext';
import { useUI } from '../../context/UIContext';
import { CoverImage } from '../music/CoverImage';
import { LikeButton } from '../music/LikeButton';
import { IconButton } from '../ui/IconButton';
import { PlaybackNotice } from './PlaybackNotice';
import { PlayerControls } from './PlayerControls';
import { ProgressBar } from './ProgressBar';
import { VolumeControl } from './VolumeControl';
import styles from './NowPlayingSheet.module.css';

/** Pełnoekranowy widok odtwarzania na telefonach (natywny <dialog>, więc działa Escape i fokus). */
export function NowPlayingSheet() {
  const { currentTrack, state } = usePlayerState();
  const { isNowPlayingOpen, setNowPlayingOpen, setQueueOpen } = useUI();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const open = isNowPlayingOpen && currentTrack !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = () => setNowPlayingOpen(false);

  return (
    <dialog
      ref={dialogRef}
      className={styles.sheet}
      aria-label="Teraz odtwarzane"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      {open && currentTrack ? (
        <div className={styles.content}>
          <header className={styles.header}>
            <IconButton icon={ChevronDown} label="Zwiń odtwarzacz" onClick={close} showTooltip={false} />
            <div className={styles.context}>
              <span className={styles.contextLabel}>Odtwarzane z</span>
              <span className={styles.contextTitle}>{state.context?.title ?? 'Kolejki'}</span>
            </div>
            <IconButton
              icon={ListMusic}
              label="Pokaż kolejkę"
              showTooltip={false}
              onClick={() => {
                close();
                setQueueOpen(true);
              }}
            />
          </header>

          <CoverImage
            src={currentTrack.coverUrl}
            alt={`Okładka: ${currentTrack.albumTitle ?? currentTrack.title}`}
            size={600}
            className={styles.cover}
            eager
          />

          <div className={styles.titleRow}>
            <div className={styles.titles}>
              <h2 className={styles.title}>{currentTrack.title}</h2>
              {currentTrack.artistId ? (
                <Link to={`/artist/${currentTrack.artistId}`} className={styles.artist} onClick={close}>
                  {currentTrack.artistName}
                </Link>
              ) : (
                <span className={styles.artist}>{currentTrack.artistName}</span>
              )}
            </div>
            <LikeButton track={currentTrack} size="md" />
          </div>

          <ProgressBar />
          <PlayerControls size="lg" />
          <div className={styles.notice}>
            <PlaybackNotice />
          </div>
          <div className={styles.volume}>
            <VolumeControl />
          </div>
        </div>
      ) : null}
    </dialog>
  );
}

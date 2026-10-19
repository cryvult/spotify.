import { ListX, X } from 'lucide-react';
import { Link } from 'react-router';
import { usePlayerControls, usePlayerState, type QueueItem } from '../../context/PlayerContext';
import { useUI } from '../../context/UIContext';
import type { Track } from '../../types/music';
import { formatDuration } from '../../utils/formatDuration';
import { CoverImage } from '../music/CoverImage';
import { Equalizer } from '../music/Equalizer';
import { IconButton } from '../ui/IconButton';
import styles from './QueuePanel.module.css';

const REPEAT_INFO = { off: null, all: 'Powtarzanie kolejki', one: 'Powtarzanie utworu' } as const;

/** Panel kolejki: bieżący utwór, utwory dodane ręcznie i dalsza część odtwarzanej listy. */
export function QueuePanel() {
  const { state, currentTrack, isPlaying, upcoming } = usePlayerState();
  const controls = usePlayerControls();
  const { setQueueOpen } = useUI();
  const userItems = upcoming.filter((item) => item.entry.origin === 'user');
  const contextItems = upcoming.filter((item) => item.entry.origin === 'context');
  const modes = [state.shuffle ? 'Odtwarzanie losowe' : null, REPEAT_INFO[state.repeat]]
    .filter(Boolean)
    .join(' · ');

  return (
    <aside className={styles.panel} aria-label="Kolejka odtwarzania">
      <header className={styles.header}>
        <div>
          <h2 className={styles.heading}>Kolejka</h2>
          {modes ? <p className={styles.modes}>{modes}</p> : null}
        </div>
        <IconButton icon={X} label="Zamknij kolejkę" size="sm" onClick={() => setQueueOpen(false)} />
      </header>

      <div className={styles.scroll}>
        <section aria-labelledby="queue-now">
          <h3 id="queue-now" className={styles.sectionTitle}>
            Teraz odtwarzane
          </h3>
          {currentTrack ? (
            <div className={`${styles.item} ${styles.current}`}>
              <CoverImage src={currentTrack.coverUrl} alt="" size={80} className={styles.cover} />
              <ItemText track={currentTrack} />
              <span className={styles.trailing}>
                <Equalizer playing={isPlaying} />
              </span>
            </div>
          ) : (
            <p className={styles.empty}>Nic teraz nie gra.</p>
          )}
        </section>

        {userItems.length > 0 ? (
          <section aria-labelledby="queue-user">
            <div className={styles.sectionHeader}>
              <h3 id="queue-user" className={styles.sectionTitle}>
                Następne w kolejce
              </h3>
            </div>
            <QueueList items={userItems} />
          </section>
        ) : null}

        {contextItems.length > 0 ? (
          <section aria-labelledby="queue-context">
            <h3 id="queue-context" className={styles.sectionTitle}>
              {state.context ? (
                <>
                  Następnie z:{' '}
                  {state.context.path ? (
                    <Link to={state.context.path} className={styles.contextLink}>
                      {state.context.title}
                    </Link>
                  ) : (
                    state.context.title
                  )}
                </>
              ) : (
                'Następnie'
              )}
            </h3>
            <QueueList items={contextItems} />
          </section>
        ) : null}

        {upcoming.length === 0 && currentTrack ? (
          <p className={styles.empty}>
            To ostatni utwór w kolejce. Dodaj kolejne poleceniem „Dodaj do kolejki” w menu utworu.
          </p>
        ) : null}

        {upcoming.length > 0 ? (
          <button type="button" className={styles.clear} onClick={controls.clearUpcoming}>
            <ListX size={16} aria-hidden />
            Wyczyść następne utwory
          </button>
        ) : null}
      </div>
    </aside>
  );
}

function ItemText({ track }: { track: Track }) {
  return (
    <span className={styles.text}>
      <span className={styles.title}>{track.title}</span>
      <span className={styles.artist}>{track.artistName}</span>
    </span>
  );
}

function QueueList({ items }: { items: QueueItem[] }) {
  const { jumpTo, removeFromQueue } = usePlayerControls();
  return (
    <ol className={styles.list}>
      {items.map(({ entry, track }) => (
        <li key={entry.uid} className={styles.item}>
          <button
            type="button"
            className={styles.itemButton}
            onClick={() => jumpTo(entry.uid)}
            aria-label={`Odtwórz teraz: ${track.title}, ${track.artistName}`}
          >
            <CoverImage src={track.coverUrl} alt="" size={80} className={styles.cover} />
            <ItemText track={track} />
            <span className={styles.duration}>
              {track.durationSec > 0 ? formatDuration(track.durationSec) : ''}
            </span>
          </button>
          <IconButton
            icon={X}
            label={`Usuń z kolejki: ${track.title}`}
            tooltip="Usuń z kolejki"
            size="sm"
            onClick={() => removeFromQueue(entry.uid)}
          />
        </li>
      ))}
    </ol>
  );
}

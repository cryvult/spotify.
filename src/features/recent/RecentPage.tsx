import { History, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { TrackList } from '../../components/music/TrackList';
import { Button } from '../../components/ui/Button';
import { buttonClassName } from '../../components/ui/buttonClassName';
import { EmptyState } from '../../components/ui/EmptyState';
import { useDialogs } from '../../context/DialogContext';
import { useLibrary } from '../../context/LibraryContext';
import { useToast } from '../../context/ToastContext';
import { useCollectionPlayback } from '../../hooks/useCollectionPlayback';
import type { Track } from '../../types/music';
import { formatRelativeDay } from '../../utils/formatDate';
import { Page } from '../shared/Page';
import { PlaybackActions } from '../shared/PlaybackActions';
import styles from './RecentPage.module.css';

interface Group {
  label: string;
  items: Array<{ track: Track; playedAt: string; index: number }>;
}

export default function RecentPage() {
  const library = useLibrary();
  const dialogs = useDialogs();
  const { showToast } = useToast();
  const entries = library.recent
    .map((entry) => ({ track: library.resolveTrack(entry.trackId), playedAt: entry.playedAt }))
    .filter((entry): entry is { track: Track; playedAt: string } => entry.track !== undefined);
  const tracks = entries.map((entry) => entry.track);
  const playback = useCollectionPlayback(
    { type: 'recent', id: 'recent', title: 'Ostatnio odtwarzane', path: '/recent' },
    tracks,
  );

  // Grupowanie historii po dniach: „Dzisiaj”, „Wczoraj”, data.
  const groups: Group[] = [];
  entries.forEach((entry, index) => {
    const label = formatRelativeDay(entry.playedAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push({ ...entry, index });
    else groups.push({ label, items: [{ ...entry, index }] });
  });

  const clear = async () => {
    const confirmed = await dialogs.confirm({
      title: 'Wyczyścić historię?',
      message: 'Lista ostatnio odtwarzanych utworów zostanie usunięta z tej przeglądarki.',
      confirmLabel: 'Wyczyść historię',
      tone: 'danger',
    });
    if (confirmed) {
      library.clearRecent();
      showToast({ message: 'Wyczyszczono historię odtwarzania.' });
    }
  };

  return (
    <Page
      title="Ostatnio odtwarzane"
      description="Ostatnie 50 utworów, które zostały odtworzone w tej przeglądarce."
    >
      {tracks.length === 0 ? (
        <EmptyState
          icon={History}
          title="Historia jest pusta"
          description="Odtwórz dowolny utwór, a pojawi się tutaj. Dzięki temu łatwo wrócisz do muzyki z ostatnich dni."
          actions={
            <Link to="/discover" className={buttonClassName({ variant: 'primary' })}>
              Odkrywaj muzykę
            </Link>
          }
        />
      ) : (
        <>
          <div className={styles.actions}>
            <PlaybackActions playback={playback} title="Ostatnio odtwarzane" />
            <Button variant="ghost" icon={Trash2} onClick={() => void clear()} className={styles.clear}>
              Wyczyść historię
            </Button>
          </div>
          {groups.map((group) => (
            <section key={group.label} className={styles.group} aria-label={group.label}>
              <h2 className={styles.day}>{group.label}</h2>
              <TrackList
                label={`Odtworzone: ${group.label}`}
                tracks={group.items.map((item) => item.track)}
                showAlbum
                showHeader={false}
                onPlayTrack={(index) => playback.playAt(group.items[index]?.index ?? 0)}
                isActiveContext={playback.isActive}
                onTogglePlay={playback.togglePlay}
              />
            </section>
          ))}
        </>
      )}
    </Page>
  );
}

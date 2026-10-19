import { Heart } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { CollectionHeader } from '../../components/music/CollectionHeader';
import { LikedCover } from '../../components/music/LikedCover';
import { TrackList } from '../../components/music/TrackList';
import { buttonClassName } from '../../components/ui/buttonClassName';
import { EmptyState } from '../../components/ui/EmptyState';
import { useLibrary } from '../../context/LibraryContext';
import { useCollectionPlayback } from '../../hooks/useCollectionPlayback';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import type { Track } from '../../types/music';
import { collectionSummary } from '../shared/collectionSummary';
import { PageBody } from '../shared/Page';
import { PlaybackActions } from '../shared/PlaybackActions';
import { sortLikedTracks, type LikedSort } from './sortLikedTracks';
import styles from './LikedSongsPage.module.css';

export default function LikedSongsPage() {
  useDocumentTitle('Ulubione utwory');
  const library = useLibrary();
  const [sort, setSort] = useState<LikedSort>('added');
  const entries = library.liked
    .map((entry) => ({ track: library.resolveTrack(entry.trackId), addedAt: entry.addedAt }))
    .filter((entry): entry is { track: Track; addedAt: string } => entry.track !== undefined);
  const sorted = sortLikedTracks(entries, sort);
  const tracks = sorted.map((entry) => entry.track);
  const playback = useCollectionPlayback(
    { type: 'liked', id: 'liked', title: 'Ulubione utwory', path: '/liked' },
    tracks,
  );

  return (
    <>
      <CollectionHeader
        kind="Playlista"
        title="Ulubione utwory"
        accentColor="#4a2fc4"
        cover={<LikedCover iconSize={64} />}
        meta={<span>{collectionSummary(tracks)}</span>}
        actions={
          <>
            <PlaybackActions playback={playback} title="Ulubione utwory" disabled={tracks.length === 0} />
            {tracks.length > 1 ? (
              <label className={styles.sort}>
                <span>Sortuj według</span>
                <select value={sort} onChange={(event) => setSort(event.target.value as LikedSort)}>
                  <option value="added">Daty dodania</option>
                  <option value="title">Tytułu</option>
                  <option value="artist">Wykonawcy</option>
                </select>
              </label>
            ) : null}
          </>
        }
      />
      <PageBody>
        {tracks.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Nie masz jeszcze ulubionych utworów"
            description="Kliknij serce przy utworze, aby zapisać go tutaj. Ulubione zostaną w tej przeglądarce także po jej zamknięciu."
            actions={
              <Link to="/" className={buttonClassName({ variant: 'primary' })}>
                Znajdź coś do polubienia
              </Link>
            }
          />
        ) : (
          <TrackList
            label="Ulubione utwory"
            tracks={tracks}
            showAlbum
            addedAt={sorted.map((entry) => entry.addedAt)}
            onPlayTrack={playback.playAt}
            isActiveContext={playback.isActive}
            onTogglePlay={playback.togglePlay}
          />
        )}
      </PageBody>
    </>
  );
}

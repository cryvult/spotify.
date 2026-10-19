import { Library, Plus, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { CoverImage } from '../../components/music/CoverImage';
import { LikedCover } from '../../components/music/LikedCover';
import { PlayButton } from '../../components/music/PlayButton';
import { PlaylistCover } from '../../components/music/PlaylistCover';
import { TrackList } from '../../components/music/TrackList';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterChips } from '../../components/ui/FilterChips';
import { useDialogs } from '../../context/DialogContext';
import { useLibrary } from '../../context/LibraryContext';
import {
  albumTypeLabel,
  ALBUMS,
  ARTISTS,
  FEATURED_PLAYLISTS,
  getAlbumTracks,
  getArtist,
  getArtistTracks,
  getTracksByIds,
  TRACKS,
} from '../../data/catalog';
import { useCollectionPlayback } from '../../hooks/useCollectionPlayback';
import type { Track } from '../../types/music';
import type { PlaybackContext } from '../../types/player';
import { formatCount, TRACK_FORMS } from '../../utils/pluralize';
import { normalizeQuery, normalizeText } from '../../utils/normalizeText';
import { Page } from '../shared/Page';
import styles from './LibraryPage.module.css';

type View = 'all' | 'playlists' | 'albums' | 'artists' | 'tracks' | 'liked' | 'recent';
const VIEWS: View[] = ['all', 'playlists', 'albums', 'artists', 'tracks', 'liked', 'recent'];
type Sort = 'default' | 'alpha';
const collator = new Intl.Collator('pl', { sensitivity: 'base' });

interface LibraryItem {
  key: string;
  kind: 'playlist' | 'album' | 'artist';
  title: string;
  subtitle: string;
  to: string;
  image: ReactNode;
  round?: boolean;
  tracks: Track[];
  context: PlaybackContext;
}

/** Biblioteka: lista playlist, albumów i wykonawców oraz widoki utworów, ulubionych i historii. */
export default function LibraryPage() {
  const [params, setParams] = useSearchParams();
  const rawView = params.get('view') as View | null;
  const view: View = rawView && VIEWS.includes(rawView) ? rawView : 'all';
  const filterText = params.get('filter') ?? '';
  const sort: Sort = params.get('sort') === 'alpha' ? 'alpha' : 'default';
  const library = useLibrary();
  const { openCreatePlaylist } = useDialogs();

  const update = (changes: Record<string, string | null>) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
        return next;
      },
      { replace: true },
    );

  const likedTracks = library.resolveTracks(library.liked.map((entry) => entry.trackId));
  const recentTracks = library.resolveTracks(library.recent.map((entry) => entry.trackId));

  const items: LibraryItem[] = [
    {
      key: 'liked',
      kind: 'playlist',
      title: 'Ulubione utwory',
      subtitle: `Playlista · ${formatCount(likedTracks.length, TRACK_FORMS)}`,
      to: '/liked',
      image: <LikedCover iconSize={18} />,
      tracks: likedTracks,
      context: { type: 'liked', id: 'liked', title: 'Ulubione utwory', path: '/liked' },
    },
    ...library.playlists.map((playlist) => ({
      key: playlist.id,
      kind: 'playlist' as const,
      title: playlist.title,
      subtitle: `Twoja playlista · ${formatCount(playlist.items.length, TRACK_FORMS)}`,
      to: `/playlist/${playlist.id}`,
      image: <PlaylistCover playlist={playlist} size={112} />,
      tracks: library.resolveTracks(playlist.items.map((item) => item.trackId)),
      context: {
        type: 'playlist' as const,
        id: playlist.id,
        title: playlist.title,
        path: `/playlist/${playlist.id}`,
      },
    })),
    ...FEATURED_PLAYLISTS.map((playlist) => ({
      key: playlist.id,
      kind: 'playlist' as const,
      title: playlist.title,
      subtitle: 'Playlista · SONORA',
      to: `/playlist/${playlist.id}`,
      image: <CoverImage src={playlist.coverUrl} alt="" size={112} />,
      tracks: getTracksByIds(playlist.trackIds),
      context: {
        type: 'playlist' as const,
        id: playlist.id,
        title: playlist.title,
        path: `/playlist/${playlist.id}`,
      },
    })),
    ...ALBUMS.map((album) => ({
      key: album.id,
      kind: 'album' as const,
      title: album.title,
      subtitle: `${albumTypeLabel(album.type)} · ${getArtist(album.artistId)?.name ?? ''}`,
      to: `/album/${album.id}`,
      image: <CoverImage src={album.coverUrl} alt="" size={112} />,
      tracks: getAlbumTracks(album.id),
      context: { type: 'album' as const, id: album.id, title: album.title, path: `/album/${album.id}` },
    })),
    ...ARTISTS.map((artist) => ({
      key: artist.id,
      kind: 'artist' as const,
      title: artist.name,
      subtitle: 'Wykonawca',
      to: `/artist/${artist.id}`,
      image: <CoverImage src={artist.imageUrl} alt="" size={112} shape="circle" />,
      round: true,
      tracks: getArtistTracks(artist.id),
      context: { type: 'artist' as const, id: artist.id, title: artist.name, path: `/artist/${artist.id}` },
    })),
  ];

  const needle = normalizeQuery(filterText);
  const matches = (text: string) => !needle || normalizeText(text).includes(needle);
  const kindFor: Partial<Record<View, LibraryItem['kind']>> = {
    playlists: 'playlist',
    albums: 'album',
    artists: 'artist',
  };
  const listed = items
    .filter((item) => (kindFor[view] ? item.kind === kindFor[view] : true))
    .filter((item) => matches(`${item.title} ${item.subtitle}`));
  const sortedItems =
    sort === 'alpha' ? [...listed].sort((a, b) => collator.compare(a.title, b.title)) : listed;

  const trackSource = view === 'liked' ? likedTracks : view === 'recent' ? recentTracks : TRACKS;
  const filteredTracks = trackSource.filter((track) =>
    matches(`${track.title} ${track.artistName} ${track.albumTitle ?? ''}`),
  );
  const sortedTracks =
    sort === 'alpha'
      ? [...filteredTracks].sort((a, b) => collator.compare(a.title, b.title))
      : filteredTracks;

  const isTrackView = view === 'tracks' || view === 'liked' || view === 'recent';

  return (
    <Page
      title="Moja biblioteka"
      description="Wszystko w jednym miejscu: playlisty, albumy, wykonawcy i utwory."
      actions={
        <Button variant="secondary" icon={Plus} onClick={() => openCreatePlaylist()}>
          Nowa playlista
        </Button>
      }
    >
      <div className={styles.toolbar}>
        <FilterChips
          label="Widok biblioteki"
          value={view}
          onChange={(value) => update({ view: value === 'all' ? null : value })}
          options={[
            { value: 'all', label: 'Wszystko' },
            { value: 'playlists', label: 'Playlisty' },
            { value: 'albums', label: 'Albumy' },
            { value: 'artists', label: 'Wykonawcy' },
            { value: 'tracks', label: 'Utwory' },
            { value: 'liked', label: 'Ulubione', count: likedTracks.length },
            { value: 'recent', label: 'Ostatnio odtwarzane' },
          ]}
        />
        <div className={styles.controls}>
          <label className={styles.filter}>
            <Search size={16} aria-hidden />
            <span className="visually-hidden">Filtruj bibliotekę</span>
            <input
              type="search"
              placeholder="Filtruj"
              value={filterText}
              onChange={(event) => update({ filter: event.target.value || null })}
            />
          </label>
          <label className={styles.sort}>
            <span className="visually-hidden">Sortowanie</span>
            <select
              value={sort}
              onChange={(event) => update({ sort: event.target.value === 'alpha' ? 'alpha' : null })}
            >
              <option value="default">{view === 'recent' ? 'Od najnowszych' : 'Domyślnie'}</option>
              <option value="alpha">Alfabetycznie</option>
            </select>
          </label>
        </div>
      </div>

      {isTrackView ? (
        sortedTracks.length > 0 ? (
          <LibraryTracks view={view} tracks={sortedTracks} />
        ) : (
          <EmptyState
            compact
            icon={Library}
            title={
              needle
                ? 'Nic nie pasuje do filtra'
                : view === 'liked'
                  ? 'Brak ulubionych utworów'
                  : 'Historia jest pusta'
            }
            description={
              needle ? 'Zmień lub wyczyść tekst filtra.' : 'Odtwarzaj i polub utwory, a pojawią się tutaj.'
            }
          />
        )
      ) : sortedItems.length > 0 ? (
        <ul className={styles.list} aria-label="Elementy biblioteki">
          {sortedItems.map((item) => (
            <LibraryRow key={item.key} item={item} />
          ))}
        </ul>
      ) : (
        <EmptyState
          compact
          icon={Library}
          title="Nic nie pasuje do filtra"
          description="Zmień lub wyczyść tekst filtra."
        />
      )}
    </Page>
  );
}

function LibraryTracks({ view, tracks }: { view: View; tracks: Track[] }) {
  const title =
    view === 'liked' ? 'Ulubione utwory' : view === 'recent' ? 'Ostatnio odtwarzane' : 'Wszystkie utwory';
  const playback = useCollectionPlayback(
    {
      type: view === 'liked' ? 'liked' : view === 'recent' ? 'recent' : 'playlist',
      id: `library-${view}`,
      title,
      path: `/library?view=${view}`,
    },
    tracks,
  );
  return (
    <TrackList
      label={title}
      tracks={tracks}
      showAlbum
      onPlayTrack={playback.playAt}
      isActiveContext={playback.isActive}
      onTogglePlay={playback.togglePlay}
    />
  );
}

function LibraryRow({ item }: { item: LibraryItem }) {
  const playback = useCollectionPlayback(item.context, item.tracks);
  return (
    <li className={styles.row}>
      <span className={`${styles.image} ${item.round ? styles.round : ''}`}>{item.image}</span>
      <span className={styles.text}>
        <Link to={item.to} className={`${styles.title} ${playback.isActive ? styles.active : ''}`}>
          {item.title}
        </Link>
        <span className={styles.subtitle}>{item.subtitle}</span>
      </span>
      {item.tracks.length > 0 ? (
        <PlayButton
          size="sm"
          playing={playback.isPlaying}
          label={playback.isPlaying ? `Wstrzymaj: ${item.title}` : `Odtwórz: ${item.title}`}
          className={`${styles.play} ${playback.isPlaying ? styles.playVisible : ''}`}
          onClick={playback.toggle}
        />
      ) : null}
    </li>
  );
}

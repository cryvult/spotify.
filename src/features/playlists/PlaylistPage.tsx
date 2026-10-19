import {
  CopyPlus,
  Link2,
  ListEnd,
  ListMusic,
  ListPlus,
  Pencil,
  Plus,
  Search,
  Share2,
  Trash2,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { CoverImage } from '../../components/music/CoverImage';
import { CollectionHeader } from '../../components/music/CollectionHeader';
import { PlaylistCover } from '../../components/music/PlaylistCover';
import { TrackList } from '../../components/music/TrackList';
import { buttonClassName } from '../../components/ui/buttonClassName';
import { EmptyState } from '../../components/ui/EmptyState';
import { IconButton } from '../../components/ui/IconButton';
import type { MenuItem } from '../../components/ui/Menu';
import { MenuButton } from '../../components/ui/MenuButton';
import { useDialogs } from '../../context/DialogContext';
import { useLibrary } from '../../context/LibraryContext';
import { useToast } from '../../context/ToastContext';
import { getFeaturedPlaylist, getTracksByIds } from '../../data/catalog';
import { useCollectionPlayback } from '../../hooks/useCollectionPlayback';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useTrackActions } from '../../hooks/useTrackActions';
import type { FeaturedPlaylist, Track, UserPlaylist } from '../../types/music';
import { appUrl, copyText } from '../../utils/share';
import { NotFoundContent } from '../errors/NotFoundContent';
import { recommendTracks } from '../player/recommendations';
import { collectionSummary } from '../shared/collectionSummary';
import { PageBody } from '../shared/Page';
import { PlaybackActions } from '../shared/PlaybackActions';
import { encodeSharedPlaylist } from './playlistShare';
import styles from './PlaylistPage.module.css';

export default function PlaylistPage() {
  const { id = '' } = useParams();
  const { getPlaylist } = useLibrary();
  const userPlaylist = getPlaylist(id);
  const featured = userPlaylist ? undefined : getFeaturedPlaylist(id);

  if (userPlaylist) return <UserPlaylistView playlist={userPlaylist} />;
  if (featured) return <FeaturedPlaylistView playlist={featured} />;
  return (
    <NotFoundContent
      title="Nie znaleziono playlisty"
      description="Ta playlista nie istnieje albo została usunięta. Własne playlisty są zapisane tylko w przeglądarce, w której je utworzono."
    />
  );
}

// ------------------------------------------------------------------ playlista redakcyjna

function FeaturedPlaylistView({ playlist }: { playlist: FeaturedPlaylist }) {
  useDocumentTitle(playlist.title);
  const tracks = getTracksByIds(playlist.trackIds);
  const library = useLibrary();
  const actions = useTrackActions();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const playback = useCollectionPlayback(
    { type: 'playlist', id: playlist.id, title: playlist.title, path: `/playlist/${playlist.id}` },
    tracks,
  );

  const menu: MenuItem[] = [
    { id: 'queue', label: 'Dodaj do kolejki', icon: ListEnd, onSelect: () => actions.addToQueue(tracks) },
    {
      id: 'add',
      label: 'Dodaj utwory do playlisty…',
      icon: ListPlus,
      onSelect: () => actions.addToPlaylist(tracks),
    },
    {
      id: 'copy',
      label: 'Zapisz jako własną playlistę',
      icon: CopyPlus,
      onSelect: () => {
        const id = library.createPlaylist(
          { title: playlist.title, description: playlist.description },
          tracks,
        );
        if (id) {
          showToast({ tone: 'success', message: `Zapisano kopię „${playlist.title}” w Twoich playlistach.` });
          navigate(`/playlist/${id}`);
        }
      },
    },
    {
      id: 'link',
      label: 'Kopiuj link',
      icon: Link2,
      separatorBefore: true,
      onSelect: () => void actions.copyLink(`/playlist/${playlist.id}`, 'link do playlisty'),
    },
  ];

  return (
    <>
      <CollectionHeader
        kind="Playlista"
        title={playlist.title}
        description={playlist.description}
        accentColor={playlist.accentColor}
        cover={
          <CoverImage src={playlist.coverUrl} alt={`Okładka playlisty ${playlist.title}`} size={480} eager />
        }
        meta={
          <>
            <strong>SONORA</strong>
            <span aria-hidden>·</span>
            <span>{collectionSummary(tracks)}</span>
          </>
        }
        actions={
          <PlaybackActions playback={playback} title={playlist.title}>
            <MenuButton
              items={menu}
              label={`Więcej opcji: ${playlist.title}`}
              tooltip="Więcej opcji"
              size="lg"
            />
          </PlaybackActions>
        }
      />
      <PageBody>
        <TrackList
          label={`Utwory na playliście ${playlist.title}`}
          tracks={tracks}
          showAlbum
          onPlayTrack={playback.playAt}
          isActiveContext={playback.isActive}
          onTogglePlay={playback.togglePlay}
        />
      </PageBody>
    </>
  );
}

// ------------------------------------------------------------------ playlista użytkownika

function UserPlaylistView({ playlist }: { playlist: UserPlaylist }) {
  useDocumentTitle(playlist.title);
  const library = useLibrary();
  const dialogs = useDialogs();
  const actions = useTrackActions();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const tracks = library.resolveTracks(playlist.items.map((item) => item.trackId));
  const addedAt = playlist.items
    .filter((item) => library.resolveTrack(item.trackId))
    .map((item) => item.addedAt);
  const playback = useCollectionPlayback(
    { type: 'playlist', id: playlist.id, title: playlist.title, path: `/playlist/${playlist.id}` },
    tracks,
  );

  const removeTrack = (track: Track) => {
    library.removeFromPlaylist(playlist.id, track.id);
    showToast({
      message: `Usunięto „${track.title}” z playlisty.`,
      action: { label: 'Cofnij', onClick: () => library.addToPlaylist(playlist.id, [track]) },
    });
  };

  const deletePlaylist = async () => {
    const confirmed = await dialogs.confirm({
      title: 'Usunąć playlistę?',
      message: `Playlista „${playlist.title}” zostanie trwale usunięta z tej przeglądarki. Utwory pozostaną w katalogu.`,
      confirmLabel: 'Usuń playlistę',
      tone: 'danger',
    });
    if (!confirmed) return;
    library.deletePlaylist(playlist.id);
    showToast({ message: `Usunięto playlistę „${playlist.title}”.` });
    navigate('/playlists');
  };

  const share = async () => {
    const { code, skipped } = encodeSharedPlaylist({
      title: playlist.title,
      description: playlist.description,
      trackIds: playlist.items.map((item) => item.trackId),
    });
    const copied = await copyText(appUrl(`/shared?d=${code}`));
    const note = skipped > 0 ? ` Pominięto utwory spoza katalogu SONORA: ${skipped}.` : '';
    showToast(
      copied
        ? {
            tone: 'success',
            message: `Skopiowano link do playlisty. Każdy, kto go otworzy, zobaczy jej utwory.${note}`,
          }
        : {
            tone: 'error',
            message: 'Nie udało się skopiować linku. Przeglądarka zablokowała dostęp do schowka.',
          },
    );
  };

  const menu: MenuItem[] = [
    {
      id: 'edit',
      label: 'Edytuj nazwę i opis',
      icon: Pencil,
      onSelect: () => dialogs.openEditPlaylist(playlist),
    },
    { id: 'share', label: 'Kopiuj link do udostępnienia', icon: Share2, onSelect: () => void share() },
    {
      id: 'queue',
      label: 'Dodaj do kolejki',
      icon: ListEnd,
      disabled: tracks.length === 0,
      onSelect: () => actions.addToQueue(tracks),
    },
    {
      id: 'delete',
      label: 'Usuń playlistę',
      icon: Trash2,
      tone: 'danger',
      separatorBefore: true,
      onSelect: () => void deletePlaylist(),
    },
  ];

  const present = new Set(playlist.items.map((item) => item.trackId));
  const suggestions = recommendTracks({
    seedTrack: tracks[0] ?? null,
    excludeIds: present,
    limit: 5,
    random: () => 0.5,
  });

  return (
    <>
      <CollectionHeader
        kind="Twoja playlista"
        title={playlist.title}
        description={playlist.description || undefined}
        accentColor="#3f3478"
        cover={<PlaylistCover playlist={playlist} size={480} />}
        meta={<span>{collectionSummary(tracks)}</span>}
        actions={
          <PlaybackActions playback={playback} title={playlist.title} disabled={tracks.length === 0}>
            <IconButton
              icon={Pencil}
              label="Edytuj playlistę"
              size="lg"
              onClick={() => dialogs.openEditPlaylist(playlist)}
            />
            <MenuButton
              items={menu}
              label={`Więcej opcji: ${playlist.title}`}
              tooltip="Więcej opcji"
              size="lg"
            />
          </PlaybackActions>
        }
      />
      <PageBody>
        {tracks.length === 0 ? (
          <EmptyState
            icon={ListMusic}
            title="Ta playlista jest jeszcze pusta"
            description="Dodaj pierwszy utwór poniżej albo wybierz „Dodaj do playlisty…” w menu dowolnego utworu."
            actions={
              <Link to="/search" className={buttonClassName({ variant: 'secondary' })}>
                <Search size={18} aria-hidden />
                Szukaj utworów
              </Link>
            }
          />
        ) : (
          <TrackList
            label={`Utwory na playliście ${playlist.title}`}
            tracks={tracks}
            showAlbum
            addedAt={addedAt}
            onRemove={removeTrack}
            onPlayTrack={playback.playAt}
            isActiveContext={playback.isActive}
            onTogglePlay={playback.togglePlay}
          />
        )}

        {suggestions.length > 0 ? (
          <section className={styles.suggestions} aria-labelledby="suggestions-title">
            <h2 id="suggestions-title" className={styles.title}>
              Proponowane utwory
            </h2>
            <p className={styles.subtitle}>Na podstawie utworów z tej playlisty.</p>
            <ul className={styles.suggestionList}>
              {suggestions.map((track) => (
                <li key={track.id} className={styles.suggestion}>
                  <CoverImage src={track.coverUrl} alt="" size={96} className={styles.cover} />
                  <span className={styles.text}>
                    <span className={styles.trackTitle}>{track.title}</span>
                    <span className={styles.artist}>{track.artistName}</span>
                  </span>
                  <button
                    type="button"
                    className={buttonClassName({ variant: 'secondary', size: 'sm' })}
                    onClick={() => {
                      library.addToPlaylist(playlist.id, [track]);
                      showToast({ tone: 'success', message: `Dodano „${track.title}” do playlisty.` });
                    }}
                  >
                    <Plus size={16} aria-hidden />
                    Dodaj
                    <span className="visually-hidden">: {track.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </PageBody>
    </>
  );
}

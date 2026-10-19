import { Link2Off, Save } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { CollectionHeader } from '../../components/music/CollectionHeader';
import { TrackList } from '../../components/music/TrackList';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useLibrary } from '../../context/LibraryContext';
import { useToast } from '../../context/ToastContext';
import { getTracksByIds } from '../../data/catalog';
import { useCollectionPlayback } from '../../hooks/useCollectionPlayback';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { CoverImage } from '../../components/music/CoverImage';
import { collectionSummary } from '../shared/collectionSummary';
import { PageBody } from '../shared/Page';
import { PlaybackActions } from '../shared/PlaybackActions';
import { decodeSharedPlaylist } from './playlistShare';

/** Podgląd playlisty z linku udostępniania i zapis jej kopii we własnej bibliotece. */
export default function SharedPlaylistPage() {
  const [params] = useSearchParams();
  const code = params.get('d');
  const data = decodeSharedPlaylist(code);
  const tracks = data ? getTracksByIds(data.trackIds) : [];
  const library = useLibrary();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const playback = useCollectionPlayback(
    {
      type: 'playlist',
      id: `shared-${code ?? ''}`,
      title: data?.title ?? 'Udostępniona playlista',
      path: null,
    },
    tracks,
  );
  useDocumentTitle(data ? data.title : 'Nieprawidłowy link');

  if (!data) {
    return (
      <EmptyState
        icon={Link2Off}
        tone="error"
        title="Ten link do playlisty jest nieprawidłowy"
        description="Link mógł zostać skrócony lub uszkodzony podczas kopiowania. Poproś o przesłanie go jeszcze raz."
      />
    );
  }

  const save = () => {
    const id = library.createPlaylist({ title: data.title, description: data.description }, tracks);
    if (!id) return;
    showToast({ tone: 'success', message: `Zapisano playlistę „${data.title}” w Twojej bibliotece.` });
    navigate(`/playlist/${id}`);
  };

  return (
    <>
      <CollectionHeader
        kind="Udostępniona playlista"
        title={data.title}
        description={data.description || undefined}
        accentColor="#2d5f73"
        cover={
          <CoverImage
            src={tracks[0]?.coverUrl ?? null}
            alt={`Okładka playlisty ${data.title}`}
            size={480}
            eager
          />
        }
        meta={<span>{collectionSummary(tracks)}</span>}
        actions={
          <PlaybackActions playback={playback} title={data.title} disabled={tracks.length === 0}>
            <Button variant="secondary" icon={Save} onClick={save}>
              Zapisz w bibliotece
            </Button>
          </PlaybackActions>
        }
      />
      <PageBody>
        <TrackList
          label={`Utwory na playliście ${data.title}`}
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

import { Music } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useParams } from 'react-router';
import { AlbumCard } from '../../components/music/AlbumCard';
import { CollectionHeader } from '../../components/music/CollectionHeader';
import { FeaturedPlaylistCard } from '../../components/music/PlaylistCard';
import { Shelf } from '../../components/music/Shelf';
import { TrackList } from '../../components/music/TrackList';
import { getGenre, getGenreAlbums, getGenreTracks, getPlaylistsWithGenre } from '../../data/catalog';
import { useCollectionPlayback } from '../../hooks/useCollectionPlayback';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { NotFoundContent } from '../errors/NotFoundContent';
import { collectionSummary } from '../shared/collectionSummary';
import { PageBody } from '../shared/Page';
import { PlaybackActions } from '../shared/PlaybackActions';
import styles from './GenrePage.module.css';

export default function GenrePage() {
  const { id = '' } = useParams();
  const genre = getGenre(id);
  useDocumentTitle(genre?.name ?? 'Nie znaleziono gatunku');
  const tracks = genre ? getGenreTracks(genre.id) : [];
  const playback = useCollectionPlayback(
    { type: 'genre', id, title: genre?.name ?? '', path: `/genre/${id}` },
    tracks,
  );

  if (!genre) {
    return (
      <NotFoundContent
        title="Nie znaleziono gatunku"
        description="Taki gatunek nie istnieje w katalogu demonstracyjnym."
      />
    );
  }
  const albums = getGenreAlbums(genre.id);
  const playlists = getPlaylistsWithGenre(genre.id);

  return (
    <>
      <CollectionHeader
        kind="Gatunek"
        title={genre.name}
        description={genre.description}
        accentColor={genre.color}
        cover={
          <span className={styles.cover} style={{ '--tile': genre.color } as CSSProperties} aria-hidden>
            <Music size={56} />
          </span>
        }
        meta={<span>{collectionSummary(tracks)}</span>}
        actions={<PlaybackActions playback={playback} title={genre.name} disabled={tracks.length === 0} />}
      />
      <PageBody>
        <TrackList
          label={`Utwory z gatunku ${genre.name}`}
          tracks={tracks}
          showAlbum
          onPlayTrack={playback.playAt}
          isActiveContext={playback.isActive}
          onTogglePlay={playback.togglePlay}
        />
        {albums.length > 0 ? (
          <Shelf title="Wydania" layout="grid">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </Shelf>
        ) : null}
        {playlists.length > 0 ? (
          <Shelf title="Playlisty z tym gatunkiem">
            {playlists.map((playlist) => (
              <FeaturedPlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </Shelf>
        ) : null}
      </PageBody>
    </>
  );
}

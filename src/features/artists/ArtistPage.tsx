import { ExternalLink, Info } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { AlbumCard } from '../../components/music/AlbumCard';
import { ArtistCard } from '../../components/music/ArtistCard';
import { CollectionHeader } from '../../components/music/CollectionHeader';
import { CoverImage } from '../../components/music/CoverImage';
import { Shelf } from '../../components/music/Shelf';
import { TrackList } from '../../components/music/TrackList';
import { Button } from '../../components/ui/Button';
import { ARTISTS, getArtist, getArtistAlbums, getArtistTracks, getGenre } from '../../data/catalog';
import { useCollectionPlayback } from '../../hooks/useCollectionPlayback';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { NotFoundContent } from '../errors/NotFoundContent';
import { PageBody } from '../shared/Page';
import { PlaybackActions } from '../shared/PlaybackActions';
import styles from './ArtistPage.module.css';

const COLLAPSED_COUNT = 5;

export default function ArtistPage() {
  const { id = '' } = useParams();
  const artist = getArtist(id);
  useDocumentTitle(artist?.name ?? 'Nie znaleziono wykonawcy');
  const tracks = artist ? getArtistTracks(artist.id) : [];
  const [expanded, setExpanded] = useState(false);
  const playback = useCollectionPlayback(
    { type: 'artist', id, title: artist?.name ?? '', path: `/artist/${id}` },
    tracks,
  );

  if (!artist) {
    return (
      <NotFoundContent
        title="Nie znaleziono wykonawcy"
        description="Ten wykonawca nie istnieje w katalogu demonstracyjnym."
      />
    );
  }
  const albums = getArtistAlbums(artist.id);
  const similar = ARTISTS.filter(
    (other) => other.id !== artist.id && other.genreIds.some((genre) => artist.genreIds.includes(genre)),
  );
  const others = similar.length > 0 ? similar : ARTISTS.filter((other) => other.id !== artist.id);
  const visible = expanded ? tracks : tracks.slice(0, COLLAPSED_COUNT);

  return (
    <>
      <CollectionHeader
        kind={artist.isFictional ? 'Wykonawca (projekt demonstracyjny)' : 'Wykonawca'}
        title={artist.name}
        accentColor={artist.accentColor}
        coverShape="circle"
        cover={
          <CoverImage
            src={artist.imageUrl}
            alt={`Grafika wykonawcy ${artist.name}`}
            size={480}
            shape="circle"
            eager
          />
        }
        meta={
          <>
            {artist.genreIds.map((genreId, index) => (
              <span key={genreId} className={styles.genre}>
                {index > 0 ? <span aria-hidden>·</span> : null}
                <Link to={`/genre/${genreId}`}>{getGenre(genreId)?.name}</Link>
              </span>
            ))}
          </>
        }
        actions={<PlaybackActions playback={playback} title={artist.name} />}
      />
      <PageBody>
        <section className={styles.section} aria-labelledby="artist-popular">
          <h2 id="artist-popular" className={styles.title}>
            Popularne utwory
          </h2>
          <TrackList
            label={`Popularne utwory: ${artist.name}`}
            tracks={visible}
            showAlbum
            showHeader={false}
            onPlayTrack={playback.playAt}
            isActiveContext={playback.isActive}
            onTogglePlay={playback.togglePlay}
          />
          {tracks.length > COLLAPSED_COUNT ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((value) => !value)}
              className={styles.toggle}
            >
              {expanded ? 'Pokaż mniej' : `Pokaż wszystkie (${tracks.length})`}
            </Button>
          ) : null}
        </section>

        <Shelf title="Wydania" layout="grid">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} showArtist={false} />
          ))}
        </Shelf>

        <section className={styles.about} aria-labelledby="artist-about">
          <h2 id="artist-about" className={styles.title}>
            O wykonawcy
          </h2>
          <p>{artist.bio}</p>
          {artist.isFictional ? (
            <p className={styles.note}>
              <Info size={16} aria-hidden />
              To fikcyjny projekt stworzony na potrzeby wersji demonstracyjnej. Jego utwory zostały
              wygenerowane algorytmicznie.
            </p>
          ) : null}
          {artist.website ? (
            <a href={artist.website} target="_blank" rel="noreferrer" className={styles.website}>
              Strona wykonawcy <ExternalLink size={14} aria-hidden />
            </a>
          ) : null}
        </section>

        <Shelf title={similar.length > 0 ? 'Podobni wykonawcy' : 'Inni wykonawcy'}>
          {others.map((other) => (
            <ArtistCard key={other.id} artist={other} />
          ))}
        </Shelf>
      </PageBody>
    </>
  );
}

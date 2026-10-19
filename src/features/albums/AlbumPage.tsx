import { ExternalLink, Link2, ListEnd, ListPlus } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { AlbumCard } from '../../components/music/AlbumCard';
import { CollectionHeader } from '../../components/music/CollectionHeader';
import { CoverImage } from '../../components/music/CoverImage';
import { Shelf } from '../../components/music/Shelf';
import { TrackList } from '../../components/music/TrackList';
import type { MenuItem } from '../../components/ui/Menu';
import { MenuButton } from '../../components/ui/MenuButton';
import { albumTypeLabel, getAlbum, getAlbumTracks, getArtist, getArtistAlbums } from '../../data/catalog';
import { useCollectionPlayback } from '../../hooks/useCollectionPlayback';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useTrackActions } from '../../hooks/useTrackActions';
import { formatYear } from '../../utils/formatDate';
import { NotFoundContent } from '../errors/NotFoundContent';
import { collectionSummary } from '../shared/collectionSummary';
import { PageBody } from '../shared/Page';
import { PlaybackActions } from '../shared/PlaybackActions';
import styles from './AlbumPage.module.css';

export default function AlbumPage() {
  const { id = '' } = useParams();
  const album = getAlbum(id);
  useDocumentTitle(album?.title ?? 'Nie znaleziono albumu');
  const tracks = album ? getAlbumTracks(album.id) : [];
  const actions = useTrackActions();
  const playback = useCollectionPlayback(
    { type: 'album', id, title: album?.title ?? '', path: `/album/${id}` },
    tracks,
  );

  if (!album) {
    return (
      <NotFoundContent
        title="Nie znaleziono albumu"
        description="Ten album nie istnieje w katalogu demonstracyjnym."
      />
    );
  }
  const artist = getArtist(album.artistId);
  const year = formatYear(album.releaseDate);
  const license = tracks[0]?.license;
  const moreFromArtist = getArtistAlbums(album.artistId).filter((item) => item.id !== album.id);

  const menu: MenuItem[] = [
    { id: 'queue', label: 'Dodaj do kolejki', icon: ListEnd, onSelect: () => actions.addToQueue(tracks) },
    {
      id: 'playlist',
      label: 'Dodaj do playlisty…',
      icon: ListPlus,
      onSelect: () => actions.addToPlaylist(tracks),
    },
    {
      id: 'link',
      label: 'Kopiuj link do albumu',
      icon: Link2,
      separatorBefore: true,
      onSelect: () => void actions.copyLink(`/album/${album.id}`, 'link do albumu'),
    },
  ];

  return (
    <>
      <CollectionHeader
        kind={albumTypeLabel(album.type)}
        title={album.title}
        accentColor={album.accentColor}
        cover={<CoverImage src={album.coverUrl} alt={`Okładka: ${album.title}`} size={480} eager />}
        meta={
          <>
            {artist ? (
              <Link to={`/artist/${artist.id}`} className={styles.artist}>
                <CoverImage
                  src={artist.imageUrl}
                  alt=""
                  size={48}
                  shape="circle"
                  className={styles.artistImage}
                />
                {artist.name}
              </Link>
            ) : null}
            {year ? (
              <>
                <span aria-hidden>·</span>
                <span>{year}</span>
              </>
            ) : null}
            <span aria-hidden>·</span>
            <span>{collectionSummary(tracks)}</span>
          </>
        }
        actions={
          <PlaybackActions playback={playback} title={album.title}>
            <MenuButton
              items={menu}
              label={`Więcej opcji: ${album.title}`}
              tooltip="Więcej opcji"
              size="lg"
            />
          </PlaybackActions>
        }
      />
      <PageBody>
        <TrackList
          label={`Utwory na albumie ${album.title}`}
          tracks={tracks}
          showCover={false}
          numbering="trackNumber"
          onPlayTrack={playback.playAt}
          isActiveContext={playback.isActive}
          onTogglePlay={playback.togglePlay}
        />

        <div className={styles.about}>
          <p>{album.description}</p>
          {license ? (
            <p className={styles.license}>
              Licencja:{' '}
              {license.url ? (
                <a href={license.url} target="_blank" rel="noreferrer">
                  {license.name}
                </a>
              ) : (
                license.name
              )}
              . Autor: {license.author}.
              {license.sourceUrl ? (
                <>
                  {' '}
                  <a href={license.sourceUrl} target="_blank" rel="noreferrer" className={styles.source}>
                    Źródło <ExternalLink size={12} aria-hidden />
                  </a>
                </>
              ) : null}
            </p>
          ) : null}
        </div>

        {moreFromArtist.length > 0 && artist ? (
          <Shelf title={`Więcej: ${artist.name}`} to={`/artist/${artist.id}`}>
            {moreFromArtist.map((item) => (
              <AlbumCard key={item.id} album={item} showArtist={false} />
            ))}
          </Shelf>
        ) : null}
      </PageBody>
    </>
  );
}

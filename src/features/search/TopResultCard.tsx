import { Link } from 'react-router';
import { CoverImage } from '../../components/music/CoverImage';
import { PlayButton } from '../../components/music/PlayButton';
import {
  albumTypeLabel,
  getAlbumTracks,
  getArtist,
  getArtistTracks,
  getFeaturedPlaylist,
  getGenre,
  getGenreTracks,
  getTracksByIds,
} from '../../data/catalog';
import { useCollectionPlayback } from '../../hooks/useCollectionPlayback';
import { useLibrary } from '../../context/LibraryContext';
import type { Track } from '../../types/music';
import type { PlaybackContext } from '../../types/player';
import type { TopResult } from './searchEngine';
import { Highlight } from './Highlight';
import styles from './TopResultCard.module.css';

interface Described {
  to: string;
  title: string;
  kind: string;
  subtitle: string;
  image: string | null;
  round: boolean;
  context: PlaybackContext;
  tracks: Track[];
}

/** Opisuje najlepszy wynik niezależnie od jego rodzaju (utwór, wykonawca, album...). */
function useDescribe(result: TopResult): Described {
  const { getPlaylist, resolveTracks } = useLibrary();
  switch (result.kind) {
    case 'track': {
      const track = result.item;
      return {
        to: track.albumId ? `/album/${track.albumId}` : '/search',
        title: track.title,
        kind: 'Utwór',
        subtitle: track.artistName,
        image: track.coverUrl,
        round: false,
        context: { type: 'search', id: `top-${track.id}`, title: track.title, path: null },
        tracks: [track],
      };
    }
    case 'artist':
      return {
        to: `/artist/${result.item.id}`,
        title: result.item.name,
        kind: 'Wykonawca',
        subtitle: result.item.genreIds.map((id) => getGenre(id)?.name).join(', '),
        image: result.item.imageUrl,
        round: true,
        context: {
          type: 'artist',
          id: result.item.id,
          title: result.item.name,
          path: `/artist/${result.item.id}`,
        },
        tracks: getArtistTracks(result.item.id),
      };
    case 'album':
      return {
        to: `/album/${result.item.id}`,
        title: result.item.title,
        kind: albumTypeLabel(result.item.type),
        subtitle: getArtist(result.item.artistId)?.name ?? '',
        image: result.item.coverUrl,
        round: false,
        context: {
          type: 'album',
          id: result.item.id,
          title: result.item.title,
          path: `/album/${result.item.id}`,
        },
        tracks: getAlbumTracks(result.item.id),
      };
    case 'playlist': {
      const user = result.item.isUser ? getPlaylist(result.item.id) : undefined;
      const featured = result.item.isUser ? undefined : getFeaturedPlaylist(result.item.id);
      return {
        to: `/playlist/${result.item.id}`,
        title: result.item.title,
        kind: 'Playlista',
        subtitle: result.item.isUser ? 'Twoja playlista' : 'SONORA',
        image: result.item.coverUrl,
        round: false,
        context: {
          type: 'playlist',
          id: result.item.id,
          title: result.item.title,
          path: `/playlist/${result.item.id}`,
        },
        tracks: user
          ? resolveTracks(user.items.map((item) => item.trackId))
          : featured
            ? getTracksByIds(featured.trackIds)
            : [],
      };
    }
    case 'genre':
      return {
        to: `/genre/${result.item.id}`,
        title: result.item.name,
        kind: 'Gatunek',
        subtitle: result.item.description,
        image: null,
        round: false,
        context: {
          type: 'genre',
          id: result.item.id,
          title: result.item.name,
          path: `/genre/${result.item.id}`,
        },
        tracks: getGenreTracks(result.item.id),
      };
  }
}

export function TopResultCard({ result, query }: { result: TopResult; query: string }) {
  const info = useDescribe(result);
  const playback = useCollectionPlayback(info.context, info.tracks);
  return (
    <article className={styles.card}>
      <CoverImage
        src={info.image}
        alt=""
        size={200}
        shape={info.round ? 'circle' : 'square'}
        className={styles.image}
      />
      <h3 className={styles.title}>
        <Link to={info.to} className={styles.link}>
          <Highlight text={info.title} query={query} />
        </Link>
      </h3>
      <p className={styles.meta}>
        <span className={styles.kind}>{info.kind}</span>
        <span className={styles.subtitle}>{info.subtitle}</span>
      </p>
      {info.tracks.length > 0 ? (
        <PlayButton
          playing={playback.isPlaying}
          label={playback.isPlaying ? `Wstrzymaj: ${info.title}` : `Odtwórz: ${info.title}`}
          className={styles.play}
          onClick={playback.toggle}
        />
      ) : null}
    </article>
  );
}

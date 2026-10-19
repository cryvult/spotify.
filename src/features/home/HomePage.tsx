import { Play } from 'lucide-react';
import { AlbumCard } from '../../components/music/AlbumCard';
import { ArtistCard } from '../../components/music/ArtistCard';
import { CoverImage } from '../../components/music/CoverImage';
import { GenreTile } from '../../components/music/GenreTile';
import { FeaturedPlaylistCard } from '../../components/music/PlaylistCard';
import { PlaylistCover } from '../../components/music/PlaylistCover';
import { Shelf } from '../../components/music/Shelf';
import { TrackCard } from '../../components/music/TrackCard';
import { Button } from '../../components/ui/Button';
import { useLibrary } from '../../context/LibraryContext';
import { isPlayingFrom, usePlayerControls, usePlayerState } from '../../context/PlayerContext';
import { useSettings } from '../../context/SettingsContext';
import {
  ALBUMS,
  FEATURED_PLAYLISTS,
  GENRES,
  getAlbum,
  getFeaturedPlaylist,
  getGenreCover,
  getNewReleases,
  getPlaylistsByCategory,
  getPopularArtists,
  getPopularTracks,
  getTracksByIds,
  TRACKS,
} from '../../data/catalog';
import type { Album, FeaturedPlaylist, Track } from '../../types/music';
import type { PlaybackContext } from '../../types/player';
import { daysAgoIsoDate, getGreeting, playlistForTimeOfDay } from '../../utils/greeting';
import { Page } from '../shared/Page';
import { ActivityBanners } from './ActivityBanners';
import { DiscoverySpotlight } from './DiscoverySpotlight';
import { PopularTracks } from './PopularTracks';
import { QuickAccess, type QuickItem } from './QuickAccess';
import { LikedCover } from '../../components/music/LikedCover';
import styles from './HomePage.module.css';

const RECENT_CONTEXT: PlaybackContext = {
  type: 'recent',
  id: 'recent',
  title: 'Ostatnio odtwarzane',
  path: '/recent',
};
/** Wydania z ostatnich 12 miesięcy trafiają do „Nowych wydań”. */
const NEW_RELEASE_DAYS = 365;

/** Playlisty i albumy pasujące do ulubionych gatunków użytkownika trafiają na początek. */
function byFavoriteGenres<T>(items: T[], favorites: string[], genresOf: (item: T) => string[]): T[] {
  if (favorites.length === 0) return items;
  const score = (item: T) => genresOf(item).filter((genre) => favorites.includes(genre)).length;
  return [...items].sort((a, b) => score(b) - score(a));
}

const playlistGenres = (playlist: FeaturedPlaylist) =>
  getTracksByIds(playlist.trackIds).flatMap((track) => track.genreIds);

export default function HomePage() {
  const { settings } = useSettings();
  const library = useLibrary();
  const { state, isPlaying } = usePlayerState();
  const controls = usePlayerControls();
  const name = settings.userName.trim();
  const favorites = settings.favoriteGenres;

  const recentTracks = library.resolveTracks(library.recent.map((entry) => entry.trackId)).slice(0, 12);
  const likedTracks = library.resolveTracks(library.liked.map((entry) => entry.trackId));

  const playContext = (context: PlaybackContext, tracks: Track[]) => {
    if (isPlayingFrom(state, context.type, context.id)) controls.togglePlay();
    else controls.playTracks(tracks, { context });
  };
  const contextPlaying = (type: PlaybackContext['type'], id: string) =>
    isPlayingFrom(state, type, id) && isPlaying;

  // Szybki dostęp: ulubione, własne playlisty, a potem playlisty pasujące do pory dnia.
  const timePick = playlistForTimeOfDay();
  const quickItems: QuickItem[] = [
    {
      key: 'liked',
      to: '/liked',
      title: 'Ulubione utwory',
      image: <LikedCover />,
      isPlaying: contextPlaying('liked', 'liked'),
      onPlay: () =>
        playContext(
          { type: 'liked', id: 'liked', title: 'Ulubione utwory', path: '/liked' },
          likedTracks.length ? likedTracks : getPopularTracks(8),
        ),
    },
    ...library.playlists
      .filter((playlist) => playlist.items.length > 0)
      .slice(0, 2)
      .map((playlist) => ({
        key: playlist.id,
        to: `/playlist/${playlist.id}`,
        title: playlist.title,
        image: <PlaylistCover playlist={playlist} size={112} />,
        isPlaying: contextPlaying('playlist', playlist.id),
        onPlay: () =>
          playContext(
            { type: 'playlist', id: playlist.id, title: playlist.title, path: `/playlist/${playlist.id}` },
            library.resolveTracks(playlist.items.map((item) => item.trackId)),
          ),
      })),
    ...[timePick, 'top-sonora', 'odkrycia-tygodnia', 'nauka', 'energia']
      .map((id) => getFeaturedPlaylist(id))
      .filter((playlist): playlist is FeaturedPlaylist => playlist !== undefined)
      .map((playlist) => ({
        key: playlist.id,
        to: `/playlist/${playlist.id}`,
        title: playlist.title,
        image: <CoverImage src={playlist.coverUrl} alt="" size={112} />,
        isPlaying: contextPlaying('playlist', playlist.id),
        onPlay: () =>
          playContext(
            { type: 'playlist', id: playlist.id, title: playlist.title, path: `/playlist/${playlist.id}` },
            getTracksByIds(playlist.trackIds),
          ),
      })),
  ].slice(0, 6);

  const editorial = byFavoriteGenres(getPlaylistsByCategory('editorial'), favorites, playlistGenres);
  const recommendedAlbums = byFavoriteGenres<Album>(
    [...ALBUMS].sort((a, b) => b.id.localeCompare(a.id)),
    favorites,
    (album) => [album.genreId],
  );
  const cutoff = daysAgoIsoDate(NEW_RELEASE_DAYS);
  const newReleases = getNewReleases().filter(
    (album) => album.releaseDate !== null && album.releaseDate >= cutoff,
  );
  const genreCovers = GENRES.map((genre) => ({ genre, cover: getGenreCover(genre.id) }));

  return (
    <Page title="Strona główna" hideTitle>
      <section className={styles.welcome} aria-labelledby="greeting">
        <h2 id="greeting" className={styles.greeting}>
          {getGreeting()}
          {name ? `, ${name}` : ''}
        </h2>
        <QuickAccess items={quickItems} />
      </section>

      <Shelf
        title="Polecane playlisty"
        to="/playlists"
        description={favorites.length ? 'Dobrane do gatunków, które lubisz.' : undefined}
      >
        {editorial.map((playlist) => (
          <FeaturedPlaylistCard key={playlist.id} playlist={playlist} />
        ))}
      </Shelf>

      {recentTracks.length > 0 ? (
        <Shelf title="Ostatnio odtwarzane" to="/recent">
          {recentTracks.map((track, index) => (
            <TrackCard
              key={track.id}
              track={track}
              tracks={recentTracks}
              index={index}
              context={RECENT_CONTEXT}
            />
          ))}
        </Shelf>
      ) : (
        <section className={styles.emptyRecent} aria-labelledby="recent-empty">
          <div>
            <h2 id="recent-empty" className={styles.sectionTitle}>
              Ostatnio odtwarzane
            </h2>
            <p className={styles.muted}>
              Tu pojawią się utwory, których słuchasz. Zacznij od najpopularniejszych.
            </p>
          </div>
          <Button
            variant="primary"
            icon={Play}
            onClick={() => {
              const top = getFeaturedPlaylist('top-sonora');
              if (top)
                controls.playTracks(getTracksByIds(top.trackIds), {
                  context: { type: 'playlist', id: top.id, title: top.title, path: `/playlist/${top.id}` },
                });
            }}
          >
            Odtwórz Top SONORA
          </Button>
        </section>
      )}

      <section className={styles.section} aria-labelledby="popular-title">
        <h2 id="popular-title" className={styles.sectionTitle}>
          Popularne teraz
        </h2>
        <PopularTracks tracks={getPopularTracks(8)} />
      </section>

      {newReleases.length > 0 ? (
        <Shelf title="Nowe wydania" to="/albums">
          {newReleases.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </Shelf>
      ) : null}

      <section className={styles.section} aria-labelledby="genres-title">
        <h2 id="genres-title" className={styles.sectionTitle}>
          Gatunki muzyczne
        </h2>
        <div className={styles.genres}>
          {byFavoriteGenres(genreCovers, favorites, (entry) => [entry.genre.id]).map(({ genre, cover }) => (
            <GenreTile key={genre.id} genre={genre} coverUrl={cover} />
          ))}
        </div>
      </section>

      <Shelf title="Polecane albumy" to="/albums">
        {recommendedAlbums.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </Shelf>

      <section className={styles.section} aria-labelledby="activity-title">
        <h2 id="activity-title" className={styles.sectionTitle}>
          Do nauki, pracy, treningu i relaksu
        </h2>
        <ActivityBanners playlists={getPlaylistsByCategory('activity')} />
      </section>

      <Shelf title="Na każdy nastrój" to="/playlists">
        {getPlaylistsByCategory('mood').map((playlist) => (
          <FeaturedPlaylistCard key={playlist.id} playlist={playlist} />
        ))}
      </Shelf>

      <Shelf title="Popularni wykonawcy" to="/artists">
        {getPopularArtists().map((artist) => (
          <ArtistCard key={artist.id} artist={artist} />
        ))}
      </Shelf>

      <DiscoverySpotlight />

      <p className={styles.footnote}>
        Katalog demonstracyjny: {TRACKS.length} utworów, {ALBUMS.length} wydań, {FEATURED_PLAYLISTS.length}{' '}
        playlist.{' '}
        {getAlbum('calming') ? 'Utwory Kevina MacLeoda pochodzą z Wikimedia Commons (CC BY 3.0).' : ''}
      </p>
    </Page>
  );
}

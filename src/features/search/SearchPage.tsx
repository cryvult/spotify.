import { CloudOff, Globe, History, SearchX, X } from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AlbumCard } from '../../components/music/AlbumCard';
import { ArtistCard } from '../../components/music/ArtistCard';
import { GenreTile } from '../../components/music/GenreTile';
import { FeaturedPlaylistCard, UserPlaylistCard } from '../../components/music/PlaylistCard';
import { CardGrid, Shelf } from '../../components/music/Shelf';
import { TrackList } from '../../components/music/TrackList';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterChips, type ChipOption } from '../../components/ui/FilterChips';
import { TrackListSkeleton } from '../../components/ui/Skeleton';
import { useLibrary } from '../../context/LibraryContext';
import { isPlayingFrom, usePlayerControls, usePlayerState } from '../../context/PlayerContext';
import { useSettings } from '../../context/SettingsContext';
import { GENRES, getFeaturedPlaylist, getGenreCover } from '../../data/catalog';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { OPENVERSE_AVAILABLE } from '../../services/openverseService';
import type { Track } from '../../types/music';
import type { PlaybackContext } from '../../types/player';
import { Page } from '../shared/Page';
import { Highlight } from './Highlight';
import { SearchField } from './SearchField';
import { searchCatalog, type PlaylistSummary, type SearchKind } from './searchEngine';
import { TopResultCard } from './TopResultCard';
import { useOpenverseSearch } from './useOpenverseSearch';
import styles from './SearchPage.module.css';

type Filter = 'all' | SearchKind | 'openverse';
const FILTERS: Filter[] = ['all', 'tracks', 'artists', 'albums', 'playlists', 'genres', 'openverse'];
const OPENVERSE_DEBOUNCE_MS = 500;

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  // Tekst pola trzymamy w stanie komponentu (natychmiastowa reakcja na klawisze),
  // a do adresu strony zapisujemy go z opóźnieniem, aby można było wrócić do wyników.
  const [query, setQuery] = useState(() => params.get('q') ?? '');
  const rawFilter = params.get('type') as Filter | null;
  const filter: Filter = rawFilter && FILTERS.includes(rawFilter) ? rawFilter : 'all';
  const inputRef = useRef<HTMLInputElement>(null);
  const library = useLibrary();
  const { settings } = useSettings();

  // Wyszukiwanie lokalne jest natychmiastowe; useDeferredValue utrzymuje płynność pisania.
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(
    () => searchCatalog(deferredQuery, library.playlists),
    [deferredQuery, library.playlists],
  );

  // Zewnętrzne API pytamy dopiero, gdy użytkownik przestanie pisać (debounce).
  const openverseAllowed = OPENVERSE_AVAILABLE && settings.openverseEnabled;
  const debouncedQuery = useDebouncedValue(query, OPENVERSE_DEBOUNCE_MS);
  const openverse = useOpenverseSearch(debouncedQuery, openverseAllowed && filter === 'openverse');

  useEffect(() => {
    // Na komputerach od razu ustawiamy kursor w polu; na telefonach nie wysuwamy klawiatury.
    if (window.matchMedia('(hover: hover)').matches) inputRef.current?.focus();
  }, []);

  const update = (changes: Record<string, string | null>) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
        return next;
      },
      { replace: true },
    );

  const urlQuery = useDebouncedValue(query, 300);
  useEffect(() => {
    setParams(
      (previous) => {
        if ((previous.get('q') ?? '') === urlQuery) return previous;
        const next = new URLSearchParams(previous);
        if (urlQuery) next.set('q', urlQuery);
        else next.delete('q');
        return next;
      },
      { replace: true },
    );
  }, [urlQuery, setParams]);

  const remember = () => {
    if (query.trim().length >= 2) library.addRecentSearch(query.trim());
  };

  const hasQuery = query.trim().length > 0;
  const chips: ChipOption<Filter>[] = [
    { value: 'all', label: 'Wszystko' },
    { value: 'tracks', label: 'Utwory', count: results.tracks.length },
    { value: 'artists', label: 'Wykonawcy', count: results.artists.length },
    { value: 'albums', label: 'Albumy', count: results.albums.length },
    { value: 'playlists', label: 'Playlisty', count: results.playlists.length },
    { value: 'genres', label: 'Gatunki', count: results.genres.length },
    ...(OPENVERSE_AVAILABLE ? [{ value: 'openverse' as const, label: 'Otwarte zasoby (Openverse)' }] : []),
  ];

  return (
    <Page title="Szukaj" hideTitle>
      <div className={styles.top}>
        <h1 className={styles.heading}>Szukaj</h1>
        <SearchField ref={inputRef} value={query} onChange={setQuery} onSubmit={remember} />
        {hasQuery ? (
          <FilterChips
            label="Rodzaj wyników"
            options={chips}
            value={filter}
            onChange={(value) => update({ type: value === 'all' ? null : value })}
          />
        ) : null}
      </div>

      {/* Kliknięcie dowolnego wyniku zapisuje zapytanie w „Ostatnich wyszukiwaniach”. */}
      <div
        className={styles.results}
        onClickCapture={(event) => (event.target as HTMLElement).closest('a, button') && remember()}
      >
        {!hasQuery ? (
          <BrowseView onPick={setQuery} />
        ) : filter === 'openverse' ? (
          <OpenverseView
            query={debouncedQuery}
            allowed={openverseAllowed}
            state={openverse.state}
            onRetry={openverse.retry}
          />
        ) : results.total === 0 && deferredQuery === query ? (
          <EmptyState
            icon={SearchX}
            title={`Brak wyników dla „${query.trim()}”`}
            description="Sprawdź pisownię albo wpisz krótsze hasło, np. nazwę gatunku lub nastroju."
            actions={
              openverseAllowed ? (
                <Button variant="secondary" icon={Globe} onClick={() => update({ type: 'openverse' })}>
                  Szukaj w Openverse
                </Button>
              ) : null
            }
          />
        ) : (
          <ResultsView filter={filter} query={deferredQuery} results={results} />
        )}
      </div>
    </Page>
  );
}

// ------------------------------------------------------------------ widok bez zapytania

function BrowseView({ onPick }: { onPick: (query: string) => void }) {
  const { recentSearches, removeRecentSearch, clearRecentSearches } = useLibrary();
  return (
    <>
      {recentSearches.length > 0 ? (
        <section className={styles.section} aria-labelledby="recent-searches">
          <div className={styles.sectionHeader}>
            <h2 id="recent-searches" className={styles.sectionTitle}>
              Ostatnie wyszukiwania
            </h2>
            <Button variant="ghost" size="sm" onClick={clearRecentSearches}>
              Wyczyść
            </Button>
          </div>
          <ul className={styles.recent}>
            {recentSearches.map((item) => (
              <li key={item} className={styles.recentItem}>
                <button type="button" className={styles.recentButton} onClick={() => onPick(item)}>
                  <History size={16} aria-hidden />
                  {item}
                </button>
                <button
                  type="button"
                  className={styles.recentRemove}
                  aria-label={`Usuń „${item}” z historii wyszukiwania`}
                  onClick={() => removeRecentSearch(item)}
                >
                  <X size={14} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section className={styles.section} aria-labelledby="browse-all">
        <h2 id="browse-all" className={styles.sectionTitle}>
          Przeglądaj wszystko
        </h2>
        <div className={styles.genres}>
          {GENRES.map((genre) => (
            <GenreTile key={genre.id} genre={genre} coverUrl={getGenreCover(genre.id)} />
          ))}
        </div>
      </section>
    </>
  );
}

// ------------------------------------------------------------------ wyniki z katalogu

function useSearchPlayback(query: string, tracks: Track[]) {
  const { state } = usePlayerState();
  const controls = usePlayerControls();
  const context: PlaybackContext = {
    type: 'search',
    id: query,
    title: `Wyniki wyszukiwania „${query}”`,
    path: `/search?q=${encodeURIComponent(query)}`,
  };
  return {
    isActive: isPlayingFrom(state, 'search', query),
    playAt: (index: number) => controls.playTracks(tracks, { context, startIndex: index }),
    togglePlay: controls.togglePlay,
  };
}

function PlaylistResult({ playlist }: { playlist: PlaylistSummary }) {
  const { getPlaylist } = useLibrary();
  if (playlist.isUser) {
    const user = getPlaylist(playlist.id);
    return user ? <UserPlaylistCard playlist={user} /> : null;
  }
  const featured = getFeaturedPlaylist(playlist.id);
  return featured ? <FeaturedPlaylistCard playlist={featured} /> : null;
}

function ResultsView({
  filter,
  query,
  results,
}: {
  filter: Filter;
  query: string;
  results: ReturnType<typeof searchCatalog>;
}) {
  const trackPlayback = useSearchPlayback(query, results.tracks);
  const renderTitle = (title: string) => <Highlight text={title} query={query} />;
  const more = (type: SearchKind) => `/search?q=${encodeURIComponent(query)}&type=${type}`;

  const trackList = (tracks: Track[], showHeader: boolean) => (
    <TrackList
      label="Znalezione utwory"
      tracks={tracks}
      showAlbum
      showHeader={showHeader}
      onPlayTrack={trackPlayback.playAt}
      isActiveContext={trackPlayback.isActive}
      onTogglePlay={trackPlayback.togglePlay}
      renderTitle={renderTitle}
    />
  );

  if (filter === 'tracks') {
    return results.tracks.length ? trackList(results.tracks, true) : <NoKindResults kind="utworów" />;
  }
  if (filter === 'artists') {
    return results.artists.length ? (
      <CardGrid>
        {results.artists.map((artist) => (
          <ArtistCard key={artist.id} artist={artist} />
        ))}
      </CardGrid>
    ) : (
      <NoKindResults kind="wykonawców" />
    );
  }
  if (filter === 'albums') {
    return results.albums.length ? (
      <CardGrid>
        {results.albums.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </CardGrid>
    ) : (
      <NoKindResults kind="albumów" />
    );
  }
  if (filter === 'playlists') {
    return results.playlists.length ? (
      <CardGrid>
        {results.playlists.map((playlist) => (
          <PlaylistResult key={playlist.id} playlist={playlist} />
        ))}
      </CardGrid>
    ) : (
      <NoKindResults kind="playlist" />
    );
  }
  if (filter === 'genres') {
    return results.genres.length ? (
      <div className={styles.genres}>
        {results.genres.map((genre) => (
          <GenreTile key={genre.id} genre={genre} coverUrl={getGenreCover(genre.id)} />
        ))}
      </div>
    ) : (
      <NoKindResults kind="gatunków" />
    );
  }

  return (
    <>
      {results.top ? (
        <div className={styles.topGrid}>
          <section className={styles.section} aria-labelledby="top-result">
            <h2 id="top-result" className={styles.sectionTitle}>
              Najlepszy wynik
            </h2>
            <TopResultCard result={results.top} query={query} />
          </section>
          {results.tracks.length > 0 ? (
            <section className={styles.section} aria-labelledby="top-tracks">
              <div className={styles.sectionHeader}>
                <h2 id="top-tracks" className={styles.sectionTitle}>
                  Utwory
                </h2>
                {results.tracks.length > 4 ? (
                  <Link to={more('tracks')} className={styles.more}>
                    Pokaż wszystkie ({results.tracks.length})
                  </Link>
                ) : null}
              </div>
              {trackList(results.tracks.slice(0, 4), false)}
            </section>
          ) : null}
        </div>
      ) : null}
      {results.artists.length > 0 ? (
        <Shelf title="Wykonawcy" to={more('artists')}>
          {results.artists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </Shelf>
      ) : null}
      {results.albums.length > 0 ? (
        <Shelf title="Albumy" to={more('albums')}>
          {results.albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </Shelf>
      ) : null}
      {results.playlists.length > 0 ? (
        <Shelf title="Playlisty" to={more('playlists')}>
          {results.playlists.map((playlist) => (
            <PlaylistResult key={playlist.id} playlist={playlist} />
          ))}
        </Shelf>
      ) : null}
      {results.genres.length > 0 ? (
        <section className={styles.section} aria-labelledby="genre-results">
          <h2 id="genre-results" className={styles.sectionTitle}>
            Gatunki
          </h2>
          <div className={styles.genres}>
            {results.genres.map((genre) => (
              <GenreTile key={genre.id} genre={genre} coverUrl={getGenreCover(genre.id)} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function NoKindResults({ kind }: { kind: string }) {
  return (
    <EmptyState
      compact
      icon={SearchX}
      title={`Brak pasujących ${kind}`}
      description="Zmień filtr na „Wszystko”, aby zobaczyć pozostałe wyniki."
    />
  );
}

// ------------------------------------------------------------------ Openverse

interface OpenverseViewProps {
  query: string;
  allowed: boolean;
  state: ReturnType<typeof useOpenverseSearch>['state'];
  onRetry: () => void;
}

function OpenverseView({ query, allowed, state, onRetry }: OpenverseViewProps) {
  const playback = useSearchPlayback(`openverse:${query}`, state.status === 'success' ? state.tracks : []);

  if (!allowed) {
    return (
      <EmptyState
        icon={CloudOff}
        title="Wyszukiwanie w Openverse jest wyłączone"
        description="Możesz je włączyć w ustawieniach. Zapytania trafiają wtedy do zewnętrznego serwisu Openverse."
        actions={
          <Link to="/settings" className={styles.more}>
            Przejdź do ustawień
          </Link>
        }
      />
    );
  }
  if (query.trim().length < 2) {
    return (
      <EmptyState
        compact
        icon={Globe}
        title="Wpisz co najmniej 2 znaki"
        description="Szukamy wśród utworów na licencjach Creative Commons."
      />
    );
  }
  if (state.status === 'loading' || state.status === 'idle') return <TrackListSkeleton />;
  if (state.status === 'error') {
    return (
      <EmptyState
        icon={CloudOff}
        tone="error"
        title="Nie udało się połączyć z Openverse"
        description={state.message}
        actions={
          <Button variant="primary" onClick={onRetry}>
            Spróbuj ponownie
          </Button>
        }
      />
    );
  }
  if (state.tracks.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={`Openverse nie znalazł nic dla „${query}”`}
        description="Spróbuj angielskich słów, np. „piano”, „rain” albo „jazz”."
      />
    );
  }
  return (
    <section className={styles.section} aria-labelledby="openverse-results">
      <div>
        <h2 id="openverse-results" className={styles.sectionTitle}>
          Otwarte zasoby z Openverse
        </h2>
        <p className={styles.note}>
          Wyniki: {state.tracks.length} z {state.total}. Utwory pochodzą z zewnętrznych serwisów (Jamendo,
          Freesound, Wikimedia) i mają różne licencje Creative Commons; szczegóły w menu utworu („Źródło i
          licencja”). Ich dostępność nie zależy od SONORA.
        </p>
      </div>
      <TrackList
        label="Wyniki z Openverse"
        tracks={state.tracks}
        showHeader
        onPlayTrack={playback.playAt}
        isActiveContext={playback.isActive}
        onTogglePlay={playback.togglePlay}
      />
    </section>
  );
}

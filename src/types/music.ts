// Typy opisujące katalog muzyczny: utwory, albumy, wykonawców, playlisty i gatunki.

export type GenreId =
  'lofi' | 'synthwave' | 'ambient' | 'neoklasyka' | 'house' | 'chiptune' | 'downtempo' | 'folk';

/**
 * Pochodzenie pliku audio:
 * - generated: utwór wygenerowany skryptem i dołączony do aplikacji (zawsze dostępny),
 * - remote: utwór z publicznego źródła (Wikimedia Commons), wymaga internetu,
 * - openverse: wynik wyszukiwania w zewnętrznym serwisie Openverse.
 */
export type TrackSource = 'generated' | 'remote' | 'openverse';

export interface TrackLicense {
  /** Krótka nazwa licencji, np. „CC BY 3.0”. */
  name: string;
  url: string | null;
  author: string;
  /** Strona, z której pochodzi plik. */
  sourceUrl: string | null;
}

export interface Track {
  id: string;
  title: string;
  artistId: string | null;
  artistName: string;
  albumId: string | null;
  albumTitle: string | null;
  durationSec: number;
  audioUrl: string;
  coverUrl: string | null;
  genreIds: GenreId[];
  source: TrackSource;
  license: TrackLicense | null;
  trackNumber: number | null;
  /** Służy tylko do kolejności w sekcji „Popularne” (dane demonstracyjne). */
  popularity: number;
  releaseDate: string | null;
}

export type AlbumType = 'album' | 'ep' | 'single' | 'compilation';

export interface Album {
  id: string;
  title: string;
  artistId: string;
  type: AlbumType;
  /** null, gdy nie znamy daty wydania (nie wymyślamy jej). */
  releaseDate: string | null;
  genreId: GenreId;
  coverUrl: string;
  description: string;
  /** Kolor nagłówka widoku albumu. */
  accentColor: string;
}

export interface Artist {
  id: string;
  name: string;
  bio: string;
  genreIds: GenreId[];
  imageUrl: string;
  accentColor: string;
  /** Wykonawcy fikcyjni to projekty stworzone na potrzeby wersji demonstracyjnej. */
  isFictional: boolean;
  website: string | null;
}

export type PlaylistCategory = 'editorial' | 'mood' | 'activity';

export interface FeaturedPlaylist {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  trackIds: string[];
  category: PlaylistCategory;
  accentColor: string;
}

export interface UserPlaylistItem {
  trackId: string;
  addedAt: string;
}

export interface UserPlaylist {
  id: string;
  title: string;
  description: string;
  items: UserPlaylistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Genre {
  id: GenreId;
  name: string;
  description: string;
  color: string;
}

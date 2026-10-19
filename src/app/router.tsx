import { lazy } from 'react';
import { createHashRouter } from 'react-router';
import { AppLayout } from '../components/layout/AppLayout';
import { DialogProvider } from '../features/dialogs/DialogProvider';
import RouteErrorPage from '../features/errors/RouteErrorPage';

// Widoki ładowane na żądanie: każdy trafia do osobnego pliku JS (szybszy pierwszy start).
// Podczas pobierania widoku wyświetlany jest szkielet strony (Suspense w AppLayout).
const HomePage = lazy(() => import('../features/home/HomePage'));
const DiscoverPage = lazy(() => import('../features/discover/DiscoverPage'));
const SearchPage = lazy(() => import('../features/search/SearchPage'));
const LibraryPage = lazy(() => import('../features/library/LibraryPage'));
const PlaylistsPage = lazy(() => import('../features/playlists/PlaylistsPage'));
const PlaylistPage = lazy(() => import('../features/playlists/PlaylistPage'));
const SharedPlaylistPage = lazy(() => import('../features/playlists/SharedPlaylistPage'));
const LikedSongsPage = lazy(() => import('../features/liked-songs/LikedSongsPage'));
const RecentPage = lazy(() => import('../features/recent/RecentPage'));
const AlbumsPage = lazy(() => import('../features/albums/AlbumsPage'));
const AlbumPage = lazy(() => import('../features/albums/AlbumPage'));
const ArtistsPage = lazy(() => import('../features/artists/ArtistsPage'));
const ArtistPage = lazy(() => import('../features/artists/ArtistPage'));
const GenrePage = lazy(() => import('../features/genres/GenrePage'));
const SettingsPage = lazy(() => import('../features/settings/SettingsPage'));
const NotFoundPage = lazy(() => import('../features/errors/NotFoundPage'));

/** Ścieżki aplikacji. */
export const ROUTES = [
  { index: true, element: <HomePage /> },
  { path: 'discover', element: <DiscoverPage /> },
  { path: 'search', element: <SearchPage /> },
  { path: 'library', element: <LibraryPage /> },
  { path: 'playlists', element: <PlaylistsPage /> },
  { path: 'playlist/:id', element: <PlaylistPage /> },
  { path: 'shared', element: <SharedPlaylistPage /> },
  { path: 'liked', element: <LikedSongsPage /> },
  { path: 'recent', element: <RecentPage /> },
  { path: 'albums', element: <AlbumsPage /> },
  { path: 'album/:id', element: <AlbumPage /> },
  { path: 'artists', element: <ArtistsPage /> },
  { path: 'artist/:id', element: <ArtistPage /> },
  { path: 'genre/:id', element: <GenrePage /> },
  { path: 'settings', element: <SettingsPage /> },
  { path: '*', element: <NotFoundPage /> },
];

/**
 * Router oparty na fragmencie adresu (#/album/...). Dzięki temu bezpośrednie linki
 * i odświeżanie strony działają także na prostym hostingu, np. GitHub Pages.
 */
export function createAppRouter() {
  return createHashRouter([
    {
      path: '/',
      element: (
        <DialogProvider>
          <AppLayout />
        </DialogProvider>
      ),
      errorElement: <RouteErrorPage />,
      children: ROUTES,
    },
  ]);
}

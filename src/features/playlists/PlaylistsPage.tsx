import { Plus } from 'lucide-react';
import { FeaturedPlaylistCard, UserPlaylistCard } from '../../components/music/PlaylistCard';
import { Shelf } from '../../components/music/Shelf';
import { Button } from '../../components/ui/Button';
import { useDialogs } from '../../context/DialogContext';
import { useLibrary } from '../../context/LibraryContext';
import { getPlaylistsByCategory } from '../../data/catalog';
import { Page } from '../shared/Page';
import styles from './PlaylistsPage.module.css';

export default function PlaylistsPage() {
  const { playlists } = useLibrary();
  const { openCreatePlaylist } = useDialogs();

  return (
    <Page
      title="Playlisty"
      description="Twoje playlisty i gotowe zestawy przygotowane przez SONORA."
      actions={
        <Button variant="primary" icon={Plus} onClick={() => openCreatePlaylist()}>
          Nowa playlista
        </Button>
      }
    >
      <Shelf title="Twoje playlisty" layout="grid">
        {playlists.map((playlist) => (
          <UserPlaylistCard key={playlist.id} playlist={playlist} />
        ))}
        <button type="button" className={styles.createCard} onClick={() => openCreatePlaylist()}>
          <span className={styles.createIcon} aria-hidden>
            <Plus size={32} />
          </span>
          <span className={styles.createTitle}>Utwórz playlistę</span>
          <span className={styles.createHint}>
            {playlists.length === 0
              ? 'Zacznij od nazwy, utwory dodasz później.'
              : 'Kolejna lista na inną okazję.'}
          </span>
        </button>
      </Shelf>
      <Shelf title="Od SONORA" layout="grid">
        {getPlaylistsByCategory('editorial').map((playlist) => (
          <FeaturedPlaylistCard key={playlist.id} playlist={playlist} />
        ))}
      </Shelf>
      <Shelf title="Według nastroju" layout="grid">
        {getPlaylistsByCategory('mood').map((playlist) => (
          <FeaturedPlaylistCard key={playlist.id} playlist={playlist} />
        ))}
      </Shelf>
      <Shelf title="Nauka, praca, trening i relaks" layout="grid">
        {getPlaylistsByCategory('activity').map((playlist) => (
          <FeaturedPlaylistCard key={playlist.id} playlist={playlist} />
        ))}
      </Shelf>
    </Page>
  );
}

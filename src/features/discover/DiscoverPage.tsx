import { AlbumCard } from '../../components/music/AlbumCard';
import { GenreTile } from '../../components/music/GenreTile';
import { FeaturedPlaylistCard } from '../../components/music/PlaylistCard';
import { Shelf } from '../../components/music/Shelf';
import { GENRES, getGenreCover, getNewReleases, getPlaylistsByCategory } from '../../data/catalog';
import { DiscoverySpotlight } from '../home/DiscoverySpotlight';
import { Page } from '../shared/Page';
import styles from './DiscoverPage.module.css';

export default function DiscoverPage() {
  return (
    <Page title="Odkrywaj" description="Gatunki, nastroje i utwory, których jeszcze nie znasz.">
      <DiscoverySpotlight />

      <section className={styles.section} aria-labelledby="discover-genres">
        <h2 id="discover-genres" className={styles.title}>
          Przeglądaj gatunki
        </h2>
        <div className={styles.genres}>
          {GENRES.map((genre) => (
            <GenreTile key={genre.id} genre={genre} coverUrl={getGenreCover(genre.id)} />
          ))}
        </div>
      </section>

      <Shelf title="Playlisty według nastroju" layout="grid">
        {getPlaylistsByCategory('mood').map((playlist) => (
          <FeaturedPlaylistCard key={playlist.id} playlist={playlist} />
        ))}
      </Shelf>

      <Shelf title="Na każdą okazję" description="Nauka, praca, trening i relaks." layout="grid">
        {getPlaylistsByCategory('activity').map((playlist) => (
          <FeaturedPlaylistCard key={playlist.id} playlist={playlist} />
        ))}
      </Shelf>

      <Shelf title="Wszystkie wydania" to="/albums">
        {getNewReleases().map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </Shelf>
    </Page>
  );
}

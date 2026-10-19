import { useState } from 'react';
import { AlbumCard } from '../../components/music/AlbumCard';
import { CardGrid } from '../../components/music/Shelf';
import { FilterChips } from '../../components/ui/FilterChips';
import { ALBUMS, sortByReleaseDate } from '../../data/catalog';
import type { AlbumType } from '../../types/music';
import { Page } from '../shared/Page';
import styles from './AlbumsPage.module.css';

type TypeFilter = 'all' | AlbumType;
type Sort = 'newest' | 'title';
const collator = new Intl.Collator('pl', { sensitivity: 'base' });

export default function AlbumsPage() {
  const [type, setType] = useState<TypeFilter>('all');
  const [sort, setSort] = useState<Sort>('newest');
  const filtered = ALBUMS.filter((album) => type === 'all' || album.type === type);
  const albums =
    sort === 'newest'
      ? sortByReleaseDate(filtered)
      : [...filtered].sort((a, b) => collator.compare(a.title, b.title));
  const count = (value: AlbumType) => ALBUMS.filter((album) => album.type === value).length;

  return (
    <Page title="Albumy" description="Wszystkie wydania w katalogu demonstracyjnym.">
      <div className={styles.toolbar}>
        <FilterChips
          label="Rodzaj wydania"
          value={type}
          onChange={setType}
          options={[
            { value: 'all', label: 'Wszystkie', count: ALBUMS.length },
            { value: 'album', label: 'Albumy', count: count('album') },
            { value: 'ep', label: 'EP', count: count('ep') },
            { value: 'single', label: 'Single', count: count('single') },
            { value: 'compilation', label: 'Kompilacje', count: count('compilation') },
          ]}
        />
        <FilterChips
          label="Sortowanie"
          value={sort}
          onChange={setSort}
          options={[
            { value: 'newest', label: 'Najnowsze' },
            { value: 'title', label: 'A-Z' },
          ]}
        />
      </div>
      <CardGrid>
        {albums.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </CardGrid>
    </Page>
  );
}

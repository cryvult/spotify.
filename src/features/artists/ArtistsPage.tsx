import { ArtistCard } from '../../components/music/ArtistCard';
import { CardGrid } from '../../components/music/Shelf';
import { getPopularArtists } from '../../data/catalog';
import { Page } from '../shared/Page';

export default function ArtistsPage() {
  return (
    <Page
      title="Wykonawcy"
      description="Projekty demonstracyjne SONORA oraz kompozytor utworów z Wikimedia Commons."
    >
      <CardGrid>
        {getPopularArtists().map((artist) => (
          <ArtistCard key={artist.id} artist={artist} />
        ))}
      </CardGrid>
    </Page>
  );
}

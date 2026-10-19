import { Dices, Play } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { CoverImage } from '../../components/music/CoverImage';
import { Button } from '../../components/ui/Button';
import { useLibrary } from '../../context/LibraryContext';
import { usePlayerControls } from '../../context/PlayerContext';
import { formatCount, TRACK_FORMS } from '../../utils/pluralize';
import { pickUndiscovered } from '../player/recommendations';
import styles from './DiscoverySpotlight.module.css';

/**
 * „Odkryj coś nowego”: utwory, których użytkownik jeszcze nie słuchał.
 * Przycisk „Losuj inne” wybiera nowy zestaw.
 */
export function DiscoverySpotlight() {
  const { recent, likedIds } = useLibrary();
  const { playTracks } = usePlayerControls();
  // Zestaw zmienia się tylko po kliknięciu „Losuj inne”, a nie przy każdym odtworzeniu utworu.
  const playedIds = new Set(recent.map((entry) => entry.trackId));
  const draw = () => pickUndiscovered(playedIds, likedIds, 6);
  const [picks, setPicks] = useState(draw);
  const [round, setRound] = useState(1);
  const lead = picks[0];
  if (!lead) return null;
  // Gdy niesłuchanych utworów jest za mało, zestaw uzupełniają utwory spoza ulubionych.
  const allFresh = picks.every((track) => !playedIds.has(track.id));

  return (
    <section className={styles.spotlight} aria-labelledby="discover-title">
      <CoverImage src={lead.coverUrl} alt="" size={400} className={styles.cover} />
      <div className={styles.body}>
        <h2 id="discover-title" className={styles.heading}>
          Odkryj coś nowego
        </h2>
        <p className={styles.lead}>
          Zacznij od <strong>{lead.title}</strong>
          {lead.artistId ? (
            <>
              {' '}
              (<Link to={`/artist/${lead.artistId}`}>{lead.artistName}</Link>)
            </>
          ) : null}
          . Cały zestaw to {formatCount(picks.length, TRACK_FORMS)}{' '}
          {allFresh ? 'spoza Twojej historii odtwarzania.' : 'spoza Twoich ulubionych.'}
        </p>
        <div className={styles.actions}>
          <Button
            variant="primary"
            icon={Play}
            onClick={() =>
              playTracks(picks, {
                context: {
                  type: 'discover',
                  id: `discover-${round}`,
                  title: 'Odkryj coś nowego',
                  path: '/discover',
                },
              })
            }
          >
            Odtwórz zestaw
          </Button>
          <Button
            variant="secondary"
            icon={Dices}
            onClick={() => {
              setPicks(draw());
              setRound((value) => value + 1);
            }}
          >
            Losuj inne
          </Button>
        </div>
        <ul className={styles.thumbs} aria-label="Utwory w zestawie">
          {picks.slice(1).map((track) => (
            <li key={track.id} title={`${track.title}, ${track.artistName}`}>
              <CoverImage
                src={track.coverUrl}
                alt={`${track.title}, ${track.artistName}`}
                size={96}
                className={styles.thumb}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

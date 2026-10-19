import { ExternalLink, Keyboard, Monitor, Moon, RotateCcw, Sun, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Switch } from '../../components/ui/Switch';
import { TextField } from '../../components/ui/TextField';
import { useDialogs } from '../../context/DialogContext';
import { useLibrary } from '../../context/LibraryContext';
import { usePlayerControls } from '../../context/PlayerContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { GENRES, TRACKS } from '../../data/catalog';
import { OPENVERSE_AVAILABLE } from '../../services/openverseService';
import { clearAllStorage, isStorageAvailable } from '../../services/storageService';
import type { GenreId } from '../../types/music';
import { formatCount, PLAYLIST_FORMS, TRACK_FORMS } from '../../utils/pluralize';
import { Page } from '../shared/Page';
import { MAX_NAME_LENGTH, type MotionPreference, type ThemePreference } from './settingsModel';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const library = useLibrary();
  const dialogs = useDialogs();
  const { stopAndClear } = usePlayerControls();
  const { showToast } = useToast();
  const [name, setName] = useState(settings.userName);
  const storageOk = isStorageAvailable();
  const remoteTracks = TRACKS.filter((track) => track.source === 'remote');

  const toggleGenre = (id: GenreId) => {
    const favoriteGenres = settings.favoriteGenres.includes(id)
      ? settings.favoriteGenres.filter((genre) => genre !== id)
      : [...settings.favoriteGenres, id];
    updateSettings({ favoriteGenres });
  };

  const saveName = () => {
    const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);
    if (trimmed === settings.userName) return;
    updateSettings({ userName: trimmed });
    showToast({
      tone: 'success',
      message: trimmed ? `Zapisano imię: ${trimmed}.` : 'Usunięto imię z powitania.',
    });
  };

  const confirmAndRun = async (title: string, message: string, confirmLabel: string, action: () => void) => {
    const confirmed = await dialogs.confirm({ title, message, confirmLabel, tone: 'danger' });
    if (confirmed) action();
  };

  const clearEverything = () =>
    void confirmAndRun(
      'Usunąć wszystkie dane?',
      'Zostaną usunięte Twoje playlisty, ulubione utwory, historia, kolejka i ustawienia zapisane w tej przeglądarce. Tej operacji nie można cofnąć.',
      'Usuń wszystkie dane',
      () => {
        stopAndClear();
        library.resetLibrary();
        resetSettings();
        clearAllStorage();
        setName('');
        showToast({ message: 'Usunięto wszystkie dane SONORA z tej przeglądarki.' });
      },
    );

  return (
    <Page
      title="Ustawienia"
      description="Wszystkie ustawienia zapisują się automatycznie w tej przeglądarce."
    >
      <section className={styles.card} aria-labelledby="settings-profile">
        <h2 id="settings-profile" className={styles.heading}>
          Profil
        </h2>
        <div className={styles.nameRow}>
          <TextField
            label="Imię w powitaniu"
            hint="Opcjonalne. Nie wysyłamy go nigdzie, służy tylko do powitania na stronie głównej."
            value={name}
            maxLength={MAX_NAME_LENGTH}
            autoComplete="given-name"
            onChange={(event) => setName(event.target.value)}
            onBlur={saveName}
            onKeyDown={(event) => event.key === 'Enter' && saveName()}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label} id="favorite-genres">
            Ulubione gatunki
          </span>
          <p className={styles.hint}>Pasujące playlisty i albumy pojawią się wyżej na stronie głównej.</p>
          <div className={styles.genres} role="group" aria-labelledby="favorite-genres">
            {GENRES.map((genre) => (
              <button
                key={genre.id}
                type="button"
                className={styles.genre}
                aria-pressed={settings.favoriteGenres.includes(genre.id)}
                onClick={() => toggleGenre(genre.id)}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.card} aria-labelledby="settings-look">
        <h2 id="settings-look" className={styles.heading}>
          Wygląd
        </h2>
        <div className={styles.field}>
          <span className={styles.label}>Motyw</span>
          <SegmentedControl<ThemePreference>
            label="Motyw"
            value={settings.theme}
            onChange={(theme) => updateSettings({ theme })}
            options={[
              { value: 'dark', label: 'Ciemny', icon: Moon },
              { value: 'light', label: 'Jasny', icon: Sun },
              { value: 'system', label: 'Systemowy', icon: Monitor },
            ]}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Animacje</span>
          <p className={styles.hint}>
            „Systemowe” korzysta z ustawienia ograniczenia ruchu w systemie operacyjnym.
          </p>
          <SegmentedControl<MotionPreference>
            label="Animacje"
            value={settings.motion}
            onChange={(motion) => updateSettings({ motion })}
            options={[
              { value: 'system', label: 'Systemowe' },
              { value: 'reduce', label: 'Ograniczone' },
            ]}
          />
        </div>
      </section>

      <section className={styles.card} aria-labelledby="settings-playback">
        <h2 id="settings-playback" className={styles.heading}>
          Odtwarzanie i wyszukiwanie
        </h2>
        <div className={styles.switches}>
          <Switch
            label="Autoodtwarzanie"
            description="Gdy kolejka się skończy, odtwarzaj podobne utwory z katalogu."
            checked={settings.autoplay}
            onChange={(autoplay) => updateSettings({ autoplay })}
          />
          <Switch
            label="Pamiętaj kolejkę"
            description="Po odświeżeniu strony przywróć kolejkę i miejsce w utworze (bez automatycznego odtwarzania)."
            checked={settings.rememberQueue}
            onChange={(rememberQueue) => updateSettings({ rememberQueue })}
          />
          <Switch
            label="Wyszukiwanie w Openverse"
            description={
              OPENVERSE_AVAILABLE
                ? 'Pozwala szukać utworów na licencjach Creative Commons w zewnętrznym serwisie Openverse. Wpisane zapytania są wtedy wysyłane do tego serwisu.'
                : 'Wyłączone w konfiguracji aplikacji (VITE_ENABLE_OPENVERSE=false).'
            }
            checked={OPENVERSE_AVAILABLE && settings.openverseEnabled}
            disabled={!OPENVERSE_AVAILABLE}
            onChange={(openverseEnabled) => updateSettings({ openverseEnabled })}
          />
        </div>
        <div className={styles.inline}>
          <Button variant="secondary" icon={Keyboard} onClick={dialogs.openShortcuts}>
            Skróty klawiaturowe
          </Button>
        </div>
      </section>

      <section className={styles.card} aria-labelledby="settings-data">
        <h2 id="settings-data" className={styles.heading}>
          Dane w tej przeglądarce
        </h2>
        <p className={styles.hint}>
          {storageOk
            ? `Zapisane: ${formatCount(library.playlists.length, PLAYLIST_FORMS)}, ${formatCount(library.liked.length, TRACK_FORMS)} w ulubionych, ${formatCount(library.recent.length, TRACK_FORMS)} w historii. SONORA nie ma kont ani serwera, więc dane nie są synchronizowane między urządzeniami.`
            : 'Pamięć przeglądarki jest niedostępna (np. tryb prywatny z blokadą danych). Zmiany będą działać tylko do zamknięcia karty.'}
        </p>
        <div className={styles.inline}>
          <Button
            variant="secondary"
            icon={RotateCcw}
            onClick={() =>
              void confirmAndRun(
                'Wyczyścić historię odtwarzania?',
                'Lista ostatnio odtwarzanych utworów zostanie usunięta.',
                'Wyczyść historię',
                () => {
                  library.clearRecent();
                  showToast({ message: 'Wyczyszczono historię odtwarzania.' });
                },
              )
            }
            disabled={library.recent.length === 0}
          >
            Wyczyść historię odtwarzania
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              library.clearRecentSearches();
              showToast({ message: 'Wyczyszczono ostatnie wyszukiwania.' });
            }}
            disabled={library.recentSearches.length === 0}
          >
            Wyczyść ostatnie wyszukiwania
          </Button>
          <Button variant="secondary" onClick={() => updateSettings({ onboardingDone: false })}>
            Pokaż ekran powitalny
          </Button>
        </div>
        <div className={styles.danger}>
          <div>
            <p className={styles.label}>Usuń wszystkie dane</p>
            <p className={styles.hint}>
              Playlisty, ulubione, historia, kolejka i ustawienia wrócą do stanu początkowego.
            </p>
          </div>
          <Button variant="danger" icon={Trash2} onClick={clearEverything}>
            Usuń dane
          </Button>
        </div>
      </section>

      <section className={styles.card} aria-labelledby="settings-about">
        <h2 id="settings-about" className={styles.heading}>
          O aplikacji i licencjach
        </h2>
        <div className={styles.about}>
          <p>
            SONORA to projekt demonstracyjny: aplikacja muzyczna w przeglądarce napisana w React, TypeScript i
            Vite. Nie jest powiązana z żadnym komercyjnym serwisem muzycznym.
          </p>
          <h3 className={styles.subheading}>Muzyka</h3>
          <ul className={styles.credits}>
            <li>
              {TRACKS.length - remoteTracks.length} utworów wykonawców demonstracyjnych zostało wygenerowanych
              algorytmicznie skryptem projektu (scripts/generate-audio.mjs) i jest udostępnionych na licencji
              CC0 1.0. Wykonawcy są fikcyjni.
            </li>
            <li>
              {remoteTracks.length} utworów: Kevin MacLeod (incompetech.com), licencja{' '}
              <a href="https://creativecommons.org/licenses/by/3.0/deed.pl" target="_blank" rel="noreferrer">
                CC BY 3.0
              </a>
              , odtwarzane z Wikimedia Commons:
              <ul className={styles.sublist}>
                {remoteTracks.map((track) => (
                  <li key={track.id}>
                    {track.license?.sourceUrl ? (
                      <a href={track.license.sourceUrl} target="_blank" rel="noreferrer">
                        {track.title} <ExternalLink size={12} aria-hidden />
                      </a>
                    ) : (
                      track.title
                    )}
                  </li>
                ))}
              </ul>
            </li>
            <li>
              Wyniki z Openverse mają licencje wskazane przy każdym utworze (menu utworu, „Źródło i
              licencja”).
            </li>
          </ul>
          <h3 className={styles.subheading}>Grafika i kod</h3>
          <ul className={styles.credits}>
            <li>
              Okładki to abstrakcyjne grafiki wygenerowane skryptem projektu (scripts/generate-covers.mjs).
            </li>
            <li>
              Ikony:{' '}
              <a href="https://lucide.dev" target="_blank" rel="noreferrer">
                Lucide
              </a>{' '}
              (licencja ISC). Krój pisma:{' '}
              <a href="https://rsms.me/inter/" target="_blank" rel="noreferrer">
                Inter
              </a>{' '}
              (SIL Open Font License 1.1).
            </li>
          </ul>
        </div>
      </section>
    </Page>
  );
}

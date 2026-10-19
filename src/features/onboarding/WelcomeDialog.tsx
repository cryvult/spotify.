import { useState, type FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { TextField } from '../../components/ui/TextField';
import { useSettings } from '../../context/SettingsContext';
import { GENRES } from '../../data/catalog';
import type { GenreId } from '../../types/music';
import { MAX_NAME_LENGTH } from '../settings/settingsModel';
import styles from './WelcomeDialog.module.css';

/** Ekran powitalny przy pierwszej wizycie: krótkie wyjaśnienie, imię i ulubione gatunki. */
export function WelcomeDialog() {
  const { settings, updateSettings } = useSettings();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(settings.userName);
  const [genres, setGenres] = useState<GenreId[]>(settings.favoriteGenres);

  const finish = (save: boolean) => {
    updateSettings(
      save
        ? { onboardingDone: true, userName: name.trim(), favoriteGenres: genres }
        : { onboardingDone: true },
    );
  };

  const toggleGenre = (id: GenreId) =>
    setGenres((current) =>
      current.includes(id) ? current.filter((genre) => genre !== id) : [...current, id],
    );

  const next = (event: FormEvent) => {
    event.preventDefault();
    setStep(2);
  };

  return (
    <Modal
      open={!settings.onboardingDone}
      onClose={() => finish(false)}
      title={step === 1 ? 'Witaj w SONORA' : 'Czego lubisz słuchać?'}
      description={
        step === 1
          ? 'To demonstracyjna aplikacja muzyczna. Działa bez konta: playlisty, ulubione i ustawienia zapisują się tylko w tej przeglądarce.'
          : 'Wybierz kilka gatunków. Na stronie głównej pokażemy je na początku.'
      }
    >
      {step === 1 ? (
        <form className={styles.form} onSubmit={next}>
          <TextField
            label="Jak masz na imię? (opcjonalnie)"
            hint="Użyjemy go tylko w powitaniu na stronie głównej."
            value={name}
            maxLength={MAX_NAME_LENGTH}
            autoComplete="given-name"
            autoFocus
            onChange={(event) => setName(event.target.value)}
          />
          <div className={styles.actions}>
            <Button variant="ghost" onClick={() => finish(false)}>
              Pomiń
            </Button>
            <Button variant="primary" type="submit">
              Dalej
            </Button>
          </div>
        </form>
      ) : (
        <div className={styles.form}>
          <div className={styles.genres} role="group" aria-label="Ulubione gatunki">
            {GENRES.map((genre) => (
              <button
                key={genre.id}
                type="button"
                aria-pressed={genres.includes(genre.id)}
                className={styles.genre}
                onClick={() => toggleGenre(genre.id)}
              >
                {genre.name}
              </button>
            ))}
          </div>
          <div className={styles.actions}>
            <Button variant="ghost" onClick={() => setStep(1)}>
              Wstecz
            </Button>
            <Button variant="primary" onClick={() => finish(true)}>
              Zaczynamy
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

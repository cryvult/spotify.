import { useState, type FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { TextField } from '../../components/ui/TextField';
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from '../library/libraryReducer';
import styles from './Dialogs.module.css';

export interface PlaylistFormValues {
  title: string;
  description: string;
}

interface PlaylistFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialValues?: PlaylistFormValues;
  /** Liczba utworów, które trafią do nowej playlisty (informacja dla użytkownika). */
  trackCount?: number;
  onClose: () => void;
  onSubmit: (values: PlaylistFormValues) => void;
}

export function PlaylistFormDialog({
  open,
  mode,
  initialValues,
  trackCount = 0,
  onClose,
  onSubmit,
}: PlaylistFormDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nowa playlista' : 'Edytuj playlistę'}
      description={
        mode === 'create' && trackCount > 0
          ? `Playlista zostanie utworzona z wybranymi utworami (${trackCount}).`
          : undefined
      }
    >
      {/* Formularz montuje się na nowo przy każdym otwarciu, więc zaczyna od aktualnych wartości. */}
      {open ? (
        <PlaylistForm mode={mode} initialValues={initialValues} onCancel={onClose} onSubmit={onSubmit} />
      ) : null}
    </Modal>
  );
}

interface PlaylistFormProps {
  mode: 'create' | 'edit';
  initialValues?: PlaylistFormValues;
  onCancel: () => void;
  onSubmit: (values: PlaylistFormValues) => void;
}

function PlaylistForm({ mode, initialValues, onCancel, onSubmit }: PlaylistFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError('Podaj nazwę playlisty.');
      return;
    }
    onSubmit({ title: title.trim(), description: description.trim() });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className={styles.form}>
      <TextField
        label="Nazwa"
        name="title"
        value={title}
        maxLength={MAX_TITLE_LENGTH}
        autoFocus
        autoComplete="off"
        placeholder="np. Muzyka na wieczór"
        error={error}
        counter={{ value: title.length, max: MAX_TITLE_LENGTH }}
        onChange={(event) => {
          setTitle(event.target.value);
          if (error) setError(null);
        }}
      />
      <TextField
        multiline
        label="Opis (opcjonalnie)"
        name="description"
        value={description}
        maxLength={MAX_DESCRIPTION_LENGTH}
        placeholder="Kilka słów o tej playliście"
        counter={{ value: description.length, max: MAX_DESCRIPTION_LENGTH }}
        onChange={(event) => setDescription(event.target.value)}
      />
      <div className={styles.actions}>
        <Button variant="ghost" onClick={onCancel}>
          Anuluj
        </Button>
        <Button variant="primary" type="submit">
          {mode === 'create' ? 'Utwórz playlistę' : 'Zapisz zmiany'}
        </Button>
      </div>
    </form>
  );
}

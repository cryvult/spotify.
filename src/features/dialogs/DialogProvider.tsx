import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { DialogContext, type ConfirmOptions, type DialogContextValue } from '../../context/DialogContext';
import { useLibrary } from '../../context/LibraryContext';
import { useToast } from '../../context/ToastContext';
import type { Track, UserPlaylist } from '../../types/music';
import { formatCount, TRACK_FORMS } from '../../utils/pluralize';
import { AddToPlaylistDialog } from './AddToPlaylistDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { PlaylistFormDialog, type PlaylistFormValues } from './PlaylistFormDialog';
import { ShortcutsDialog } from './ShortcutsDialog';

type FormState = { mode: 'create'; tracks: Track[] } | { mode: 'edit'; playlist: UserPlaylist } | null;

/** Wspólne okna dialogowe aplikacji, otwierane z dowolnego miejsca przez useDialogs(). */
export function DialogProvider({ children }: { children: ReactNode }) {
  const library = useLibrary();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);
  const confirmResolver = useRef<((value: boolean) => void) | null>(null);
  const [form, setForm] = useState<FormState>(null);
  const [addTracks, setAddTracks] = useState<Track[] | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const confirm = useCallback((options: ConfirmOptions) => {
    confirmResolver.current?.(false);
    setConfirmOptions(options);
    return new Promise<boolean>((resolve) => {
      confirmResolver.current = resolve;
    });
  }, []);

  const resolveConfirm = (confirmed: boolean) => {
    confirmResolver.current?.(confirmed);
    confirmResolver.current = null;
    setConfirmOptions(null);
  };

  const handleFormSubmit = (values: PlaylistFormValues) => {
    if (!form) return;
    if (form.mode === 'create') {
      const id = library.createPlaylist(values, form.tracks);
      setForm(null);
      if (!id) return;
      showToast({
        tone: 'success',
        message:
          form.tracks.length > 0
            ? `Utworzono playlistę „${values.title}” (${formatCount(form.tracks.length, TRACK_FORMS)}).`
            : `Utworzono playlistę „${values.title}”.`,
      });
      navigate(`/playlist/${id}`);
    } else {
      library.updatePlaylist(form.playlist.id, values);
      setForm(null);
      showToast({ tone: 'success', message: 'Zapisano zmiany playlisty.' });
    }
  };

  const handleAddToPlaylist = (playlist: UserPlaylist) => {
    if (!addTracks) return;
    const { added, skipped } = library.addToPlaylist(playlist.id, addTracks);
    setAddTracks(null);
    if (added === 0) {
      showToast({ message: `Wybrane utwory są już na playliście „${playlist.title}”.` });
      return;
    }
    const extra = skipped > 0 ? ` Pominięto duplikaty: ${skipped}.` : '';
    showToast({
      tone: 'success',
      message: `Dodano ${formatCount(added, TRACK_FORMS)} do „${playlist.title}”.${extra}`,
      action: { label: 'Pokaż', onClick: () => navigate(`/playlist/${playlist.id}`) },
    });
  };

  const value = useMemo<DialogContextValue>(
    () => ({
      confirm,
      openCreatePlaylist: (tracks = []) => setForm({ mode: 'create', tracks }),
      openEditPlaylist: (playlist) => setForm({ mode: 'edit', playlist }),
      openAddToPlaylist: (tracks) => setAddTracks(tracks),
      openShortcuts: () => setShortcutsOpen(true),
    }),
    [confirm],
  );

  return (
    <DialogContext.Provider value={value}>
      {children}
      <ConfirmDialog options={confirmOptions} onResult={resolveConfirm} />
      <PlaylistFormDialog
        open={form !== null}
        mode={form?.mode ?? 'create'}
        initialValues={
          form?.mode === 'edit'
            ? { title: form.playlist.title, description: form.playlist.description }
            : undefined
        }
        trackCount={form?.mode === 'create' ? form.tracks.length : 0}
        onClose={() => setForm(null)}
        onSubmit={handleFormSubmit}
      />
      <AddToPlaylistDialog
        tracks={addTracks}
        onClose={() => setAddTracks(null)}
        onSelect={handleAddToPlaylist}
        onCreateNew={() => {
          const tracks = addTracks ?? [];
          setAddTracks(null);
          setForm({ mode: 'create', tracks });
        }}
      />
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </DialogContext.Provider>
  );
}

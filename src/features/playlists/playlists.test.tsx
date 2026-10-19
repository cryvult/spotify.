import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../../test/renderApp';

const LIBRARY_WITH_PLAYLIST = {
  'sonora:v1:library': {
    playlists: [
      {
        id: 'pl_test',
        title: 'Testowa',
        description: 'Opis testowy',
        items: [
          { trackId: 'szklo', addedAt: '2026-10-01T10:00:00.000Z' },
          { trackId: 'pulsar', addedAt: '2026-10-02T10:00:00.000Z' },
        ],
        createdAt: '2026-10-01T10:00:00.000Z',
        updatedAt: '2026-10-02T10:00:00.000Z',
      },
    ],
    liked: [],
    recent: [],
    recentSearches: [],
    externalTracks: {},
  },
};

describe('playlisty', () => {
  it('tworzy playlistę i wymaga nazwy', async () => {
    const { user } = renderApp('/playlists');
    await user.click(await screen.findByRole('button', { name: 'Nowa playlista' }));
    const dialog = await screen.findByRole('dialog', { name: 'Nowa playlista' });
    await user.click(within(dialog).getByRole('button', { name: 'Utwórz playlistę' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Podaj nazwę playlisty.');
    await user.type(within(dialog).getByLabelText('Nazwa'), 'Na rower');
    await user.click(within(dialog).getByRole('button', { name: 'Utwórz playlistę' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Na rower' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ta playlista jest jeszcze pusta' })).toBeInTheDocument();
  });

  it('pokazuje utwory, liczbę i łączny czas', async () => {
    renderApp('/playlist/pl_test', { storage: LIBRARY_WITH_PLAYLIST });
    expect(await screen.findByRole('heading', { level: 1, name: 'Testowa' })).toBeInTheDocument();
    expect(screen.getByText('2 utwory, 2 min 34 s')).toBeInTheDocument();
    const list = screen.getByRole('list', { name: 'Utwory na playliście Testowa' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  });

  it('edytuje nazwę i opis playlisty', async () => {
    const { user } = renderApp('/playlist/pl_test', { storage: LIBRARY_WITH_PLAYLIST });
    await user.click(await screen.findByRole('button', { name: 'Edytuj playlistę' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edytuj playlistę' });
    const name = within(dialog).getByLabelText('Nazwa');
    await user.clear(name);
    await user.type(name, 'Po zmianie');
    await user.click(within(dialog).getByRole('button', { name: 'Zapisz zmiany' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Po zmianie' })).toBeInTheDocument();
  });

  it('dodaje proponowany utwór i usuwa utwór z playlisty', async () => {
    const { user } = renderApp('/playlist/pl_test', { storage: LIBRARY_WITH_PLAYLIST });
    const list = await screen.findByRole('list', { name: 'Utwory na playliście Testowa' });
    await user.click(within(list).getByRole('button', { name: 'Więcej opcji: Pulsar' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Usuń z tej playlisty' }));
    await waitFor(() => expect(within(list).getAllByRole('listitem')).toHaveLength(1));
    const suggestions = screen
      .getByRole('heading', { name: 'Proponowane utwory' })
      .closest('section') as HTMLElement;
    await user.click(within(suggestions).getAllByRole('button', { name: /^Dodaj/ })[0] as HTMLElement);
    await waitFor(() => expect(within(list).getAllByRole('listitem')).toHaveLength(2));
  });

  it('usuwa playlistę dopiero po potwierdzeniu', async () => {
    const { user } = renderApp('/playlist/pl_test', { storage: LIBRARY_WITH_PLAYLIST });
    await user.click(await screen.findByRole('button', { name: 'Więcej opcji: Testowa' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Usuń playlistę' }));
    const confirm = await screen.findByRole('dialog', { name: 'Usunąć playlistę?' });
    await user.click(within(confirm).getByRole('button', { name: 'Anuluj' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Testowa' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Więcej opcji: Testowa' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Usuń playlistę' }));
    await user.click(
      within(await screen.findByRole('dialog', { name: 'Usunąć playlistę?' })).getByRole('button', {
        name: 'Usuń playlistę',
      }),
    );
    expect(await screen.findByRole('heading', { level: 1, name: 'Playlisty' })).toBeInTheDocument();
    expect(localStorage.getItem('sonora:v1:library')).not.toContain('pl_test');
  });

  it('dodaje utwór do playlisty z menu kontekstowego', async () => {
    const { user } = renderApp('/album/osmy-bit', { storage: LIBRARY_WITH_PLAYLIST });
    const list = await screen.findByRole('list', { name: 'Utwory na albumie Ósmy bit' });
    await user.click(within(list).getByRole('button', { name: 'Więcej opcji: Start gry' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Dodaj do playlisty…' }));
    const dialog = await screen.findByRole('dialog', { name: 'Dodaj do playlisty' });
    await user.click(within(dialog).getByRole('button', { name: /Testowa/ }));
    expect(await screen.findByText('Dodano 1 utwór do „Testowa”.')).toBeInTheDocument();
  });
});

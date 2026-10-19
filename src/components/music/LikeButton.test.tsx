import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../../test/renderApp';

describe('ulubione utwory', () => {
  it('stan serca jest spójny na liście i w odtwarzaczu, a ulubione trafiają na listę', async () => {
    const { user } = renderApp('/album/linia-33');
    await user.click(await screen.findByRole('button', { name: 'Odtwórz: Linia 33' }));
    const player = screen.getByRole('region', { name: 'Odtwarzacz' });
    const list = screen.getByRole('list', { name: 'Utwory na albumie Linia 33' });

    await user.click(within(list).getByRole('button', { name: 'Dodaj „Linia 33” do ulubionych' }));
    await waitFor(() =>
      expect(within(player).getByRole('button', { name: 'Usuń „Linia 33” z ulubionych' })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    );

    await user.click(screen.getByRole('link', { name: /Ulubione utwory/ }));
    const liked = await screen.findByRole('list', { name: 'Ulubione utwory' });
    expect(
      within(liked).getByRole('button', { name: /^(Odtwórz|Wstrzymaj) „Linia 33”$/ }),
    ).toBeInTheDocument();

    await user.click(within(player).getByRole('button', { name: 'Usuń „Linia 33” z ulubionych' }));
    expect(
      await screen.findByRole('heading', { name: 'Nie masz jeszcze ulubionych utworów' }),
    ).toBeInTheDocument();
  });

  it('pozwala cofnąć usunięcie z ulubionych', async () => {
    const { user } = renderApp('/album/linia-33');
    const list = await screen.findByRole('list', { name: 'Utwory na albumie Linia 33' });
    await user.click(within(list).getByRole('button', { name: 'Dodaj „Linia 33” do ulubionych' }));
    await user.click(within(list).getByRole('button', { name: 'Usuń „Linia 33” z ulubionych' }));
    const undo = (await screen.findAllByRole('button', { name: 'Cofnij' })).at(-1) as HTMLElement;
    await user.click(undo);
    expect(within(list).getByRole('button', { name: 'Usuń „Linia 33” z ulubionych' })).toBeInTheDocument();
  });

  it('sortuje ulubione według tytułu', async () => {
    const { user } = renderApp('/liked', {
      storage: {
        'sonora:v1:library': {
          playlists: [],
          liked: [
            { trackId: 'szklo', addedAt: '2026-10-03T10:00:00.000Z' },
            { trackId: 'pulsar', addedAt: '2026-10-02T10:00:00.000Z' },
            { trackId: 'kaseta-vhs', addedAt: '2026-10-01T10:00:00.000Z' },
          ],
          recent: [],
          recentSearches: [],
          externalTracks: {},
        },
      },
    });
    const list = await screen.findByRole('list', { name: 'Ulubione utwory' });
    const titles = () =>
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.querySelector('span')?.textContent);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Sortuj według' }), 'title');
    await waitFor(() => expect(within(list).getAllByRole('listitem')[0]).toHaveTextContent('Kaseta VHS'));
    expect(titles()).toHaveLength(3);
  });
});

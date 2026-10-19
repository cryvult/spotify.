import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../../test/renderApp';

describe('kolejka odtwarzania', () => {
  it('pokazuje bieżący utwór i następne, pozwala przejść do utworu i usunąć pozycję', async () => {
    const { user, audio } = renderApp('/album/szklo-i-mgla');
    await user.click(await screen.findByRole('button', { name: 'Odtwórz: Szkło i mgła' }));
    await user.click(screen.getByRole('button', { name: 'Kolejka odtwarzania' }));
    const panel = await screen.findByRole('complementary', { name: 'Kolejka odtwarzania' });
    expect(within(panel).getByText('Poranna mgła')).toBeInTheDocument();

    await user.click(within(panel).getByRole('button', { name: 'Usuń z kolejki: Szkło' }));
    expect(within(panel).queryByText('Szkło')).not.toBeInTheDocument();

    await user.click(within(panel).getByRole('button', { name: /Odtwórz teraz: Światło przez liście/ }));
    await waitFor(() => expect(audio.src).toContain('swiatlo-przez-liscie'));
  });

  it('„Dodaj do kolejki” umieszcza utwór w sekcji „Następne w kolejce”', async () => {
    const { user } = renderApp('/album/osmy-bit');
    await user.click(await screen.findByRole('button', { name: 'Odtwórz: Ósmy bit' }));
    const list = screen.getByRole('list', { name: 'Utwory na albumie Ósmy bit' });
    await user.click(within(list).getByRole('button', { name: 'Więcej opcji: Ostatni boss' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Dodaj do kolejki' }));
    await user.click(screen.getByRole('button', { name: 'Kolejka odtwarzania' }));
    const panel = await screen.findByRole('complementary', { name: 'Kolejka odtwarzania' });
    const userQueue = within(panel)
      .getByRole('heading', { name: 'Następne w kolejce' })
      .closest('section') as HTMLElement;
    expect(userQueue).toHaveTextContent('Ostatni boss');
  });
});

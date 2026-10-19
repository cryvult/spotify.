import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../../test/renderApp';

async function startAlbum(path = '/album/autostrada-1986', title = 'Autostrada 1986') {
  const app = renderApp(path);
  await app.user.click(await screen.findByRole('button', { name: `Odtwórz: ${title}` }));
  const player = screen.getByRole('region', { name: 'Odtwarzacz' });
  return { ...app, player };
}

describe('odtwarzacz', () => {
  it('odtwarza album i pokazuje bieżący utwór', async () => {
    const { player, audio } = await startAlbum();
    await waitFor(() => expect(within(player).getByText('Neon nad Wisłą')).toBeInTheDocument());
    expect(audio.src).toContain('audio/neon-nad-wisla.mp3');
    expect(within(player).getByRole('button', { name: 'Wstrzymaj' })).toBeInTheDocument();
  });

  it('aktualizuje pasek postępu podczas odtwarzania', async () => {
    const { player, audio } = await startAlbum();
    act(() => audio.advance(65));
    const slider = within(player).getByRole('slider', { name: 'Pozycja w utworze' });
    await waitFor(() => expect(slider).toHaveAttribute('aria-valuetext', '1 min 5 s z 2 min 0 s'));
  });

  it('wstrzymuje i wznawia odtwarzanie', async () => {
    const { player, audio, user } = await startAlbum();
    await user.click(await within(player).findByRole('button', { name: 'Wstrzymaj' }));
    await waitFor(() => expect(audio.paused).toBe(true));
    await user.click(within(player).getByRole('button', { name: 'Odtwórz' }));
    await waitFor(() => expect(audio.paused).toBe(false));
  });

  it('przechodzi do następnego utworu i automatycznie po zakończeniu bieżącego', async () => {
    const { player, audio, user } = await startAlbum();
    await user.click(within(player).getByRole('button', { name: 'Następny' }));
    await waitFor(() => expect(within(player).getByText('Autostrada 1986')).toBeInTheDocument());
    act(() => audio.finish());
    await waitFor(() => expect(within(player).getByText('Kaseta VHS')).toBeInTheDocument());
  });

  it('zmienia głośność i wycisza dźwięk', async () => {
    const { player, audio, user } = await startAlbum();
    // jsdom nie obsługuje klawiatury w suwakach, więc wysyłamy zdarzenie zmiany wartości.
    const volume = within(player).getByRole('slider', { name: 'Głośność' });
    fireEvent.change(volume, { target: { value: '25' } });
    await waitFor(() => expect(audio.volume).toBe(0.25));
    fireEvent.change(volume, { target: { value: '100' } });
    await waitFor(() => expect(audio.volume).toBe(1));
    await user.click(within(player).getByRole('button', { name: 'Wycisz' }));
    expect(audio.muted).toBe(true);
  });

  it('przełącza tryb losowy i powtarzanie', async () => {
    const { player, user } = await startAlbum();
    await user.click(within(player).getByRole('button', { name: 'Włącz odtwarzanie losowe' }));
    expect(within(player).getByRole('button', { name: 'Wyłącz odtwarzanie losowe' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(within(player).getByRole('button', { name: 'Włącz powtarzanie kolejki' }));
    expect(within(player).getByRole('button', { name: 'Włącz powtarzanie utworu' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('pokazuje błąd ładowania i pozwala spróbować ponownie', async () => {
    const { audio, user } = await startAlbum();
    act(() => audio.fail(2));
    const notice = await screen.findByRole('alert');
    expect(notice).toHaveTextContent('Nie można odtworzyć utworu.');
    expect(notice).toHaveTextContent(/Błąd sieci podczas pobierania utworu/);
    const loadsBefore = audio.playCalls;
    await user.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }));
    await waitFor(() => expect(audio.playCalls).toBeGreaterThan(loadsBefore));
  });

  it('informuje, gdy przeglądarka zablokuje odtwarzanie', async () => {
    const app = renderApp('/album/autostrada-1986');
    app.audio.playMode = 'blocked';
    await app.user.click(await screen.findByRole('button', { name: 'Odtwórz: Autostrada 1986' }));
    expect(await screen.findByText('Przeglądarka wstrzymała dźwięk.')).toBeInTheDocument();
  });

  it('zapisuje odtworzony utwór w historii', async () => {
    const { user } = await startAlbum();
    await waitFor(() => expect(localStorage.getItem('sonora:v1:library')).toContain('neon-nad-wisla'));
    await user.click(screen.getByRole('link', { name: 'Ostatnio odtwarzane' }));
    expect(await screen.findByRole('list', { name: 'Odtworzone: Dzisiaj' })).toHaveTextContent(
      'Neon nad Wisłą',
    );
  });
});

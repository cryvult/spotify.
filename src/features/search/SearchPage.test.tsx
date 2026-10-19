import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../../test/renderApp';

describe('wyszukiwarka', () => {
  it('pokazuje wyniki podczas pisania i podświetla dopasowanie', async () => {
    const { user } = renderApp('/search');
    const input = await screen.findByRole('searchbox');
    await user.type(input, 'swiatlo');
    const list = await screen.findByRole('list', { name: 'Znalezione utwory' });
    expect(within(list).getByText('Światło')).toBeInTheDocument();
    expect(list.querySelector('mark')).toHaveTextContent('Światło');
  });

  it('filtruje wyniki według rodzaju', async () => {
    const { user } = renderApp('/search');
    await user.type(await screen.findByRole('searchbox'), 'kaskada');
    await user.click(await screen.findByRole('button', { name: /^Wykonawcy/ }));
    expect(await screen.findByRole('link', { name: 'Kaskada' })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Znalezione utwory' })).not.toBeInTheDocument();
  });

  it('informuje o braku wyników', async () => {
    const { user } = renderApp('/search');
    await user.type(await screen.findByRole('searchbox'), 'xyzxyzxyz');
    expect(await screen.findByRole('heading', { name: 'Brak wyników dla „xyzxyzxyz”' })).toBeInTheDocument();
  });

  it('czyści pole przyciskiem i klawiszem Escape', async () => {
    const { user } = renderApp('/search');
    const input = await screen.findByRole('searchbox');
    await user.type(input, 'lofi');
    await user.click(screen.getByRole('button', { name: 'Wyczyść wyszukiwanie' }));
    expect(input).toHaveValue('');
    await user.type(input, 'house{Escape}');
    expect(input).toHaveValue('');
    expect(screen.getByRole('heading', { name: 'Przeglądaj wszystko' })).toBeInTheDocument();
  });

  it('zapamiętuje ostatnie wyszukiwania po zatwierdzeniu', async () => {
    const { user } = renderApp('/search');
    const input = await screen.findByRole('searchbox');
    await user.type(input, 'synthwave{Enter}');
    await user.clear(input);
    const recent = await screen.findByRole('heading', { name: 'Ostatnie wyszukiwania' });
    expect(recent.closest('section')).toHaveTextContent('synthwave');
  });

  it('odtwarza utwór z wyników', async () => {
    const { user, audio } = renderApp('/search');
    await user.type(await screen.findByRole('searchbox'), 'pulsar');
    const list = await screen.findByRole('list', { name: 'Znalezione utwory' });
    await user.click(within(list).getByRole('button', { name: 'Odtwórz „Pulsar”' }));
    await waitFor(() => expect(audio.src).toContain('audio/pulsar.mp3'));
  });
});

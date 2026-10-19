import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/renderApp';

describe('aplikacja', () => {
  it('pokazuje stronę główną z powitaniem i sekcjami', async () => {
    renderApp('/', { settings: { userName: 'Ola' } });
    expect(await screen.findByRole('heading', { name: /, Ola$/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Polecane playlisty' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Gatunki muzyczne' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Odtwarzacz' })).toBeInTheDocument();
  });

  it('nawiguje między widokami z panelu bocznego', async () => {
    const { user } = renderApp('/');
    const nav = await screen.findByRole('navigation', { name: 'Główna nawigacja' });
    await user.click(within(nav).getByRole('link', { name: 'Albumy' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Albumy' })).toBeInTheDocument();
    await user.click(within(nav).getByRole('link', { name: 'Wykonawcy' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Wykonawcy' })).toBeInTheDocument();
  });

  it('wyświetla stronę 404 dla nieznanego adresu', async () => {
    renderApp('/to-nie-istnieje');
    expect(await screen.findByRole('heading', { name: 'Ta strona nie gra' })).toBeInTheDocument();
  });

  it('pokazuje czytelny komunikat dla nieistniejącego albumu', async () => {
    renderApp('/album/brak');
    expect(await screen.findByRole('heading', { name: 'Nie znaleziono albumu' })).toBeInTheDocument();
  });

  it('przy pierwszej wizycie pokazuje ekran powitalny i zapisuje imię', async () => {
    const { user } = renderApp('/', { settings: { onboardingDone: false } });
    const dialog = await screen.findByRole('dialog', { name: 'Witaj w SONORA' });
    await user.type(within(dialog).getByLabelText(/Jak masz na imię/), 'Kuba');
    await user.click(within(dialog).getByRole('button', { name: 'Dalej' }));
    await user.click(screen.getByRole('button', { name: 'Synthwave' }));
    await user.click(screen.getByRole('button', { name: 'Zaczynamy' }));
    expect(await screen.findByRole('heading', { name: /, Kuba$/ })).toBeInTheDocument();
    const saved = JSON.parse(localStorage.getItem('sonora:v1:settings') ?? '{}') as {
      favoriteGenres: string[];
      onboardingDone: boolean;
    };
    expect(saved.onboardingDone).toBe(true);
    expect(saved.favoriteGenres).toEqual(['synthwave']);
  });
});

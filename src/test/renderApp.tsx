import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Providers } from '../app/providers';
import { ROUTES } from '../app/router';
import { AppLayout } from '../components/layout/AppLayout';
import { DialogProvider } from '../features/dialogs/DialogProvider';
import type { Settings } from '../features/settings/settingsModel';
import { AudioEngine } from '../services/audioEngine';
import { FakeAudio } from './FakeAudio';

interface RenderAppOptions {
  /** Ustawienia zapisane przed startem (domyślnie pomijamy ekran powitalny). */
  settings?: Partial<Settings>;
  /** Dodatkowe dane w localStorage (np. biblioteka). */
  storage?: Record<string, unknown>;
}

/** Renderuje całą aplikację pod wskazanym adresem, z atrapą elementu audio. */
export function renderApp(path = '/', { settings, storage }: RenderAppOptions = {}) {
  localStorage.setItem('sonora:v1:settings', JSON.stringify({ onboardingDone: true, ...settings }));
  Object.entries(storage ?? {}).forEach(([key, value]) => localStorage.setItem(key, JSON.stringify(value)));
  const audio = new FakeAudio();
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <DialogProvider>
            <AppLayout />
          </DialogProvider>
        ),
        children: ROUTES,
      },
    ],
    { initialEntries: [path] },
  );
  // delay: null - bez sztucznych przerw między klawiszami (szybsze i stabilniejsze testy).
  const user = userEvent.setup({ delay: null });
  const view = render(
    <Providers createEngine={() => new AudioEngine(audio.asElement())}>
      <RouterProvider router={router} />
    </Providers>,
  );
  return { ...view, user, audio, router };
}

// Najpierw style globalne, potem komponenty: style modułów mogą wtedy nadpisywać style bazowe.
import '@fontsource-variable/inter';
import './styles/tokens.css';
import './styles/global.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';

const container = document.getElementById('root');
if (!container) throw new Error('Brak elementu #root w index.html');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import { useEffect, useEffectEvent } from 'react';
import { useNavigate } from 'react-router';
import { useDialogs } from '../context/DialogContext';
import { usePlayerControls, usePlayerState } from '../context/PlayerContext';
import { useUI } from '../context/UIContext';
import { useTrackActions } from './useTrackActions';

const TEXT_INPUTS =
  'input:not([type="range"]):not([type="radio"]):not([type="checkbox"]), textarea, select, [contenteditable="true"]';
// Na tych elementach Spacja i strzałki mają własne znaczenie (np. kliknięcie przycisku, ruch suwaka).
const KEY_CONSUMERS = 'button, a[href], summary, input, [role="menuitem"], [role="switch"], [role="slider"]';

/** Globalne skróty klawiaturowe. Lista skrótów: hooks/shortcuts.ts. */
export function useKeyboardShortcuts(): void {
  const controls = usePlayerControls();
  const { currentTrack } = usePlayerState();
  const { toggleLike } = useTrackActions();
  const { toggleQueue } = useUI();
  const { openShortcuts } = useDialogs();
  const navigate = useNavigate();

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (target?.closest(TEXT_INPUTS)) return;
    // Gdy otwarte jest okno dialogowe, skróty nie działają w tle.
    if (document.querySelector('dialog[open]')) return;
    const onConsumer = Boolean(target?.closest(KEY_CONSUMERS));

    const handled = (() => {
      switch (event.key) {
        case ' ':
          if (onConsumer) return false;
          controls.togglePlay();
          return true;
        case 'ArrowRight':
          if (onConsumer) return false;
          if (event.shiftKey) controls.next();
          else controls.seekBy(5);
          return true;
        case 'ArrowLeft':
          if (onConsumer) return false;
          if (event.shiftKey) controls.previous();
          else controls.seekBy(-5);
          return true;
        case 'ArrowUp':
          if (!event.shiftKey || onConsumer) return false;
          controls.changeVolumeBy(0.1);
          return true;
        case 'ArrowDown':
          if (!event.shiftKey || onConsumer) return false;
          controls.changeVolumeBy(-0.1);
          return true;
        case '/':
          navigate('/search');
          return true;
        case '?':
          openShortcuts();
          return true;
      }
      switch (event.key.toLowerCase()) {
        case 'm':
          controls.toggleMute();
          return true;
        case 's':
          controls.toggleShuffle();
          return true;
        case 'r':
          controls.cycleRepeat();
          return true;
        case 'q':
          toggleQueue();
          return true;
        case 'l':
          if (currentTrack) toggleLike(currentTrack);
          return true;
        default:
          return false;
      }
    })();
    if (handled) event.preventDefault();
  });

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}

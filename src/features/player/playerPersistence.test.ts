import { describe, expect, it } from 'vitest';
import { parsePrefs, parseSavedQueue, restorePlayerState } from './playerPersistence';

describe('playerPersistence', () => {
  it('odczytuje preferencje i poprawia błędne wartości', () => {
    expect(parsePrefs({ volume: 3, muted: 'tak', shuffle: true, repeat: 'zawsze' })).toEqual({
      volume: 1,
      muted: false,
      shuffle: true,
      repeat: 'off',
    });
    expect(parsePrefs('zepsute')).toBeNull();
  });

  it('przywraca kolejkę bez automatycznego odtwarzania i z zapamiętaną pozycją', () => {
    const saved = parseSavedQueue({
      queue: [
        { uid: 'q1', trackId: 'a', origin: 'context' },
        { uid: 'q2', trackId: 'b', origin: 'context' },
      ],
      currentIndex: 1,
      context: { type: 'album', id: 'x', title: 'Album', path: '/album/x' },
      position: 42,
    });
    const state = restorePlayerState(null, saved, () => true);
    expect(state.currentIndex).toBe(1);
    expect(state.status).toBe('paused');
    expect(state.wantsToPlay).toBe(false);
    expect(state.resumeAt).toBe(42);
  });

  it('pomija utwory, których już nie ma, i resetuje pozycję', () => {
    const saved = parseSavedQueue({
      queue: [
        { uid: 'q1', trackId: 'istnieje', origin: 'context' },
        { uid: 'q2', trackId: 'usuniety', origin: 'user' },
      ],
      currentIndex: 1,
      position: 30,
    });
    const state = restorePlayerState(null, saved, (id) => id === 'istnieje');
    expect(state.queue.map((entry) => entry.trackId)).toEqual(['istnieje']);
    expect(state.currentIndex).toBe(0);
    expect(state.resumeAt).toBe(0);
  });
});

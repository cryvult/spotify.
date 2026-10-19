import { describe, expect, it } from 'vitest';
import type { PlaybackContext, PlayerState, QueueEntry } from '../../types/player';
import {
  getCurrentEntry,
  getUpcoming,
  INITIAL_PLAYER_STATE,
  playerReducer,
  type PlayerAction,
} from './playerReducer';

const CONTEXT: PlaybackContext = {
  type: 'album',
  id: 'test-album',
  title: 'Album testowy',
  path: '/album/test-album',
};

function entries(ids: string[], origin: QueueEntry['origin'] = 'context'): QueueEntry[] {
  return ids.map((trackId, index) => ({ uid: `${origin}-${trackId}-${index}`, trackId, origin }));
}

function run(state: PlayerState, ...actions: PlayerAction[]): PlayerState {
  return actions.reduce(playerReducer, state);
}

function playing(ids: string[], startIndex = 0, extra: Partial<PlayerState> = {}): PlayerState {
  return run(
    { ...INITIAL_PLAYER_STATE, ...extra },
    { type: 'playList', entries: entries(ids), startIndex, context: CONTEXT, seed: 1 },
    { type: 'enginePlaying' },
  );
}

const currentTrackId = (state: PlayerState) => getCurrentEntry(state)?.trackId;

describe('playerReducer: odtwarzanie listy', () => {
  it('ustawia kolejkę, bieżący utwór i zamiar odtwarzania', () => {
    const state = run(INITIAL_PLAYER_STATE, {
      type: 'playList',
      entries: entries(['a', 'b', 'c']),
      startIndex: 1,
      context: CONTEXT,
      seed: 1,
    });
    expect(state.queue).toHaveLength(3);
    expect(currentTrackId(state)).toBe('b');
    expect(state.wantsToPlay).toBe(true);
    expect(state.status).toBe('loading');
    expect(state.context).toEqual(CONTEXT);
  });

  it('ignoruje pustą listę', () => {
    const state = run(INITIAL_PLAYER_STATE, {
      type: 'playList',
      entries: [],
      startIndex: 0,
      context: null,
      seed: 1,
    });
    expect(state).toBe(INITIAL_PLAYER_STATE);
  });

  it('w trybie losowym zaczyna od wybranego utworu i zachowuje pozostałe', () => {
    const state = run(INITIAL_PLAYER_STATE, {
      type: 'playList',
      entries: entries(['a', 'b', 'c', 'd', 'e']),
      startIndex: 2,
      context: CONTEXT,
      shuffle: true,
      seed: 99,
    });
    expect(state.shuffle).toBe(true);
    expect(currentTrackId(state)).toBe('c');
    expect(state.queue.map((entry) => entry.trackId).sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(state.originalQueue?.map((entry) => entry.trackId)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
});

describe('playerReducer: pauza i wznowienie', () => {
  it('przełącza odtwarzanie i pauzę', () => {
    const paused = run(playing(['a']), { type: 'togglePlay' });
    expect(paused.wantsToPlay).toBe(false);
    const resumed = run(paused, { type: 'enginePaused' }, { type: 'togglePlay' });
    expect(resumed.wantsToPlay).toBe(true);
  });

  it('nic nie robi bez załadowanej kolejki', () => {
    expect(run(INITIAL_PLAYER_STATE, { type: 'togglePlay' })).toBe(INITIAL_PLAYER_STATE);
  });

  it('po błędzie przycisk odtwarzania ponawia wczytanie utworu', () => {
    const failed = run(
      playing(['a']),
      { type: 'engineError', message: 'Błąd sieci' },
      { type: 'enginePaused' },
    );
    expect(failed.status).toBe('error');
    expect(failed.error).toBe('Błąd sieci');
    const retried = run(failed, { type: 'togglePlay' });
    expect(retried.status).toBe('loading');
    expect(retried.error).toBeNull();
    expect(retried.loadToken).toBe(failed.loadToken + 1);
  });

  it('zablokowane autoodtwarzanie zatrzymuje zamiar odtwarzania i ustawia flagę', () => {
    const blocked = run(playing(['a']), { type: 'playBlocked' });
    expect(blocked.wantsToPlay).toBe(false);
    expect(blocked.autoplayBlocked).toBe(true);
  });
});

describe('playerReducer: następny i poprzedni', () => {
  it('przechodzi do następnego utworu', () => {
    expect(currentTrackId(run(playing(['a', 'b', 'c']), { type: 'next', auto: true }))).toBe('b');
  });

  it('na końcu kolejki bez powtarzania zatrzymuje muzykę', () => {
    const end = run(playing(['a', 'b'], 1), { type: 'next', auto: true });
    expect(currentTrackId(end)).toBe('b');
    expect(end.wantsToPlay).toBe(false);
  });

  it('ręczne „Następny” na końcu wraca na początek i wstrzymuje', () => {
    const state = run(playing(['a', 'b'], 1), { type: 'next', auto: false });
    expect(currentTrackId(state)).toBe('a');
    expect(state.wantsToPlay).toBe(false);
  });

  it('powtarzanie kolejki zawija na początek', () => {
    const state = run(playing(['a', 'b'], 1, { repeat: 'all' }), { type: 'next', auto: true });
    expect(currentTrackId(state)).toBe('a');
    expect(state.wantsToPlay).toBe(true);
  });

  it('cofa do poprzedniego utworu albo zawija przy powtarzaniu', () => {
    expect(currentTrackId(run(playing(['a', 'b', 'c'], 2), { type: 'previous' }))).toBe('b');
    expect(currentTrackId(run(playing(['a', 'b', 'c'], 0, { repeat: 'all' }), { type: 'previous' }))).toBe(
      'c',
    );
  });

  it('przechodzi do wybranej pozycji kolejki', () => {
    const state = playing(['a', 'b', 'c']);
    const target = state.queue[2]!.uid;
    expect(currentTrackId(run(state, { type: 'jumpTo', uid: target }))).toBe('c');
  });
});

describe('playerReducer: kolejka', () => {
  it('„Dodaj do kolejki” wstawia po bieżącym i po wcześniej dodanych ręcznie', () => {
    const state = run(
      playing(['a', 'b', 'c']),
      { type: 'enqueue', entries: entries(['x'], 'user'), position: 'last' },
      { type: 'enqueue', entries: entries(['y'], 'user'), position: 'last' },
    );
    expect(state.queue.map((entry) => entry.trackId)).toEqual(['a', 'x', 'y', 'b', 'c']);
  });

  it('„Odtwórz jako następny” wstawia zaraz po bieżącym', () => {
    const state = run(
      playing(['a', 'b']),
      { type: 'enqueue', entries: entries(['x'], 'user'), position: 'last' },
      { type: 'enqueue', entries: entries(['n'], 'user'), position: 'next' },
    );
    expect(state.queue.map((entry) => entry.trackId)).toEqual(['a', 'n', 'x', 'b']);
  });

  it('dodanie do pustej kolejki przygotowuje utwór bez automatycznego grania', () => {
    const state = run(INITIAL_PLAYER_STATE, {
      type: 'enqueue',
      entries: entries(['x'], 'user'),
      position: 'last',
    });
    expect(currentTrackId(state)).toBe('x');
    expect(state.wantsToPlay).toBe(false);
  });

  it('usuwa pozycję i koryguje indeks bieżącego utworu', () => {
    const state = playing(['a', 'b', 'c'], 2);
    const removed = run(state, { type: 'remove', uid: state.queue[0]!.uid });
    expect(removed.queue.map((entry) => entry.trackId)).toEqual(['b', 'c']);
    expect(currentTrackId(removed)).toBe('c');
  });

  it('nie usuwa bieżącego utworu', () => {
    const state = playing(['a', 'b']);
    expect(run(state, { type: 'remove', uid: state.queue[0]!.uid })).toBe(state);
  });

  it('czyści utwory po bieżącym', () => {
    const state = run(playing(['a', 'b', 'c']), { type: 'clearUpcoming' });
    expect(getUpcoming(state)).toHaveLength(0);
    expect(currentTrackId(state)).toBe('a');
  });

  it('utwory dodane ręcznie zostają po uruchomieniu nowej listy', () => {
    const state = run(
      playing(['a', 'b']),
      { type: 'enqueue', entries: entries(['x'], 'user'), position: 'last' },
      { type: 'playList', entries: entries(['p', 'q']), startIndex: 0, context: CONTEXT, seed: 1 },
    );
    expect(state.queue.map((entry) => entry.trackId)).toEqual(['p', 'x', 'q']);
  });

  it('autoodtwarzanie dopisuje utwory i przechodzi do pierwszego z nich', () => {
    const context: PlaybackContext = { type: 'autoplay', id: null, title: 'Podobne', path: null };
    const state = run(playing(['a']), { type: 'appendAutoplay', entries: entries(['z']), context });
    expect(currentTrackId(state)).toBe('z');
    expect(state.context).toEqual(context);
  });
});

describe('playerReducer: tryby', () => {
  it('włączenie trybu losowego miesza tylko kolejne utwory, a wyłączenie przywraca kolejność', () => {
    const start = playing(['a', 'b', 'c', 'd', 'e', 'f'], 1);
    const shuffled = run(start, { type: 'toggleShuffle', seed: 5 });
    expect(shuffled.shuffle).toBe(true);
    expect(shuffled.queue.slice(0, 2).map((entry) => entry.trackId)).toEqual(['a', 'b']);
    expect(currentTrackId(shuffled)).toBe('b');
    const restored = run(shuffled, { type: 'toggleShuffle', seed: 5 });
    expect(restored.shuffle).toBe(false);
    expect(restored.queue.map((entry) => entry.trackId)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    expect(currentTrackId(restored)).toBe('b');
  });

  it('przełącza powtarzanie: wyłączone, kolejka, utwór', () => {
    const one = run(INITIAL_PLAYER_STATE, { type: 'cycleRepeat' }, { type: 'cycleRepeat' });
    expect(run(INITIAL_PLAYER_STATE, { type: 'cycleRepeat' }).repeat).toBe('all');
    expect(one.repeat).toBe('one');
    expect(run(one, { type: 'cycleRepeat' }).repeat).toBe('off');
  });

  it('ogranicza głośność do zakresu 0-1 i obsługuje wyciszenie', () => {
    expect(run(INITIAL_PLAYER_STATE, { type: 'setVolume', volume: 1.7 }).volume).toBe(1);
    expect(run(INITIAL_PLAYER_STATE, { type: 'setVolume', volume: -1 }).volume).toBe(0);
    const muted = run(INITIAL_PLAYER_STATE, { type: 'toggleMute' });
    expect(muted.muted).toBe(true);
    expect(run(muted, { type: 'setVolume', volume: 0.4 }).muted).toBe(false);
    const fromZero = run({ ...INITIAL_PLAYER_STATE, volume: 0 }, { type: 'toggleMute' });
    expect(fromZero.volume).toBe(0.5);
  });

  it('reset czyści kolejkę, ale zachowuje głośność', () => {
    const state = run(playing(['a', 'b'], 0, { volume: 0.3 }), { type: 'reset' });
    expect(state.queue).toHaveLength(0);
    expect(state.volume).toBe(0.3);
  });
});

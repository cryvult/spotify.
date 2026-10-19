import { describe, expect, it } from 'vitest';
import {
  EMPTY_LIBRARY,
  libraryReducer,
  MAX_RECENT,
  parseLibrary,
  type LibraryAction,
  type LibraryState,
} from './libraryReducer';

const NOW = '2026-10-18T12:00:00.000Z';
const LATER = '2026-10-18T13:00:00.000Z';

function run(state: LibraryState, ...actions: LibraryAction[]): LibraryState {
  return actions.reduce(libraryReducer, state);
}

const withPlaylist = run(EMPTY_LIBRARY, {
  type: 'createPlaylist',
  id: 'pl_1',
  title: '  Moja   playlista ',
  description: 'Opis',
  trackIds: ['a', 'b', 'a'],
  now: NOW,
});

describe('libraryReducer: playlisty', () => {
  it('tworzy playlistę z oczyszczoną nazwą i bez duplikatów', () => {
    const playlist = withPlaylist.playlists[0]!;
    expect(playlist.title).toBe('Moja playlista');
    expect(playlist.items.map((item) => item.trackId)).toEqual(['a', 'b']);
    expect(playlist.createdAt).toBe(NOW);
  });

  it('nie tworzy playlisty bez nazwy', () => {
    const state = run(EMPTY_LIBRARY, {
      type: 'createPlaylist',
      id: 'x',
      title: '   ',
      description: '',
      trackIds: [],
      now: NOW,
    });
    expect(state.playlists).toHaveLength(0);
  });

  it('edytuje nazwę i opis', () => {
    const state = run(withPlaylist, {
      type: 'updatePlaylist',
      id: 'pl_1',
      title: 'Nowa nazwa',
      description: 'Nowy opis',
      now: LATER,
    });
    expect(state.playlists[0]).toMatchObject({
      title: 'Nowa nazwa',
      description: 'Nowy opis',
      updatedAt: LATER,
    });
  });

  it('dodaje utwory, pomijając te, które już są na liście', () => {
    const state = run(withPlaylist, {
      type: 'addToPlaylist',
      playlistId: 'pl_1',
      trackIds: ['b', 'c'],
      now: LATER,
    });
    expect(state.playlists[0]!.items.map((item) => item.trackId)).toEqual(['a', 'b', 'c']);
  });

  it('usuwa utwór z playlisty', () => {
    const state = run(withPlaylist, {
      type: 'removeFromPlaylist',
      playlistId: 'pl_1',
      trackId: 'a',
      now: LATER,
    });
    expect(state.playlists[0]!.items.map((item) => item.trackId)).toEqual(['b']);
  });

  it('usuwa całą playlistę', () => {
    expect(run(withPlaylist, { type: 'deletePlaylist', id: 'pl_1' }).playlists).toHaveLength(0);
  });
});

describe('libraryReducer: ulubione i historia', () => {
  it('dodaje i usuwa polubienie', () => {
    const liked = run(EMPTY_LIBRARY, { type: 'setLiked', trackId: 'a', liked: true, addedAt: NOW });
    expect(liked.liked).toEqual([{ trackId: 'a', addedAt: NOW }]);
    expect(run(liked, { type: 'setLiked', trackId: 'a', liked: false, addedAt: NOW }).liked).toEqual([]);
  });

  it('nie dubluje polubienia i trzyma najnowsze na początku', () => {
    const state = run(
      EMPTY_LIBRARY,
      { type: 'setLiked', trackId: 'a', liked: true, addedAt: NOW },
      { type: 'setLiked', trackId: 'b', liked: true, addedAt: LATER },
      { type: 'setLiked', trackId: 'a', liked: true, addedAt: LATER },
    );
    expect(state.liked.map((entry) => entry.trackId)).toEqual(['b', 'a']);
  });

  it('zapisuje historię bez powtórzeń, z limitem długości', () => {
    let state = run(
      EMPTY_LIBRARY,
      { type: 'recordPlay', trackId: 'a', now: NOW },
      { type: 'recordPlay', trackId: 'b', now: NOW },
      { type: 'recordPlay', trackId: 'a', now: LATER },
    );
    expect(state.recent.map((entry) => entry.trackId)).toEqual(['a', 'b']);
    for (let i = 0; i < MAX_RECENT + 10; i++)
      state = run(state, { type: 'recordPlay', trackId: `t${i}`, now: NOW });
    expect(state.recent).toHaveLength(MAX_RECENT);
    expect(run(state, { type: 'clearRecent' }).recent).toEqual([]);
  });

  it('zapamiętuje ostatnie wyszukiwania bez duplikatów', () => {
    const state = run(
      EMPTY_LIBRARY,
      { type: 'addRecentSearch', query: 'lofi' },
      { type: 'addRecentSearch', query: 'house' },
      { type: 'addRecentSearch', query: 'LOFI' },
      { type: 'addRecentSearch', query: 'a' },
    );
    expect(state.recentSearches).toEqual(['LOFI', 'house']);
    expect(run(state, { type: 'removeRecentSearch', query: 'house' }).recentSearches).toEqual(['LOFI']);
  });
});

describe('parseLibrary', () => {
  it('odrzuca dane, które nie są obiektem', () => {
    expect(parseLibrary(null)).toBeNull();
    expect(parseLibrary('tekst')).toBeNull();
    expect(parseLibrary([1, 2])).toBeNull();
  });

  it('pomija uszkodzone wpisy i zachowuje poprawne', () => {
    const parsed = parseLibrary({
      playlists: [
        { id: 'ok', title: 'Dobra', items: [{ trackId: 'a', addedAt: NOW }, { trackId: 5 }] },
        { id: 'bez-nazwy', title: '' },
        'śmieci',
      ],
      liked: [{ trackId: 'a', addedAt: NOW }, { trackId: 1 }],
      recent: 'nie-tablica',
      recentSearches: ['lofi', 3],
    });
    expect(parsed?.playlists).toHaveLength(1);
    expect(parsed?.playlists[0]?.items).toEqual([{ trackId: 'a', addedAt: NOW }]);
    expect(parsed?.liked).toHaveLength(1);
    expect(parsed?.recent).toEqual([]);
    expect(parsed?.recentSearches).toEqual([]);
  });
});

import { describe, it, expect } from 'vitest';
import { serializeSyncState, deserializeSyncState, reducer, initialState } from '../../lib/state.js';

describe('Sync state serialization', () => {
  it('serializeSyncState picks only syncable fields', () => {
    const state = {
      ...initialState,
      currentSlide: 5,
      scores: [3, 7],
      revealState: { s005: 'revealed' },
      showScoreboard: true,
      muted: false,
      showShortcuts: true,
      show: { id: 'test' },
    };
    const synced = serializeSyncState(state);
    expect(synced).toEqual({
      slide: 5,
      scores: [3, 7],
      revealState: { s005: 'revealed' },
      scoreboard: true,
      muted: false,
    });
    expect(synced).not.toHaveProperty('showShortcuts');
    expect(synced).not.toHaveProperty('show');
  });

  it('deserializeSyncState produces reducer actions', () => {
    const syncData = { slide: 10, scores: [2, 4], revealState: { s010: 'revealed' }, scoreboard: true, muted: false };
    const actions = deserializeSyncState(syncData);
    expect(actions).toContainEqual({ type: 'GO_TO_SLIDE', payload: 10 });
    expect(actions).toContainEqual({ type: 'SET_SCORES', payload: [2, 4] });
    expect(actions).toContainEqual({ type: 'SET_REVEAL_STATE', payload: { s010: 'revealed' } });
    expect(actions).toContainEqual({ type: 'SET_SCOREBOARD', payload: true });
    expect(actions).toContainEqual({ type: 'SET_MUTED', payload: false });
  });
});

describe('Sync reducer actions', () => {
  it('SET_SCORES sets both scores', () => {
    const state = { ...initialState, show: { sections: [{ slides: [{ id: 's001' }] }] }, scores: [0, 0] };
    const next = reducer(state, { type: 'SET_SCORES', payload: [5, 3] });
    expect(next.scores).toEqual([5, 3]);
  });

  it('SET_REVEAL_STATE replaces reveal state', () => {
    const state = { ...initialState, show: { sections: [{ slides: [{ id: 's001' }] }] }, revealState: {} };
    const next = reducer(state, { type: 'SET_REVEAL_STATE', payload: { s005: 'revealed' } });
    expect(next.revealState).toEqual({ s005: 'revealed' });
  });

  it('SET_SCOREBOARD sets scoreboard visibility', () => {
    const state = { ...initialState, show: { sections: [{ slides: [{ id: 's001' }] }] }, showScoreboard: false };
    const next = reducer(state, { type: 'SET_SCOREBOARD', payload: true });
    expect(next.showScoreboard).toBe(true);
  });

  it('SET_MUTED sets muted state', () => {
    const state = { ...initialState, show: { sections: [{ slides: [{ id: 's001' }] }] }, muted: true };
    const next = reducer(state, { type: 'SET_MUTED', payload: false });
    expect(next.muted).toBe(false);
  });
});

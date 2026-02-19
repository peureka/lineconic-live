import { describe, it, expect } from 'vitest';
import { reducer, initialState, flattenSlides, slideToSection, getSectionStartIndex } from '../../lib/state.js';

// Minimal test show
const testShow = {
  id: 'test',
  name: 'TEST SHOW',
  sections: [
    {
      id: 'sec-a', name: 'SECTION A',
      slides: [
        { id: 's001', type: 'attract', content: { primary: 'L' }, reveal_state: 'hidden', team: 'neutral', timer_seconds: null, host_notes: null, points: null },
        { id: 's002', type: 'fishbowl', content: { primary: 'RED FLAG' }, reveal_state: 'hidden', team: 'neutral', timer_seconds: null, host_notes: null, points: null },
      ],
    },
    {
      id: 'sec-b', name: 'SECTION B',
      slides: [
        { id: 's003', type: 'source_q', content: { primary: 'DID I STUTTER?', answer: 'The Office' }, reveal_state: 'hidden', team: 'neutral', timer_seconds: 30, host_notes: null, points: null },
        { id: 's004', type: 'acronym_q', content: { primary: 'I.A.K.', answer: 'I AM KENOUGH', source: 'Barbie' }, reveal_state: 'hidden', team: 'neutral', timer_seconds: 30, host_notes: null, points: null },
        { id: 's005', type: 'score', content: { primary: 'ROUND COMPLETE' }, reveal_state: 'hidden', team: 'neutral', timer_seconds: null, host_notes: null, points: null },
      ],
    },
  ],
};

describe('flattenSlides', () => {
  it('flattens nested sections into a single array', () => {
    const flat = flattenSlides(testShow);
    expect(flat.length).toBe(5);
    expect(flat[0].id).toBe('s001');
    expect(flat[4].id).toBe('s005');
  });
});

describe('slideToSection', () => {
  it('returns the section index for a given flat slide index', () => {
    expect(slideToSection(testShow, 0)).toBe(0); // s001 in SECTION A
    expect(slideToSection(testShow, 1)).toBe(0); // s002 in SECTION A
    expect(slideToSection(testShow, 2)).toBe(1); // s003 in SECTION B
    expect(slideToSection(testShow, 4)).toBe(1); // s005 in SECTION B
  });
});

describe('getSectionStartIndex', () => {
  it('returns the flat index of the first slide in a section', () => {
    expect(getSectionStartIndex(testShow, 0)).toBe(0);
    expect(getSectionStartIndex(testShow, 1)).toBe(2);
  });
});

describe('reducer — navigation', () => {
  const state = { ...initialState, show: testShow, currentSlide: 0 };

  it('NEXT_SLIDE increments slide index', () => {
    const next = reducer(state, { type: 'NEXT_SLIDE' });
    expect(next.currentSlide).toBe(1);
  });

  it('NEXT_SLIDE does not go past last slide', () => {
    const atEnd = { ...state, currentSlide: 4 };
    const next = reducer(atEnd, { type: 'NEXT_SLIDE' });
    expect(next.currentSlide).toBe(4);
  });

  it('PREV_SLIDE decrements slide index', () => {
    const at2 = { ...state, currentSlide: 2 };
    const prev = reducer(at2, { type: 'PREV_SLIDE' });
    expect(prev.currentSlide).toBe(1);
  });

  it('PREV_SLIDE does not go below 0', () => {
    const prev = reducer(state, { type: 'PREV_SLIDE' });
    expect(prev.currentSlide).toBe(0);
  });

  it('JUMP_SECTION jumps to first slide of a section', () => {
    const jumped = reducer(state, { type: 'JUMP_SECTION', payload: 1 });
    expect(jumped.currentSlide).toBe(2);
  });

  it('GO_TO_SLIDE goes to exact slide index', () => {
    const jumped = reducer(state, { type: 'GO_TO_SLIDE', payload: 3 });
    expect(jumped.currentSlide).toBe(3);
  });

  it('GO_TO_SLIDE clamps to valid range', () => {
    const jumped = reducer(state, { type: 'GO_TO_SLIDE', payload: 999 });
    expect(jumped.currentSlide).toBe(4);
  });
});

describe('reducer — scoring', () => {
  const state = { ...initialState, show: testShow, scores: [0, 0] };

  it('SCORE_CYAN +1 increments cyan score', () => {
    const next = reducer(state, { type: 'SCORE_CYAN', payload: 1 });
    expect(next.scores).toEqual([1, 0]);
  });

  it('SCORE_CYAN -1 decrements cyan score', () => {
    const at5 = { ...state, scores: [5, 3] };
    const next = reducer(at5, { type: 'SCORE_CYAN', payload: -1 });
    expect(next.scores).toEqual([4, 3]);
  });

  it('SCORE_PINK +1 increments pink score', () => {
    const next = reducer(state, { type: 'SCORE_PINK', payload: 1 });
    expect(next.scores).toEqual([0, 1]);
  });

  it('scores do not go below 0', () => {
    const next = reducer(state, { type: 'SCORE_CYAN', payload: -1 });
    expect(next.scores).toEqual([0, 0]);
  });
});

describe('reducer — reveal', () => {
  const state = { ...initialState, show: testShow, currentSlide: 2, revealState: {} };

  it('TOGGLE_REVEAL reveals a hidden slide', () => {
    const next = reducer(state, { type: 'TOGGLE_REVEAL' });
    expect(next.revealState['s003']).toBe('revealed');
  });

  it('TOGGLE_REVEAL hides a revealed slide', () => {
    const revealed = { ...state, revealState: { s003: 'revealed' } };
    const next = reducer(revealed, { type: 'TOGGLE_REVEAL' });
    expect(next.revealState['s003']).toBe('hidden');
  });
});

describe('reducer — toggles', () => {
  const state = { ...initialState, show: testShow };

  it('TOGGLE_SCOREBOARD flips showScoreboard', () => {
    expect(reducer(state, { type: 'TOGGLE_SCOREBOARD' }).showScoreboard).toBe(true);
    expect(reducer({ ...state, showScoreboard: true }, { type: 'TOGGLE_SCOREBOARD' }).showScoreboard).toBe(false);
  });

  it('TOGGLE_SHORTCUTS flips showShortcuts', () => {
    expect(reducer(state, { type: 'TOGGLE_SHORTCUTS' }).showShortcuts).toBe(true);
  });

  it('TOGGLE_MUTE flips muted', () => {
    expect(reducer(state, { type: 'TOGGLE_MUTE' }).muted).toBe(false);
  });

  it('CLOSE_OVERLAYS closes all overlays', () => {
    const open = { ...state, showShortcuts: true, showHostPanel: true };
    const closed = reducer(open, { type: 'CLOSE_OVERLAYS' });
    expect(closed.showShortcuts).toBe(false);
    expect(closed.showHostPanel).toBe(false);
  });

  it('INCREMENT_RECEIPTS increments receipt counter', () => {
    const next = reducer(state, { type: 'INCREMENT_RECEIPTS' });
    expect(next.receipts).toBe(1);
  });
});

describe('reducer — SET_SHOW loads a show', () => {
  it('sets the show and resets slide to 0', () => {
    const next = reducer(initialState, { type: 'SET_SHOW', payload: testShow });
    expect(next.show).toBe(testShow);
    expect(next.currentSlide).toBe(0);
  });
});

/**
 * App state — pure reducer + helpers.
 * No side effects. No DOM. No Firebase.
 */

export const initialState = {
  show: null,
  currentSlide: 0,
  scores: [0, 0],
  revealState: {},
  showScoreboard: false,
  showShortcuts: false,
  showHostPanel: false,
  muted: true,
  receipts: 0,
};

/**
 * Flatten all slides across all sections into a single array.
 */
export function flattenSlides(show) {
  if (!show) return [];
  return show.sections.flatMap(s => s.slides);
}

/**
 * Return the section index containing a given flat slide index.
 */
export function slideToSection(show, flatIndex) {
  let count = 0;
  for (let i = 0; i < show.sections.length; i++) {
    count += show.sections[i].slides.length;
    if (flatIndex < count) return i;
  }
  return show.sections.length - 1;
}

/**
 * Return the flat index of the first slide in a given section.
 */
export function getSectionStartIndex(show, sectionIndex) {
  let count = 0;
  for (let i = 0; i < sectionIndex; i++) {
    count += show.sections[i].slides.length;
  }
  return count;
}

export function reducer(state, action) {
  const flat = state.show ? flattenSlides(state.show) : [];
  const maxSlide = Math.max(0, flat.length - 1);

  switch (action.type) {
    case 'NEXT_SLIDE':
      return { ...state, currentSlide: Math.min(state.currentSlide + 1, maxSlide) };

    case 'PREV_SLIDE':
      return { ...state, currentSlide: Math.max(state.currentSlide - 1, 0) };

    case 'JUMP_SECTION': {
      const idx = getSectionStartIndex(state.show, action.payload);
      return { ...state, currentSlide: Math.min(idx, maxSlide) };
    }

    case 'GO_TO_SLIDE':
      return { ...state, currentSlide: Math.max(0, Math.min(action.payload, maxSlide)) };

    case 'SCORE_CYAN': {
      const [cyan, pink] = state.scores;
      return { ...state, scores: [Math.max(0, cyan + action.payload), pink] };
    }

    case 'SCORE_PINK': {
      const [cyan, pink] = state.scores;
      return { ...state, scores: [cyan, Math.max(0, pink + action.payload)] };
    }

    case 'TOGGLE_REVEAL': {
      const slide = flat[state.currentSlide];
      if (!slide) return state;
      const current = state.revealState[slide.id] || 'hidden';
      return {
        ...state,
        revealState: {
          ...state.revealState,
          [slide.id]: current === 'hidden' ? 'revealed' : 'hidden',
        },
      };
    }

    case 'TOGGLE_SCOREBOARD':
      return { ...state, showScoreboard: !state.showScoreboard };

    case 'TOGGLE_SHORTCUTS':
      return { ...state, showShortcuts: !state.showShortcuts };

    case 'TOGGLE_MUTE':
      return { ...state, muted: !state.muted };

    case 'CLOSE_OVERLAYS':
      return { ...state, showShortcuts: false, showHostPanel: false };

    case 'INCREMENT_RECEIPTS':
      return { ...state, receipts: state.receipts + 1 };

    case 'SET_SHOW':
      return { ...state, show: action.payload, currentSlide: 0 };

    case 'SET_SCORES': return { ...state, scores: action.payload };
    case 'SET_REVEAL_STATE': return { ...state, revealState: action.payload };
    case 'SET_SCOREBOARD': return { ...state, showScoreboard: action.payload };
    case 'SET_MUTED': return { ...state, muted: action.payload };

    default:
      return state;
  }
}

export function serializeSyncState(state) {
  return {
    slide: state.currentSlide,
    scores: state.scores,
    revealState: state.revealState,
    scoreboard: state.showScoreboard,
    muted: state.muted,
  };
}

export function deserializeSyncState(syncData) {
  return [
    { type: 'GO_TO_SLIDE', payload: syncData.slide },
    { type: 'SET_SCORES', payload: syncData.scores },
    { type: 'SET_REVEAL_STATE', payload: syncData.revealState },
    { type: 'SET_SCOREBOARD', payload: syncData.scoreboard },
    { type: 'SET_MUTED', payload: syncData.muted },
  ];
}

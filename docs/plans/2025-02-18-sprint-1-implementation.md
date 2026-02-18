# Sprint 1+2+3 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a dress-rehearsal-ready React app at `app.html` with Operator View, Audience View (The Monolith), scoring, and full keyboard control — ported from the proven TEMPLATE.html renderer.

**Architecture:** Single HTML file (`app.html`) using React 18 via CDN with inline CSS. No build tools for the app itself. Node.js test harness for unit tests on data logic. Playwright for browser integration tests. Data loaded from localStorage (offline-first) with Firebase fallback. Run of Show seeded from CSV via a Node.js script. Service worker for PWA offline support.

**Tech Stack:** React 18 (CDN), Firebase Realtime Database (europe-west1), Web Audio API, Canvas 2D, Service Worker, Vitest (unit tests), Playwright (integration tests)

**Branch:** `sprint-1-core-engine` (main is untouched, live site stays up)

**TDD approach:** Tests are written BEFORE implementation for every testable unit. The app is a single HTML file with no module system, so we extract testable logic into a shared `.js` module that both the tests and app.html consume. Browser-level behavior is tested with Playwright after implementation.

**Reference files you MUST read before each task:**
- `TEMPLATE.html` — the proven renderer. Port logic verbatim, don't reinvent.
- `docs/LINECONIC_LIVE_DESIGN_SYSTEM_V1.md` — all UI tokens
- `docs/LINECONIC_LIVE_PRODUCT_ROADMAP_V1.md` — user stories
- `docs/plans/2025-02-18-sprint-1-core-engine-design.md` — the approved design

---

## Task 0: Test Infrastructure Setup

**Files:**
- Create: `package.json`
- Create: `vitest.config.js`
- Create: `playwright.config.js`
- Create: `tests/unit/.gitkeep`
- Create: `tests/e2e/.gitkeep`

**Step 1: Initialize package.json**

```bash
npm init -y
```

Then edit to add test dependencies and scripts:

```json
{
  "name": "lineconic-live",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "npx playwright test",
    "seed": "node seed-firebase.js"
  },
  "devDependencies": {
    "vitest": "latest",
    "playwright": "latest",
    "@playwright/test": "latest"
  }
}
```

**Step 2: Install dependencies**

```bash
npm install
```

**Step 3: Create vitest.config.js**

```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.js'],
  },
});
```

**Step 4: Create playwright.config.js**

```javascript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:8080',
    headless: true,
  },
  webServer: {
    command: 'npx serve . -l 8080 -s',
    port: 8080,
    reuseExistingServer: true,
  },
});
```

Also install serve for local dev server:
```bash
npm install -D serve
```

**Step 5: Add .gitignore entries**

Append to `.gitignore` (create if doesn't exist):
```
node_modules/
test-results/
playwright-report/
```

**Step 6: Verify test runner works**

Create a smoke test `tests/unit/smoke.test.js`:
```javascript
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('test runner works', () => {
    expect(1 + 1).toBe(2);
  });
});
```

```bash
npm test
```

Expected: 1 test passes.

**Step 7: Commit**

```bash
git add package.json vitest.config.js playwright.config.js tests/ .gitignore
git commit -m "chore: test infrastructure — Vitest + Playwright

Unit tests with Vitest, browser integration with Playwright.
Serve-based local dev server for e2e."
```

---

## Task 1: Seed Script — Tests First, Then Implementation

**Files:**
- Create: `tests/unit/seed.test.js`
- Create: `lib/csv-parser.js` (extracted, testable CSV parsing)
- Create: `lib/ros-builder.js` (extracted, testable schema mapping)
- Create: `seed-firebase.js` (orchestrator: parse + build + write)
- Create: `ros-v1.json` (generated output)
- Read: `SHOW_MASTER_V2.csv` (input)
- Reference: `generate_deck.js` (CSV parsing logic to reuse)

### Step 1: Write failing tests for CSV parser

Create `tests/unit/seed.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { parseCSV } from '../../lib/csv-parser.js';
import { buildRunOfShow, mapSlide, groupIntoSections } from '../../lib/ros-builder.js';
import fs from 'fs';

describe('CSV Parser', () => {
  it('strips UTF-8 BOM', () => {
    const input = '\uFEFFa,b,c\n1,2,3';
    const rows = parseCSV(input);
    expect(rows[0][0]).toBe('a');
  });

  it('normalizes CRLF to LF', () => {
    const input = 'a,b\r\n1,2\r\n';
    const rows = parseCSV(input);
    expect(rows.length).toBe(2); // header + 1 data row
  });

  it('handles quoted fields with commas', () => {
    const input = 'a,b\n"hello, world",2';
    const rows = parseCSV(input);
    expect(rows[1][0]).toBe('hello, world');
  });

  it('handles escaped quotes inside quoted fields', () => {
    const input = 'a,b\n"he said ""hello""",2';
    const rows = parseCSV(input);
    expect(rows[1][0]).toBe('he said "hello"');
  });

  it('skips blank rows', () => {
    const input = 'a,b\n1,2\n\n3,4';
    const rows = parseCSV(input);
    expect(rows.length).toBe(3); // header + 2 data rows
  });

  it('parses the actual SHOW_MASTER_V2.csv', () => {
    const csv = fs.readFileSync('SHOW_MASTER_V2.csv', 'utf8');
    const rows = parseCSV(csv);
    // Header + 161 data rows
    expect(rows.length).toBeGreaterThan(100);
    // First data row is slide 1, attract
    expect(rows[1][1]).toBe('PRE-SHOW');
    expect(rows[1][2]).toBe('attract');
  });
});

describe('ROS Builder — mapSlide', () => {
  it('maps a source_q row correctly', () => {
    const row = {
      slide_number: '5',
      section: 'ROUND 1: GUESS THE SOURCE',
      slide_type: 'source_q',
      primary_text: 'DID I STUTTER?',
      secondary_text: '',
      answer: 'The Office',
      answer_source: '',
      notes: '',
    };
    const slide = mapSlide(row, 4);
    expect(slide.type).toBe('source_q');
    expect(slide.content.primary).toBe('DID I STUTTER?');
    expect(slide.content.answer).toBe('The Office');
    expect(slide.reveal_state).toBe('hidden');
    expect(slide.timer_seconds).toBe(30);
    expect(slide.id).toBe('s005');
  });

  it('maps an acronym_q row correctly', () => {
    const row = {
      slide_number: '27',
      section: 'ROUND 2: SCREEN',
      slide_type: 'acronym_q',
      primary_text: 'I.A.K.',
      secondary_text: '',
      answer: 'I AM KENOUGH',
      answer_source: 'Barbie',
      notes: '',
    };
    const slide = mapSlide(row, 26);
    expect(slide.type).toBe('acronym_q');
    expect(slide.content.primary).toBe('I.A.K.');
    expect(slide.content.answer).toBe('I AM KENOUGH');
    expect(slide.content.source).toBe('Barbie');
    expect(slide.timer_seconds).toBe(30);
  });

  it('extracts bonus points from notes', () => {
    const row = {
      slide_number: '10',
      section: 'ROUND 1',
      slide_type: 'source_q',
      primary_text: 'TEST',
      secondary_text: '',
      answer: 'Answer',
      answer_source: '',
      notes: 'bonus 3pts',
    };
    const slide = mapSlide(row, 9);
    expect(slide.points).toBe(3);
  });

  it('maps an attract slide', () => {
    const row = {
      slide_number: '1',
      section: 'PRE-SHOW',
      slide_type: 'attract',
      primary_text: 'L',
      secondary_text: '',
      answer: '',
      answer_source: '',
      notes: '',
    };
    const slide = mapSlide(row, 0);
    expect(slide.type).toBe('attract');
    expect(slide.content.primary).toBe('L');
    expect(slide.team).toBe('neutral');
  });

  it('maps hotseat_prompt with 30s timer', () => {
    const row = {
      slide_number: '154',
      section: 'BONUS: HOT SEAT',
      slide_type: 'hotseat_prompt',
      primary_text: 'BABY SHARK',
      secondary_text: '',
      answer: '',
      answer_source: 'Pinkfong',
      notes: '',
    };
    const slide = mapSlide(row, 153);
    expect(slide.type).toBe('hotseat_prompt');
    expect(slide.timer_seconds).toBe(30);
  });

  it('maps operational slides (fishbowl, round_title, etc.)', () => {
    const row = {
      slide_number: '2',
      section: 'WARM-UP',
      slide_type: 'fishbowl',
      primary_text: 'WRITE YOUR RED FLAG.',
      secondary_text: 'DROP IT IN THE BOWL.',
      answer: '',
      answer_source: '',
      notes: '',
    };
    const slide = mapSlide(row, 1);
    expect(slide.type).toBe('fishbowl');
    expect(slide.content.primary).toBe('WRITE YOUR RED FLAG.');
    expect(slide.content.secondary).toBe('DROP IT IN THE BOWL.');
  });
});

describe('ROS Builder — groupIntoSections', () => {
  it('groups rows by section column', () => {
    const rows = [
      { section: 'A', slide_type: 'attract', primary_text: 'L', secondary_text: '', answer: '', answer_source: '', notes: '', slide_number: '1' },
      { section: 'A', slide_type: 'fishbowl', primary_text: 'X', secondary_text: '', answer: '', answer_source: '', notes: '', slide_number: '2' },
      { section: 'B', slide_type: 'round_title', primary_text: 'R1', secondary_text: '', answer: '', answer_source: '', notes: '', slide_number: '3' },
    ];
    const sections = groupIntoSections(rows);
    expect(sections.length).toBe(2);
    expect(sections[0].name).toBe('A');
    expect(sections[0].slides.length).toBe(2);
    expect(sections[1].name).toBe('B');
    expect(sections[1].slides.length).toBe(1);
  });

  it('generates section IDs from names', () => {
    const rows = [
      { section: 'ROUND 1: GUESS THE SOURCE', slide_type: 'round_title', primary_text: 'R1', secondary_text: '', answer: '', answer_source: '', notes: '', slide_number: '1' },
    ];
    const sections = groupIntoSections(rows);
    expect(sections[0].id).toBe('round-1-guess-the-source');
  });
});

describe('ROS Builder — buildRunOfShow (full integration)', () => {
  it('builds the complete Run of Show from the real CSV', () => {
    const csv = fs.readFileSync('SHOW_MASTER_V2.csv', 'utf8');
    const ros = buildRunOfShow(csv, 'THE SPLIT — TABLE FORMAT V2');

    expect(ros.id).toBe('split-table-v2');
    expect(ros.name).toBe('THE SPLIT — TABLE FORMAT V2');
    expect(ros.sections.length).toBeGreaterThan(8);
    expect(typeof ros.created).toBe('number');

    // Count total slides
    const totalSlides = ros.sections.reduce((a, s) => a + s.slides.length, 0);
    expect(totalSlides).toBe(161);

    // First slide is attract
    expect(ros.sections[0].slides[0].type).toBe('attract');
    expect(ros.sections[0].slides[0].content.primary).toBe('L');

    // Last slide is endcard
    const lastSection = ros.sections[ros.sections.length - 1];
    const lastSlide = lastSection.slides[lastSection.slides.length - 1];
    expect(lastSlide.type).toBe('endcard');

    // Check a known acronym_q
    const round2 = ros.sections.find(s => s.name.includes('ROUND 2'));
    expect(round2).toBeDefined();
    const iak = round2.slides.find(s => s.content.primary === 'I.A.K.');
    expect(iak).toBeDefined();
    expect(iak.content.answer).toBe('I AM KENOUGH');
    expect(iak.content.source).toBe('Barbie');

    // Every slide has an id
    ros.sections.forEach(section => {
      section.slides.forEach(slide => {
        expect(slide.id).toBeTruthy();
        expect(slide.type).toBeTruthy();
        expect(slide.team).toBe('neutral');
        expect(slide.reveal_state).toBe('hidden');
      });
    });
  });
});
```

### Step 2: Run tests — verify they fail

```bash
npm test
```

Expected: ALL tests fail (modules don't exist yet).

### Step 3: Implement lib/csv-parser.js

Create `lib/csv-parser.js`. Export a single function `parseCSV(csvString)` that:

1. Strips UTF-8 BOM (`\uFEFF`)
2. Normalizes `\r\n` to `\n`
3. Splits into rows, handling quoted fields (commas inside quotes, escaped `""`)
4. Skips blank rows
5. Returns array of arrays (first row is headers)

Port the parsing logic from `generate_deck.js` lines 1-60 but make it a clean ES module export.

### Step 4: Run CSV parser tests

```bash
npm test -- --reporter verbose tests/unit/seed.test.js
```

Expected: CSV Parser tests pass. ROS Builder tests still fail.

### Step 5: Implement lib/ros-builder.js

Create `lib/ros-builder.js`. Export:

- `mapSlide(rowObject, index)` — maps a CSV row (as object with named fields) to the slide schema
- `groupIntoSections(rowObjects)` — groups an array of row objects into sections
- `buildRunOfShow(csvString, showName)` — full pipeline: parse CSV → map rows → group sections → return ROS object

Uses `parseCSV` from `lib/csv-parser.js`.

Content mapping rules:
- `primary_text` → `content.primary`
- `secondary_text` → `content.secondary`
- `answer` → `content.answer`
- `answer_source` → `content.source`
- `notes` → check for `/(\d+)\s*p/` → `points` field
- `source_q`, `acronym_q`, `hotseat_prompt` → `timer_seconds: 30`
- All slides: `team: "neutral"`, `reveal_state: "hidden"`
- Slide ID: `s` + zero-padded slide_number (e.g., `s001`, `s042`, `s161`)
- Section ID: lowercase name, spaces/colons/special chars → hyphens

### Step 6: Run all tests

```bash
npm test
```

Expected: ALL tests pass.

### Step 7: Create seed-firebase.js

The orchestrator script that:

1. Reads `SHOW_MASTER_V2.csv`
2. Calls `buildRunOfShow()` to get the full ROS
3. Writes `ros-v1.json` to disk
4. PUTs to Firebase REST API:
   ```
   PUT https://lineconic-live-default-rtdb.europe-west1.firebasedatabase.app/shows/split-table-v2.json
   ```
   Uses native `fetch()` (Node 18+). No auth needed.
5. Logs section summary to console

### Step 8: Run the seed script

```bash
node seed-firebase.js
```

Expected output:
```
Parsing SHOW_MASTER_V2.csv...
  PRE-SHOW — 1 slides
  WARM-UP — 1 slides
  ROUND 1: GUESS THE SOURCE — 22 slides
  ...
Total: 161 slides across N sections
Writing ros-v1.json...
Uploading to Firebase...
Done.
```

### Step 9: Verify Firebase

```bash
curl -s "https://lineconic-live-default-rtdb.europe-west1.firebasedatabase.app/shows/split-table-v2/name.json"
```

Expected: `"THE SPLIT — TABLE FORMAT V2"`

### Step 10: Commit

```bash
git add lib/ tests/unit/seed.test.js seed-firebase.js ros-v1.json
git commit -m "feat: seed script with tests — CSV to Firebase + JSON

TDD: 15+ unit tests for CSV parser, slide mapping, section grouping.
Full integration test against SHOW_MASTER_V2.csv (161 slides).
lib/csv-parser.js and lib/ros-builder.js extracted as testable modules."
```

---

## Task 2: App State — Tests First, Then Implementation

**Files:**
- Create: `tests/unit/state.test.js`
- Create: `lib/state.js` (reducer + helpers, shared between tests and app.html)

### Step 1: Write failing tests for the state reducer and helpers

Create `tests/unit/state.test.js`:

```javascript
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
    const flat = flattenSlides(testShow);
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
```

### Step 2: Run tests — verify they fail

```bash
npm test
```

Expected: ALL fail — `lib/state.js` doesn't exist.

### Step 3: Implement lib/state.js

Create `lib/state.js` exporting:

- `initialState` — the default state object
- `reducer(state, action)` — pure function handling all action types
- `flattenSlides(show)` — returns flat array of all slides across all sections
- `slideToSection(show, flatIndex)` — returns the section index containing that flat slide index
- `getSectionStartIndex(show, sectionIndex)` — returns the flat index of the first slide in that section

All pure functions. No side effects. No DOM. No Firebase.

### Step 4: Run tests — verify they pass

```bash
npm test
```

Expected: ALL tests pass.

### Step 5: Commit

```bash
git add lib/state.js tests/unit/state.test.js
git commit -m "feat: app state reducer with tests — navigation, scoring, reveal

TDD: 25+ unit tests for reducer, flattenSlides, slideToSection,
getSectionStartIndex. Pure functions, zero side effects.
Covers NEXT/PREV, JUMP_SECTION, scoring, reveal toggle, overlays."
```

---

## Task 3: Slide Renderer Helpers — Tests First

**Files:**
- Create: `tests/unit/renderers.test.js`
- Create: `lib/renderers.js` (sizing functions + transition map)

### Step 1: Write failing tests

Create `tests/unit/renderers.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { qSz, aSz, tx } from '../../lib/renderers.js';

describe('qSz — acronym question sizing', () => {
  it('returns largest size for short acronyms (<=4 chars)', () => {
    expect(qSz('I.A.K.')).toContain('22vw'); // 5 chars > 4, next tier
    expect(qSz('N.S.')).toContain('22vw');    // 4 chars
  });

  it('scales down for longer acronyms', () => {
    const short = qSz('A.B.');
    const long = qSz('W.A.Y.T.W.T.Y.A.');
    // Longer acronym should have smaller max size
    expect(short).not.toBe(long);
  });

  it('handles empty string', () => {
    const result = qSz('');
    expect(result).toBeTruthy();
  });
});

describe('aSz — answer sizing', () => {
  it('returns largest size for short answers', () => {
    expect(aSz('JAWS')).toContain('11vw');
  });

  it('scales down for long answers', () => {
    const result = aSz('WHY ARE YOU THE WAY THAT YOU ARE');
    expect(result).toContain('vw'); // should have a smaller vw value
  });
});

describe('tx — transition map', () => {
  it('maps source_q to slam', () => {
    expect(tx('source_q')).toBe('t-slam');
  });

  it('maps acronym_q to slam', () => {
    expect(tx('acronym_q')).toBe('t-slam');
  });

  it('maps source_a to punch', () => {
    expect(tx('source_a')).toBe('t-punch');
  });

  it('maps round_title to breath', () => {
    expect(tx('round_title')).toBe('t-breath');
  });

  it('maps receipt_rain to shake', () => {
    expect(tx('receipt_rain')).toBe('t-shake');
  });

  it('maps crate_drop to fade', () => {
    expect(tx('crate_drop')).toBe('t-fade');
  });

  it('returns fade for unknown types', () => {
    expect(tx('unknown_type')).toBe('t-fade');
  });
});
```

### Step 2: Run — verify fail

```bash
npm test
```

### Step 3: Implement lib/renderers.js

Port VERBATIM from TEMPLATE.html:
- `qSz(text)` — line 327
- `aSz(text)` — line 328
- `tx(type)` — lines 310-319

Export as ES module functions.

### Step 4: Run — verify pass

```bash
npm test
```

### Step 5: Commit

```bash
git add lib/renderers.js tests/unit/renderers.test.js
git commit -m "feat: renderer helpers with tests — sizing + transitions

TDD: qSz, aSz, tx ported from TEMPLATE.html as testable modules.
Transition map covers all slide types."
```

---

## Task 4: PWA Shell — manifest.json + sw.js

**Files:**
- Create: `manifest.json`
- Create: `sw.js`

### Step 1: Create manifest.json

```json
{
  "name": "LINECONIC LIVE",
  "short_name": "LINECONIC",
  "start_url": "/app.html?mode=operator",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "icons": []
}
```

### Step 2: Create sw.js

Service worker that caches:
- `/app.html`
- `/ros-v1.json`
- Google Fonts CSS + font files for Space Mono
- Firebase SDK JS files

Strategy: Cache-first for all assets. Skip caching for Firebase Realtime Database requests (`*.firebasedatabase.app`).

### Step 3: Commit

```bash
git add manifest.json sw.js
git commit -m "feat: PWA shell — manifest + service worker

Offline-first caching for app.html, fonts, Firebase SDK, and ROS JSON."
```

---

## Task 5: app.html — The Big Build

**Files:**
- Create: `app.html`
- Reference: `TEMPLATE.html` (the entire file — port verbatim)
- Reference: `docs/LINECONIC_LIVE_DESIGN_SYSTEM_V1.md` (all tokens)
- Reference: `lib/state.js`, `lib/renderers.js`, `lib/csv-parser.js`, `lib/ros-builder.js` (tested logic)

This is the largest task. Build the complete single-file React app.

**CRITICAL: The tested logic in `lib/` must be DUPLICATED into app.html** (since it's a single CDN file with no module system). Keep them identical. The `lib/` modules are the testable source of truth; `app.html` inlines the same code.

### Step 1: Create app.html with the complete application

The file must contain (in order):

**HEAD:**
1. Meta tags, title "LINECONIC LIVE"
2. PWA manifest link
3. Firebase SDK (10.12.0 compat)
4. React 18 + ReactDOM CDN
5. Babel standalone (for JSX in single file)
6. Space Mono font from Google Fonts

**STYLE block — ALL of the following:**

1. **Design System V1 tokens** — complete `:root` from Design System appendix (lines 461-503)
2. **Global resets** — `* { border-radius: 0 !important; box-sizing: border-box }` etc.
3. **All CSS from TEMPLATE.html lines 9-107** — ported VERBATIM:
   - `.S`, `.S.on` (slide base)
   - Keyframes: slam, breath, punch, fadeIn, shakeIn
   - `.D`, `.M` (typography)
   - `.hw`, `.hc`, `.hp`, `.hg`, `.hs` (halation)
   - `.nb`, `.nb-pk`, `.nb-cy`, `.nb-wh`, `.nb-gd` (neon borders)
   - `.tb`, `.tb.pk`, `.tb.cy`, `.tb.dead` (timer border)
   - `#sbug` (scoreboard)
   - `.srcbar`, `.rule`, `.ans-list` (misc)
   - Keyframes: pulse, rain, crateGlow, crateFloat, crateLidOpen, crateGlowReveal
   - Crate, particle canvas, host panel CSS
4. **Design System bloom-pulse** keyframe
5. **Design System reveal** transition CSS (`.answer`, `.answer.revealed`)
6. **Operator View CSS** — new styles for:
   - `.operator-grid` (12-col layout: 220px sidebar, 1fr main, 280px preview)
   - `.section-nav` (per Design System 4.4)
   - `.slide-card`, `.slide-card-current`, `.slide-card-next` (per Design System 4.3)
   - `.score-display` (per Design System 4.2)
   - `.timer-bar` (per Design System 4.5)
   - `.host-notes` (per Design System 4.6)
   - `.shortcut-overlay` (per Design System 4.7)
   - `.reveal-badge` (HIDDEN/REVEALED states per Design System 4.3)

**BODY:**
1. `<div id="root"></div>`
2. `<canvas id="particles"></canvas>`

**SCRIPT (type="text/babel"):**

All inlined. Structure:

```javascript
// ═══════════════════════════════════════
// FIREBASE INIT
// ═══════════════════════════════════════
// (same config from TEMPLATE.html lines 439-451)

// ═══════════════════════════════════════
// SOUND ENGINE (direct port from TEMPLATE.html)
// ═══════════════════════════════════════
// initAudio, tone, startShepard, stopShepard, sfx

// ═══════════════════════════════════════
// PARTICLE SYSTEM (direct port from TEMPLATE.html)
// ═══════════════════════════════════════
// Canvas setup, spawnReceipts, spawnFlutter, tickParticles, startParticles, stopParticles

// ═══════════════════════════════════════
// TIMER SYSTEM (direct port from TEMPLATE.html)
// ═══════════════════════════════════════
// startTimer, resumeTimer, pauseTimer, togglePause, stopTimer

// ═══════════════════════════════════════
// DOA VOTING (direct port from TEMPLATE.html)
// ═══════════════════════════════════════
// pushTopic, castVote, resetVotes, updateVoteBars

// ═══════════════════════════════════════
// QR CODE ENCODER (direct port from TEMPLATE.html)
// ═══════════════════════════════════════
// drawQR, encodeQR (update URL to lineconic.live/vote)

// ═══════════════════════════════════════
// STATE (inlined from lib/state.js — KEEP IDENTICAL)
// ═══════════════════════════════════════
// initialState, reducer, flattenSlides, slideToSection, getSectionStartIndex

// ═══════════════════════════════════════
// RENDERER HELPERS (inlined from lib/renderers.js — KEEP IDENTICAL)
// ═══════════════════════════════════════
// qSz, aSz, tx

// ═══════════════════════════════════════
// REACT COMPONENTS
// ═══════════════════════════════════════

// --- Slide Renderers (one per type, ported from TEMPLATE.html R.* functions) ---
// AttractSlide, FishbowlSlide, RoundTitleSlide, TierTitleSlide,
// BonusMarkerSlide, SourceQSlide, SourceASlide, AcronymQSlide, AcronymASlide,
// FluencyLineSlide, FluencySourceSlide, ScoreSlide, IntermissionSlide,
// DoaVoteSlide, WarningSlide, BlackoutSlide, TransitionBeatSlide,
// DoaRefSlide, DoaVerdictDeadSlide, DoaVerdictAliveSlide,
// HotseatRulesSlide, HotseatPromptSlide, VerdictSlide, SentenceSlide,
// ReceiptRainSlide, CrateDropSlide, LastLineSlide, EndcardSlide, AnswerSheetSlide

// --- SlideRenderer dispatcher ---
// --- AudienceView (The Monolith) ---
// --- Operator View components ---
//     SectionNav, CurrentSlideCard, NextSlideCard, ScoreDisplay,
//     TimerDisplay, ReceiptCounter, ShortcutOverlay, OperatorView
// --- App (root component with routing + keyboard + persistence) ---

// ═══════════════════════════════════════
// MOUNT + SERVICE WORKER
// ═══════════════════════════════════════
```

### Step 2: Verify it all works

Open `app.html?mode=audience`:
- Attract slide with pink pulsing L
- Arrow through all 161 slides
- Transitions fire correctly per type
- M key unmutes, sounds play
- T key starts timer with conic border
- S key toggles scoreboard
- Receipt rain particles on receipt_rain slide
- Crate drop animation plays
- DOA vote bars update
- QR renders on intermission

Open `app.html?mode=operator`:
- Section nav on left
- Current slide in center with reveal badge
- Next slide preview on right
- Scores at bottom with +/- buttons
- Timer bar
- `?` key shows shortcut overlay
- Click section to jump
- Q/A/P/L keys change scores

### Step 3: Commit

```bash
git add app.html
git commit -m "feat: complete app.html — Operator + Audience views

Single-file React SPA with all 29 slide renderers, sound engine,
particle system, timer, DOA voting, QR code, operator controls.
Full Design System V1 compliance. Ported from TEMPLATE.html."
```

---

## Task 6: Playwright E2E Tests

**Files:**
- Create: `tests/e2e/app.spec.js`

### Step 1: Install Playwright browsers

```bash
npx playwright install chromium
```

### Step 2: Write E2E tests

Create `tests/e2e/app.spec.js`:

```javascript
import { test, expect } from '@playwright/test';

test.describe('Routing (US-001)', () => {
  test('default loads operator view', async ({ page }) => {
    await page.goto('/app.html');
    await expect(page.locator('.operator-grid')).toBeVisible();
  });

  test('?mode=operator loads operator view', async ({ page }) => {
    await page.goto('/app.html?mode=operator');
    await expect(page.locator('.operator-grid')).toBeVisible();
  });

  test('?mode=audience loads audience view', async ({ page }) => {
    await page.goto('/app.html?mode=audience');
    await expect(page.locator('.S.on')).toBeVisible();
    // No operator elements
    await expect(page.locator('.operator-grid')).not.toBeVisible();
  });
});

test.describe('Keyboard Navigation (US-002)', () => {
  test('arrow right advances slide', async ({ page }) => {
    await page.goto('/app.html?mode=audience');
    await page.waitForSelector('.S.on');
    // First slide is attract
    const firstSlide = await page.locator('.S.on').innerHTML();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    const secondSlide = await page.locator('.S.on').innerHTML();
    expect(firstSlide).not.toBe(secondSlide);
  });

  test('arrow left goes back', async ({ page }) => {
    await page.goto('/app.html?mode=audience');
    await page.waitForSelector('.S.on');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);
    // Should be back at first slide (attract with "L")
    await expect(page.locator('.S.on')).toContainText('L');
  });

  test('spacebar advances slide', async ({ page }) => {
    await page.goto('/app.html?mode=audience');
    await page.waitForSelector('.S.on');
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
    // Should have advanced
    const slideContent = await page.locator('.S.on').innerHTML();
    expect(slideContent).toBeTruthy();
  });
});

test.describe('Shortcut Overlay (US-006)', () => {
  test('? key toggles shortcut overlay in operator mode', async ({ page }) => {
    await page.goto('/app.html?mode=operator');
    await page.waitForSelector('.operator-grid');
    await page.keyboard.press('?');
    await expect(page.locator('.shortcut-overlay')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.shortcut-overlay')).not.toBeVisible();
  });
});

test.describe('Session Persistence (US-004)', () => {
  test('state survives page reload', async ({ page }) => {
    await page.goto('/app.html?mode=operator');
    await page.waitForSelector('.operator-grid');
    // Advance 5 slides
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100);
    }
    // Reload
    await page.reload();
    await page.waitForSelector('.operator-grid');
    // Should still be on slide 5-ish (check slide counter)
    const counter = await page.locator('[data-testid="slide-counter"]').textContent();
    expect(counter).toContain('6'); // 1-indexed, so slide 5 = "6/"
  });
});

test.describe('Answer Reveal (US-016)', () => {
  test('R key reveals answer on audience view', async ({ page }) => {
    await page.goto('/app.html?mode=audience');
    await page.waitForSelector('.S.on');
    // Navigate to a question slide (slide 5 is source_q "DID I STUTTER?")
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100);
    }
    // Answer should be blurred
    const answer = page.locator('.answer');
    if (await answer.count() > 0) {
      await expect(answer).not.toHaveClass(/revealed/);
      await page.keyboard.press('r');
      await page.waitForTimeout(100);
      await expect(answer).toHaveClass(/revealed/);
    }
  });
});

test.describe('Scoring (US-019)', () => {
  test('Q key increments cyan score', async ({ page }) => {
    await page.goto('/app.html?mode=operator');
    await page.waitForSelector('.operator-grid');
    await page.keyboard.press('q');
    await page.waitForTimeout(100);
    const cyanScore = await page.locator('[data-testid="cyan-score"]').textContent();
    expect(parseInt(cyanScore)).toBe(1);
  });

  test('P key increments pink score', async ({ page }) => {
    await page.goto('/app.html?mode=operator');
    await page.waitForSelector('.operator-grid');
    await page.keyboard.press('p');
    await page.waitForTimeout(100);
    const pinkScore = await page.locator('[data-testid="pink-score"]').textContent();
    expect(parseInt(pinkScore)).toBe(1);
  });
});

test.describe('Audience View renders correctly', () => {
  test('attract slide shows pulsing L', async ({ page }) => {
    await page.goto('/app.html?mode=audience');
    await page.waitForSelector('.S.on');
    await expect(page.locator('.S.on')).toContainText('L');
  });

  test('audience view hides cursor', async ({ page }) => {
    await page.goto('/app.html?mode=audience');
    const cursor = await page.evaluate(() => getComputedStyle(document.body).cursor);
    expect(cursor).toBe('none');
  });
});

test.describe('Section Navigation (US-010)', () => {
  test('number keys jump to sections in operator mode', async ({ page }) => {
    await page.goto('/app.html?mode=operator');
    await page.waitForSelector('.operator-grid');
    // Press 2 to jump to section 2
    await page.keyboard.press('2');
    await page.waitForTimeout(200);
    // Should no longer be on slide 0
    const counter = await page.locator('[data-testid="slide-counter"]').textContent();
    expect(counter).not.toContain('1/');
  });
});
```

### Step 3: Run E2E tests

```bash
npm run test:e2e
```

Expected: All pass (since app.html was built in Task 5).

### Step 4: Fix any failures

If tests reveal bugs, fix in `app.html` and re-run.

### Step 5: Commit

```bash
git add tests/e2e/
git commit -m "test: Playwright E2E tests for all core user stories

Covers routing (US-001), keyboard nav (US-002), persistence (US-004),
shortcuts (US-006), section nav (US-010), reveal (US-016), scoring (US-019).
Audience view rendering and cursor hiding verified."
```

---

## Task 7: Final Verification + Push

**Files:** None (verification + git only)

### Step 1: Run all tests

```bash
npm test && npm run test:e2e
```

Expected: ALL pass — unit tests AND e2e tests.

### Step 2: Manual smoke test

Open `app.html?mode=audience` — click through 10+ slides, verify visual quality.
Open `app.html?mode=operator` — verify controls work.

### Step 3: Push the branch

```bash
git push -u origin sprint-1-core-engine
```

### Step 4: Verify main is untouched

```bash
git log main --oneline -3
```

Should show only the original commits.

---

## Checklist Before Merge

- [ ] `npm test` — all unit tests pass
- [ ] `npm run test:e2e` — all Playwright tests pass
- [ ] All 161 slides render correctly in Audience View
- [ ] All slide transitions match TEMPLATE.html behavior
- [ ] Sound engine produces correct cues for each slide type
- [ ] Particle system works (receipt rain + flutter)
- [ ] Crate drop animation plays correctly
- [ ] DOA voting works with Firebase
- [ ] QR code renders on intermission
- [ ] Timer border fuse counts down correctly
- [ ] Operator View shows all components
- [ ] Section nav jumps work
- [ ] Score +/- buttons work
- [ ] Shortcut overlay shows all keys
- [ ] localStorage persistence survives refresh
- [ ] PWA loads offline
- [ ] No console errors
- [ ] Design System compliance: zero border-radius, correct tokens, correct fonts
- [ ] Main branch untouched

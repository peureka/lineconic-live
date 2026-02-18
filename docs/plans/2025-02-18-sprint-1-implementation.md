# Sprint 1+2+3 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a dress-rehearsal-ready React app at `app.html` with Operator View, Audience View (The Monolith), scoring, and full keyboard control — ported from the proven TEMPLATE.html renderer.

**Architecture:** Single HTML file (`app.html`) using React 18 via CDN with inline CSS. No build tools. Data loaded from localStorage (offline-first) with Firebase fallback. Run of Show seeded from CSV via a Node.js script. Service worker for PWA offline support.

**Tech Stack:** React 18 (CDN), Firebase Realtime Database (europe-west1), Web Audio API, Canvas 2D, Service Worker

**Branch:** `sprint-1-core-engine` (main is untouched, live site stays up)

**Reference files you MUST read before each task:**
- `TEMPLATE.html` — the proven renderer. Port logic verbatim, don't reinvent.
- `docs/LINECONIC_LIVE_DESIGN_SYSTEM_V1.md` — all UI tokens
- `docs/LINECONIC_LIVE_PRODUCT_ROADMAP_V1.md` — user stories
- `docs/plans/2025-02-18-sprint-1-core-engine-design.md` — the approved design

---

## Task 1: Seed Script — CSV to Firebase + JSON

**Files:**
- Create: `seed-firebase.js`
- Create: `ros-v1.json` (generated output)
- Read: `SHOW_MASTER_V2.csv` (input)
- Reference: `generate_deck.js` (CSV parsing logic to reuse)

**Step 1: Write the seed script**

Create `seed-firebase.js`. This Node.js script:

1. Reads `SHOW_MASTER_V2.csv`
2. Parses it (copy the CSV parsing approach from `generate_deck.js` lines 1-60: BOM stripping, CRLF normalization, quoted field handling)
3. Groups rows into sections by the `section` column (when `section` value changes, new section starts)
4. Maps each CSV row to the schema:

```
CSV slide_type    -> Schema type
─────────────────────────────────
source_q          -> "source_q"       (keep original types for renderer compatibility)
acronym_q         -> "acronym_q"
source_a          -> "source_a"
acronym_a         -> "acronym_a"
attract           -> "attract"
fishbowl          -> "fishbowl"
round_title       -> "round_title"
tier_title        -> "tier_title"
bonus_marker      -> "bonus_marker"
score             -> "score"
intermission      -> "intermission"
warning           -> "warning"
blackout          -> "blackout"
transition_beat   -> "transition_beat"
crate_drop        -> "crate_drop"
fluency_line      -> "fluency_line"
fluency_source    -> "fluency_source"
doa_ref           -> "doa_ref"
doa_vote          -> "doa_vote"
doa_verdict_dead  -> "doa_verdict_dead"
doa_verdict_alive -> "doa_verdict_alive"
hotseat_rules     -> "hotseat_rules"
hotseat_prompt    -> "hotseat_prompt"
verdict           -> "verdict"
sentence          -> "sentence"
receipt_rain      -> "receipt_rain"
last_line         -> "last_line"
endcard           -> "endcard"
answer_sheet      -> "answer_sheet"
```

IMPORTANT: Keep original CSV `slide_type` values as-is in the schema. The renderer functions in TEMPLATE.html use these exact type names. Don't remap to abstract types — it would break the direct port.

Each slide object:
```json
{
  "id": "s001",
  "type": "source_q",
  "team": "neutral",
  "content": {
    "primary": "DID I STUTTER?",
    "secondary": null,
    "answer": "The Office",
    "source": "The Office"
  },
  "reveal_state": "hidden",
  "timer_seconds": null,
  "host_notes": null,
  "points": null,
  "notes": ""
}
```

Content mapping from CSV columns:
- `primary_text` -> `content.primary`
- `secondary_text` -> `content.secondary`
- `answer` column -> `content.answer`
- `answer_source` column -> `content.source`
- For `acronym_q`: primary is the acronym, answer is the decoded line, source is the source
- For `source_q`: primary is the line, answer is the source
- `notes` column -> check for bonus points pattern `/(\d+)\s*p/` -> `points` field
- `hotseat_prompt` slides -> `timer_seconds: 30`
- `source_q` and `acronym_q` slides -> `timer_seconds: 30`

Section structure:
```json
{
  "id": "round-1-guess-the-source",
  "name": "ROUND 1: GUESS THE SOURCE",
  "slides": [...]
}
```

The full Run of Show:
```json
{
  "id": "split-table-v2",
  "name": "THE SPLIT — TABLE FORMAT V2",
  "created": <timestamp>,
  "sections": [...]
}
```

5. Writes the JSON to `ros-v1.json`
6. Writes to Firebase `shows/split-table-v2` using the Firebase REST API (no SDK needed for a one-shot script):

```
PUT https://lineconic-live-default-rtdb.europe-west1.firebasedatabase.app/shows/split-table-v2.json
```

Use `fetch()` (available in Node 18+) with the Firebase REST API. No auth needed if database rules allow writes (they currently do based on the existing voting system).

**Step 2: Run the seed script**

```bash
node seed-firebase.js
```

Expected: `ros-v1.json` created with the full Run of Show. Firebase updated.

**Step 3: Verify the output**

```bash
node -e "const d=JSON.parse(require('fs').readFileSync('ros-v1.json','utf8')); console.log('Sections:', d.sections.length); d.sections.forEach(s => console.log(' ', s.name, '-', s.slides.length, 'slides')); console.log('Total slides:', d.sections.reduce((a,s) => a+s.slides.length, 0))"
```

Expected: ~10-12 sections, ~161 total slides matching the CSV row count.

Also verify Firebase:
```bash
curl -s "https://lineconic-live-default-rtdb.europe-west1.firebasedatabase.app/shows/split-table-v2/name.json"
```

Expected: `"THE SPLIT — TABLE FORMAT V2"`

**Step 4: Commit**

```bash
git add seed-firebase.js ros-v1.json
git commit -m "feat: seed script — CSV to Firebase + JSON

Parses SHOW_MASTER_V2.csv into structured Run of Show.
Writes to Firebase shows/split-table-v2 and ros-v1.json."
```

---

## Task 2: PWA Shell — manifest.json + sw.js

**Files:**
- Create: `manifest.json`
- Create: `sw.js`

**Step 1: Create manifest.json**

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

Minimal. No icons needed for v1. The PWA install prompt isn't the goal — offline caching is.

**Step 2: Create sw.js**

Service worker that caches:
- `/app.html`
- `/ros-v1.json`
- Google Fonts CSS + font files for Space Mono
- Firebase SDK JS files (both firebase-app-compat.js and firebase-database-compat.js)

Strategy: Cache-first for all assets. Network-first for Firebase API calls (so voting still works live).

The service worker should:
1. On `install`: pre-cache the asset list
2. On `fetch`: return cached version if available, fall back to network
3. Skip caching for Firebase Realtime Database requests (*.firebasedatabase.app)

**Step 3: Verify files exist**

```bash
cat manifest.json
cat sw.js
```

**Step 4: Commit**

```bash
git add manifest.json sw.js
git commit -m "feat: PWA shell — manifest + service worker

Offline-first caching for app.html, fonts, Firebase SDK, and
Run of Show JSON. Firebase API calls pass through to network."
```

---

## Task 3: app.html — Skeleton + Routing + CSS Foundation

**Files:**
- Create: `app.html`

This is the big file. Build it in layers across Tasks 3-8.

**Step 1: Create app.html with the full CSS foundation + React shell**

The file structure:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LINECONIC LIVE</title>
  <link rel="manifest" href="/manifest.json">
  <!-- Firebase SDK -->
  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-database-compat.js"></script>
  <!-- React CDN -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <!-- Babel for JSX (dev convenience — single file, no build) -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <!-- Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    /* === FULL CSS HERE === */
  </style>
</head>
<body>
  <div id="root"></div>
  <canvas id="particles"></canvas>
  <script type="text/babel">
    /* === FULL REACT APP HERE === */
  </script>
</body>
</html>
```

**CSS must include ALL of the following (in order):**

1. **Design System V1 tokens** — complete `:root` block from Design System appendix (lines 461-503)
2. **Global resets** — from Design System appendix (lines 508-528), including `border-radius: 0 !important`
3. **Audience View slide CSS** — ported VERBATIM from TEMPLATE.html lines 16-97:
   - Slide base (`.S`, `.S.on`)
   - Transitions (slam, breath, punch, fade, shakeIn keyframes)
   - Typography classes (`.D` display, `.M` mono)
   - Halation classes (`.hw`, `.hc`, `.hp`, `.hg`, `.hs`)
   - Neon borders (`.nb`, `.nb-pk`, `.nb-cy`, `.nb-wh`, `.nb-gd`)
   - Timer border (`.tb`, `.tb.pk`, `.tb.cy`, `.tb.dead`)
   - Scoreboard bug (`#sbug`)
   - Source bar (`.srcbar`)
   - Answer list (`.ans-list`)
   - Particle canvas (`#particles`)
   - Crate drop animations
   - All keyframes (pulse, rain, crateGlow, crateFloat, crateLidOpen, crateGlowReveal)
4. **Design System bloom pulse** keyframe (the 120 BPM animation)
5. **Design System reveal transition** CSS
6. **Operator View CSS** — new CSS for:
   - Operator grid layout (sidebar + main + secondary)
   - Section nav styles (per Design System 4.4)
   - Slide card styles (per Design System 4.3)
   - Score display styles (per Design System 4.2)
   - Timer bar styles (per Design System 4.5)
   - Host notes field (per Design System 4.6)
   - Shortcut overlay modal (per Design System 4.7)
   - All using Design System tokens

**React shell must include:**

1. **Firebase init** — same config from TEMPLATE.html lines 439-451
2. **Mode routing** — read `?mode=` param, render `<OperatorView>` or `<AudienceView>`
3. **State management** using `React.useReducer`:
   ```
   state = {
     show: null,           // the Run of Show object
     currentSlide: 0,      // flat index across all sections
     scores: [0, 0],       // [cyan, pink]
     revealState: {},       // { slideId: 'revealed' | 'hidden' }
     receipts: 0,
     muted: true,
     timerRunning: false,
     timerSeconds: 30,
     showScoreboard: false,
     showShortcuts: false,
     showHostPanel: false,
   }
   ```
4. **Data loading** — on mount:
   - Try localStorage `lineconic-show` first
   - Fall back to fetch `ros-v1.json`
   - Save to localStorage on load
5. **Session persistence (US-004)** — save state to localStorage on every dispatch
6. **Flat slide index helper** — function to convert `(sectionIndex, slideIndex)` to flat index and back, since the show is nested but navigation is linear
7. **Placeholder components** — `OperatorView` and `AudienceView` as empty divs (filled in Tasks 4-7)

**Step 2: Verify it loads**

Open `app.html` in browser. Should see a black screen (void). No errors in console. React mounted.

Open `app.html?mode=operator` — black screen.
Open `app.html?mode=audience` — black screen, no cursor.

**Step 3: Verify data loads**

Open console. Check `localStorage.getItem('lineconic-show')` is populated.
Check the React state has the show loaded with correct section/slide counts.

**Step 4: Commit**

```bash
git add app.html
git commit -m "feat: app shell — routing, CSS foundation, data loading

React 18 CDN app with query-param routing (?mode=operator/audience).
Full Design System V1 tokens. All TEMPLATE.html CSS ported.
Data loads from localStorage -> ros-v1.json fallback.
Session state persists to localStorage."
```

---

## Task 4: Audience View — The Monolith (Slide Renderers)

**Files:**
- Modify: `app.html` (add AudienceView component)
- Reference: `TEMPLATE.html` lines 322-361 (renderer functions)
- Reference: `TEMPLATE.html` lines 308-319 (transition map)

**Step 1: Port all renderer functions to React**

Inside `app.html`, create the `AudienceView` component. This needs:

1. **Utility functions** — port VERBATIM from TEMPLATE.html:
   - `qSz(text)` — acronym question sizing (line 327)
   - `aSz(text)` — answer sizing (line 328)
   - `nw()` — nowrap style (line 329)
   - `sb(text)` — source bar HTML (line 330)
   - `tx(type)` — transition map (lines 310-319)

2. **Slide renderer components** — one React component per slide type, porting the HTML from each `R.*` function (TEMPLATE.html lines 332-361). Each component receives the slide's `content` object as props.

   Port these exactly:
   - `AttractSlide` (from `R.attract`)
   - `FishbowlSlide` (from `R.fishbowl`)
   - `RoundTitleSlide` (from `R.round_title`)
   - `TierTitleSlide` (from `R.tier_title`)
   - `BonusMarkerSlide` (from `R.bonus_marker`)
   - `SourceQSlide` (from `R.source_q`)
   - `SourceASlide` (from `R.source_a`)
   - `AcronymQSlide` (from `R.acronym_q`)
   - `AcronymASlide` (from `R.acronym_a`)
   - `FluencyLineSlide` (from `R.fluency_line`)
   - `FluencySourceSlide` (from `R.fluency_source`)
   - `ScoreSlide` (from `R.score`)
   - `IntermissionSlide` (from `R.intermission`)
   - `DoaVoteSlide` (from `R.doa_vote`)
   - `WarningSlide` (from `R.warning`)
   - `BlackoutSlide` (from `R.blackout`)
   - `TransitionBeatSlide` (from `R.transition_beat`)
   - `DoaRefSlide` (from `R.doa_ref`)
   - `DoaVerdictDeadSlide` (from `R.doa_verdict_dead`)
   - `DoaVerdictAliveSlide` (from `R.doa_verdict_alive`)
   - `HotseatRulesSlide` (from `R.hotseat_rules`)
   - `HotseatPromptSlide` (from `R.hotseat_prompt`)
   - `VerdictSlide` (from `R.verdict`)
   - `SentenceSlide` (from `R.sentence`)
   - `ReceiptRainSlide` (from `R.receipt_rain`)
   - `CrateDropSlide` (from `R.crate_drop`)
   - `LastLineSlide` (from `R.last_line`)
   - `EndcardSlide` (from `R.endcard`)
   - `AnswerSheetSlide` (from `R.answer_sheet`)

3. **SlideRenderer** — dispatcher component that picks the right renderer by `slide.type`

4. **AudienceView layout**:
   - Full-screen container
   - Current slide rendered with `.S.on` + transition class
   - Previous slide has `.S` only (hidden)
   - `cursor: none` on body when in audience mode

5. **Answer reveal layer (US-016)**:
   - Gameplay slides (`source_q`, `acronym_q`, `acronym_a`, `source_a`) show answer
   - Answer wrapped in a div with class `answer` (blurred) or `answer revealed` (visible)
   - Reveal state comes from the app state's `revealState[slideId]`

**Step 2: Verify renderers**

Open `app.html?mode=audience` in browser.
- Should see the attract slide (big pink "L" pulsing)
- Arrow right: should advance through slides
- Each slide type should render with correct styling, borders, typography

**Step 3: Commit**

```bash
git add app.html
git commit -m "feat: Audience View — all slide renderers ported from TEMPLATE.html

29 slide type renderers. Transition animations. Answer reveal with
blur/glow. Full TEMPLATE.html visual parity."
```

---

## Task 5: Keyboard Navigation + Sound Engine + Particles

**Files:**
- Modify: `app.html`
- Reference: `TEMPLATE.html` lines 213-268 (sound engine)
- Reference: `TEMPLATE.html` lines 366-431 (particle system)
- Reference: `TEMPLATE.html` lines 656-750 (navigation + input)

**Step 1: Port the sound engine**

Copy the sound engine VERBATIM from TEMPLATE.html:
- `initAudio()`, `tone()` functions (lines 213-225)
- `startShepard()`, `stopShepard()` (lines 229-247)
- `sfx()` switch statement (lines 249-268)

These are vanilla JS functions that live outside React. Put them in a `<script>` block before the React code, or at the top of the Babel script block as plain functions.

**Step 2: Port the particle system**

Copy VERBATIM from TEMPLATE.html:
- Canvas setup + resize handler (lines 366-371)
- `spawnReceipts()`, `spawnFlutter()` (lines 373-404)
- `tickParticles()` render loop (lines 406-423)
- `startParticles()`, `stopParticles()` (lines 425-431)

These operate on the `<canvas id="particles">` element directly. Vanilla JS, outside React.

**Step 3: Port keyboard navigation**

Implement the `useEffect` hook for keyboard handling. Map keys per the design:

```
Right / Space    -> dispatch('NEXT_SLIDE')
Left             -> dispatch('PREV_SLIDE')
R                -> dispatch('TOGGLE_REVEAL')
Q                -> dispatch('SCORE_CYAN', +1)
A                -> dispatch('SCORE_CYAN', -1)
P                -> dispatch('SCORE_PINK', +1)
L                -> dispatch('SCORE_PINK', -1)
1-9              -> dispatch('JUMP_SECTION', sectionIndex)
T                -> dispatch('TOGGLE_TIMER')
F                -> toggleFullscreen()
S                -> dispatch('TOGGLE_SCOREBOARD')
M                -> dispatch('TOGGLE_MUTE')
H                -> dispatch('TOGGLE_HOST_PANEL')
?                -> dispatch('TOGGLE_SHORTCUTS')
Esc              -> dispatch('CLOSE_OVERLAYS')
```

On slide change:
- Call `sfx(slideType)` for the new slide
- Call `stopParticles()` then conditionally `startParticles('rain')` or `startParticles('flutter')`
- Stop timer
- Persist state to localStorage

Also port:
- Click to advance (from TEMPLATE.html line 747)
- Right-click to go back (line 748)
- Touch swipe (lines 749-750)

**Step 4: Port the timer system**

Copy the timer logic from TEMPLATE.html lines 274-305:
- `startTimer()`, `resumeTimer()`, `pauseTimer()`, `togglePause()`, `stopTimer()`
- The conic gradient border fuse (operates on `.tb` elements in the DOM)
- Auto-timer on question slides when enabled
- Timer death sound cue

**Step 5: Verify navigation**

Open `app.html?mode=audience`:
- Arrow keys advance/retreat slides
- Each slide transition animates correctly
- Sound plays on unmute (M key)
- Shepard tone starts on question slides, stops on answers
- Receipt rain slide shows particles
- Timer starts on T key, conic border counts down

**Step 6: Commit**

```bash
git add app.html
git commit -m "feat: keyboard nav, sound engine, particles, timer

Full keyboard control. Web Audio sfx + Shepard tone ported.
Canvas particle system (receipt rain + flutter). Timer border fuse.
All logic direct-ported from TEMPLATE.html."
```

---

## Task 6: DOA Voting + QR Code

**Files:**
- Modify: `app.html`
- Reference: `TEMPLATE.html` lines 434-620 (Firebase voting + QR)

**Step 1: Port DOA voting**

Copy from TEMPLATE.html:
- Firebase init (already done in Task 3)
- `pushTopic()`, `castVote()`, `resetVotes()`, `updateVoteBars()` (lines 459-511)
- Vote bar DOM updates (the `.vbar-dead`, `.vbar-alive`, `.vpct-dead`, `.vpct-alive` elements)

The voting system must:
- Push `currentTopic` to Firebase when entering a `doa_vote` slide
- Listen for vote counts and update bars in real-time
- Clear topic when leaving DOA section
- Cast votes from operator (host controls: +DEAD, +ALIVE, +5 DEAD, +5 ALIVE, RESET)

**Step 2: Port QR code encoder**

Copy the `drawQR()` and `encodeQR()` functions from TEMPLATE.html lines 514-620.
Call `drawQR()` when an intermission slide mounts (via useEffect or direct DOM call).

Update the QR URL to: `https://lineconic.live/vote`

**Step 3: Verify voting**

Open `app.html?mode=audience`, navigate to a DOA vote slide.
- Vote bars should appear
- Open the existing `vote/index.html` in another tab
- Verify the topic appears on the vote page
- Cast a vote — bar should update on the audience slide

**Step 4: Commit**

```bash
git add app.html
git commit -m "feat: DOA voting + QR code on intermission

Firebase-backed voting with real-time bar updates.
QR code renders on intermission slides (lineconic.live/vote).
Host can cast/reset votes from operator controls."
```

---

## Task 7: Operator View

**Files:**
- Modify: `app.html`
- Reference: `docs/LINECONIC_LIVE_DESIGN_SYSTEM_V1.md` sections 4.1-4.7

**Step 1: Build the Operator View component tree**

Components (all using Design System V1 tokens):

1. **OperatorView** — root layout grid:
   ```
   display: grid;
   grid-template-columns: 220px 1fr 280px;
   grid-template-rows: 1fr auto;
   height: 100vh;
   background: var(--void);
   ```

2. **SectionNav** (left sidebar) — per Design System 4.4:
   - Vertical list of sections from the Run of Show
   - Active section: `border-left: 2px solid var(--light)`, `--glow-white` on left edge, `--text-primary`
   - Inactive: `border-left: 2px solid var(--border-subtle)`, `--text-secondary`
   - Slide count right-aligned in `--text-disabled`
   - Click: jumps to first slide of that section (instant, no animation)
   - Font: Space Mono `--type-label`

3. **CurrentSlideCard** (center main) — per Design System 4.3:
   - Border: `1px solid var(--border-active)`, `box-shadow: var(--glow-white)`
   - Shows: reveal state badge (top-left), slide counter "14/75" (top-right)
   - Acronym/primary text in `--type-title`
   - Answer always visible (operator sees everything) in `--type-label --text-secondary`
   - Source in `--type-meta`
   - Host notes field at bottom (per Design System 4.6)

4. **NextSlideCard** (right panel) — per Design System 4.3:
   - `opacity: 0.5`, no border
   - "NEXT" label in `--type-meta --text-secondary`
   - Preview of next slide content

5. **ScoreDisplay** (bottom bar) — per Design System 4.2:
   - Two score blocks side by side
   - Score number in Space Mono `--type-title`, cyan glow on O.G., signal glow on R.O.T.
   - Team label in `--type-label --text-secondary`
   - +/- buttons: 44x44px, square, `border: 1px solid var(--border-subtle)`
   - Winning team glow intensifies, losing pulls to 0.3 opacity
   - Score CUTS on change (no animation)

6. **TimerDisplay** (bottom bar, next to scores):
   - Bar: `height: 4px`, fill `--light`, track `--surface-03`
   - Under 10s: fill `--signal` with `--glow-signal`
   - Under 5s: fill pulses opacity 1->0.4 at 2Hz
   - Time in Space Mono `--type-label`
   - Timer is operator-only (absent from Audience View DOM)

7. **ReceiptCounter** (bottom bar):
   - Manual increment counter in Space Mono
   - +/- buttons same style as score

8. **ShortcutOverlay** (US-006) — per Design System 4.7:
   - Triggered by `?` key
   - `background: rgba(0,0,0,0.95)`, no backdrop blur
   - Two-column grid: key box on left, action text on right
   - Key: Space Mono `--type-label`, `--surface-02` box, `border: 1px solid var(--border-subtle)`, square
   - Action: Space Mono `--type-meta --text-secondary`
   - Lists all keyboard shortcuts
   - Close with `?` or `Esc`

**Step 2: Verify Operator View**

Open `app.html?mode=operator`:
- Section nav on left with all sections listed
- Current slide card in center with full content
- Next slide preview on right at 50% opacity
- Score display at bottom with team colors and +/- buttons
- Press `?` — shortcut overlay appears
- Click a section in nav — jumps to first slide
- Q/A/P/L keys — scores update instantly (no animation)
- Arrow keys — slide card updates, section nav highlights correct section

**Step 3: Commit**

```bash
git add app.html
git commit -m "feat: Operator View — full control surface

Section nav, current/next slide cards, score display, timer,
receipt counter, shortcut overlay. All Design System V1 compliant.
12-column grid layout. Zero border-radius."
```

---

## Task 8: Audience Scoreboard + localStorage Persistence + PWA Registration

**Files:**
- Modify: `app.html`

**Step 1: Port the audience scoreboard bug**

From TEMPLATE.html lines 60-67 (`#sbug`):
- Fixed bottom bar showing CYAN score vs PINK score
- Team-colored with glow
- Toggle with S key
- Only renders in Audience View

**Step 2: Wire up localStorage persistence (US-004)**

In the React reducer's dispatch wrapper:
- After every state change, serialize `{ currentSlide, scores, revealState, receipts, muted, timerSeconds, showScoreboard }` to `localStorage.setItem('lineconic-session', JSON.stringify(state))`
- On app mount, check for `lineconic-session` in localStorage and restore if found
- This means a browser refresh mid-show restores the exact position

**Step 3: Register the service worker (US-003)**

At the bottom of the script block:
```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(err => console.warn('SW registration failed:', err));
}
```

**Step 4: Verify persistence**

1. Open `app.html?mode=operator`
2. Navigate to slide 15, set cyan score to 5
3. Refresh the page
4. Should restore to slide 15 with cyan score 5

**Step 5: Verify offline**

1. Open `app.html` and let it load
2. Open DevTools > Application > Service Workers — confirm registered
3. Go offline (DevTools > Network > Offline)
4. Refresh — app should still load and navigate

**Step 6: Commit**

```bash
git add app.html
git commit -m "feat: audience scoreboard, localStorage persistence, PWA

Scoreboard bug on audience view. Full session restore on refresh.
Service worker registered for offline support."
```

---

## Task 9: Integration Testing + Bug Fixes

**Files:**
- Modify: `app.html` (fixes only)

**Step 1: Full run-through — Audience View**

Open `app.html?mode=audience` and navigate through ALL 161 slides:
- Verify every slide type renders correctly
- Verify transitions fire (slam on questions, punch on answers, breath on titles)
- Verify sound cues play when unmuted
- Verify Shepard tone on question slides
- Verify receipt rain particles on receipt_rain slide
- Verify crate drop animation
- Verify DOA vote bars update
- Verify QR code renders on intermission
- Verify scoreboard toggle

**Step 2: Full run-through — Operator View**

Open `app.html?mode=operator`:
- Section nav highlights correct section as you navigate
- Current slide card shows correct content for every slide type
- Next slide preview is accurate
- Score +/- buttons work
- Timer starts and the conic border fuse counts down
- Shortcut overlay shows all keys
- Host notes field is editable

**Step 3: Dual-view test**

Open both views in separate windows:
- Navigate in operator — verify audience view doesn't exist as a separate sync target (they're independent per US-001)
- This is correct for Sprint 1 — multi-device sync is Phase 2

**Step 4: Persistence test**

Navigate to slide 30, set scores, reveal an answer, refresh both views.
Verify state restores correctly.

**Step 5: Fix any bugs found**

Address issues. Each fix is its own commit with a descriptive message.

**Step 6: Final commit**

```bash
git add app.html
git commit -m "fix: integration test fixes

[describe specific fixes]"
```

---

## Task 10: Push Branch + Verify Deploy

**Files:** None (git operations only)

**Step 1: Push the branch**

```bash
git push -u origin sprint-1-core-engine
```

**Step 2: Verify main is untouched**

```bash
git log main --oneline -5
```

Should show only the original commits. The live site at lineconic.live is unaffected.

**Step 3: Test from GitHub Pages (optional)**

If you want to test the branch deploy, you can temporarily switch GitHub Pages to the `sprint-1-core-engine` branch in repo settings. Otherwise, test locally only and merge to main when verified.

**Step 4: Summary**

Sprint 1+2+3 complete on `sprint-1-core-engine` branch:
- `seed-firebase.js` — CSV to Firebase + JSON
- `ros-v1.json` — offline Run of Show data
- `app.html` — full React SPA with Operator + Audience views
- `sw.js` + `manifest.json` — PWA offline support
- All 38 user stories from Epics 1-4 addressed
- Main branch untouched, live site running

---

## Checklist Before Merge

- [ ] All 161 slides render correctly in Audience View
- [ ] All slide transitions match TEMPLATE.html behavior
- [ ] Sound engine produces correct cues for each slide type
- [ ] Shepard tone starts on questions, stops on answers
- [ ] Particle system works (receipt rain + flutter)
- [ ] Crate drop animation plays correctly
- [ ] DOA voting works with Firebase (test with vote page)
- [ ] QR code renders on intermission
- [ ] Timer border fuse counts down and dies correctly
- [ ] Operator View shows all components
- [ ] Section nav jumps work
- [ ] Score +/- buttons work on operator
- [ ] Shortcut overlay shows all keys
- [ ] localStorage persistence survives refresh
- [ ] PWA loads offline
- [ ] No console errors
- [ ] Design System compliance: zero border-radius, correct tokens, correct fonts

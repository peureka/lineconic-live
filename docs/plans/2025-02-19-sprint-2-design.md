# Sprint 2: Sync, Vote, Answers & Content Update

**Date:** 2025-02-19
**Branch:** `sprint-1-core-engine` (continuing)
**Depends on:** Sprint 1 (complete)

---

## Goal

Make `app.html` show-ready by adding multi-device sync, audience voting, host answer sheet, and updated V3 content. Port the useful features from `main` into the superior `app.html` architecture.

## What We're Adding

### 1. Firebase Multi-Device Sync

**Problem:** Operator and audience views are independent — pressing keys in operator tab doesn't affect audience on another device/tab.

**Solution:** Operator pushes state to Firebase on every action. Audience subscribes and mirrors state in real-time.

**Architecture:**
- Operator is the **single writer** (source of truth)
- Audience + vote page are **read-only listeners**
- BroadcastChannel used as fast-path for same-browser tabs
- Firebase used for cross-device sync

**Firebase paths:**

```
live/{showId}/
  state/
    slide: 0          // current flat slide index
    reveal: false      // answer revealed
    scores: [0, 0]     // [cyan, pink]
    scoreboard: false   // scoreboard overlay visible
    muted: true         // sound muted (synced so audience speakers match)
    topic: ""           // current DOA vote topic
    topicActive: false  // whether voting is open
```

**What syncs:** slide position, reveal state, scores, scoreboard visibility, mute state, DOA topic
**What stays local:** shortcut overlay, localStorage session, timer display (operator-only UI)

**Sync flow:**
1. Operator dispatches action → reducer produces new state
2. After state update, write changed fields to `live/{showId}/state/`
3. Audience `onValue` listener receives update → dispatches matching actions
4. Audience never writes to `live/` path (read-only)

**BroadcastChannel fallback:**
- Same `lineconic-ctrl` channel name as `main` uses
- Fires on every state change alongside Firebase write
- Audience checks BroadcastChannel first (instant), Firebase second (~100ms)

### 2. Vote Page (`?mode=vote`)

Port `vote/index.html` from `main` as a new route mode in `app.html`.

**What it does:**
- Audience opens on phone via QR code
- Shows current DOA topic (received from Firebase)
- Two buttons: DEAD (pink) / ALIVE (cyan)
- Live vote bar updates in real-time
- One vote per topic per device (localStorage track)

**Firebase paths:**
```
live/{showId}/votes/{topicSanitized}/
  dead: 0
  alive: 0
```

**Design:** Same styling as `main` version — Anton font, neon glows, big tap targets. Waiting state when no topic is active.

### 3. Answer Sheet (`?mode=answers`)

Port `answers.html` from `main` as a new route mode.

**What it does:**
- Printable host cheat sheet with all answers
- Organized by round (Guess the Source, Acronyms, Fluency Test, etc.)
- Bonus questions highlighted in gold
- Print-friendly CSS (black on white when printed)

**Data source:** Built from the same `ros-v1.json` / show data already loaded.

### 4. Content Update to V3

- Port `SHOW_MASTER_V3.csv` from `main`
- Regenerate `ros-v1.json` with updated content
- Re-upload to Firebase

### 5. QR Code CDN

Replace hand-rolled QR encoder in `app.html` with `qrcode-generator` library (CDN).
- Produces larger, cleaner QR codes
- Same approach as `main`: `<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js">`

### 6. Favicon

Add `favicon.svg` (pink L on black) from `main`.

---

## What We're NOT Porting

| `main` file | Why skip |
|-------------|----------|
| `operator/index.html` | Our `app.html?mode=operator` is far superior (section nav, rendered previews, keyboard shortcuts, Design System V1) |
| `SHOW_MASTER_V3_INLINE.html` | Legacy flat deck, replaced by `app.html` |
| `SHOW_MASTER_V3_SHEET.html` | Legacy flat deck, replaced by `app.html` |
| `sheet.html` | Legacy, replaced by `app.html` |

---

## Testing Strategy

**Unit tests (Vitest):**
- Sync state serialization/deserialization
- Vote counting logic
- Answer sheet data extraction from show data

**E2E tests (Playwright):**
- Vote page renders and shows waiting state
- Answer sheet renders with correct round structure
- Operator mode triggers Firebase write (mock or real)
- Audience mode receives state updates

---

## File Changes

| File | Change |
|------|--------|
| `app.html` | Add Firebase sync, vote mode, answers mode, QR CDN, BroadcastChannel |
| `ros-v1.json` | Regenerate from V3 CSV |
| `SHOW_MASTER_V3.csv` | Port from `main` |
| `favicon.svg` | Port from `main` |
| `seed-firebase.js` | Update to read V3 CSV |
| `lib/ros-builder.js` | No changes needed (same CSV schema) |
| `tests/` | New unit + E2E tests |

---

## Success Criteria

1. Open `app.html?mode=operator` on laptop, `app.html?mode=audience` on phone — operator controls audience in real-time
2. Open `app.html?mode=vote` on phone — can vote DEAD/ALIVE, results appear on audience view
3. Open `app.html?mode=answers` — printable answer sheet with all rounds
4. All 51+ unit tests pass
5. All 14+ E2E tests pass
6. Design System V1 compliance on all new UI

# Sprint 1+2+3 Design — Core Engine + Both Views

## Scope

Epic 1 (Core Engine) + Epic 2 (Operator View) + Epic 3 (Audience View) + Epic 4 (Scoring).
User stories US-001 through US-022. Deliverable: dress-rehearsal-ready app.

## Governing Documents

- **Product Roadmap V1** — build order, user stories, schema (wins on build order)
- **Architecture Doc** — data model, tech stack (wins on data model)
- **Design System V1** — all UI tokens, component specs, motion rules
- **TEMPLATE.html** — reference renderer implementation (port, don't reinvent)

## File Structure

```
lineconic-live/
  index.html          # UNTOUCHED — existing live deck on main
  app.html            # NEW — React SPA (Sprint 1+2+3)
  seed-firebase.js    # NEW — Node.js: CSV -> Firebase + JSON
  ros-v1.json         # NEW — generated Run of Show JSON (offline fallback)
  sw.js               # NEW — service worker for PWA/offline
  manifest.json       # NEW — PWA manifest
  CNAME               # lineconic.live (unchanged)
  sheet.html          # unchanged
  vote/               # unchanged
  docs/plans/         # this file
```

Single HTML file. React 18 + ReactDOM via CDN. No build tools. All CSS inline.
Branch: `sprint-1-core-engine` (main stays live until verified).

## Data Schema

Run of Show stored in Firebase `shows/{showId}/` and mirrored to localStorage.

```json
{
  "id": "split-table-v2",
  "name": "THE SPLIT — TABLE FORMAT V2",
  "created": 1708300000000,
  "sections": [
    {
      "id": "pre-show",
      "name": "PRE-SHOW",
      "slides": [
        {
          "id": "s001",
          "type": "attract",
          "team": "neutral",
          "content": {
            "primary": "L",
            "secondary": null,
            "answer": null,
            "source": null,
            "acronym": null
          },
          "reveal_state": "hidden",
          "timer_seconds": null,
          "host_notes": null,
          "points": null
        }
      ]
    }
  ]
}
```

### Type Mapping (CSV -> Schema)

| CSV slide_type | Schema type | Notes |
|---|---|---|
| source_q | quote | Content has primary (the line) + answer (source) |
| acronym_q | acronym | Content has primary (acronym) + answer (decoded line) + source |
| source_a | quote_answer | Inline answer reveal slide |
| acronym_a | acronym_answer | Inline answer reveal slide |
| attract | attract | |
| fishbowl | operational | |
| round_title | operational | |
| tier_title | operational | |
| bonus_marker | operational | points field set |
| score | operational | |
| intermission | operational | |
| warning | operational | |
| blackout | operational | |
| transition_beat | operational | |
| crate_drop | operational | |
| fluency_line | quote | team: neutral |
| fluency_source | quote_answer | |
| doa_ref | operational | |
| doa_vote | operational | Firebase voting trigger |
| doa_verdict_dead | operational | |
| doa_verdict_alive | operational | |
| hotseat_rules | operational | |
| hotseat_prompt | quote | timer_seconds: 30 |
| verdict | operational | |
| sentence | operational | |
| receipt_rain | operational | |
| last_line | quote | |
| endcard | attract | |
| answer_sheet | operational | |

## Routing (US-001)

Query-param based:
- `app.html?mode=operator` -> Operator View
- `app.html?mode=audience` -> Audience View
- Default -> Operator View

Both share React state. Mode controls component tree. Independent from load.

## Operator View (Epic 2)

12-column grid. Design System V1 tokens.

```
+----------+-------------------------------+-----------------+
| SECTION  |      CURRENT SLIDE            |   NEXT SLIDE    |
| NAV      |                               |                 |
|          |  [HIDDEN]             [14/75]  |   NEXT          |
| PRE-SHOW |  --------------------------------              |
|>ROUND 1  |  W.A.Y.T.W.T.Y.A.            |   acronym       |
| ROUND 2  |                               |   G.T.T.C.      |
| FLUENCY  |  WHY ARE YOU THE WAY...       |                 |
| DOA      |  THE OFFICE                   |                 |
| ROUND 3  |                               |                 |
| ROUND 4  |  // Host notes here           |                 |
| VERDICT  |                               |                 |
|          +-------------------------------+-----------------+
|          |  CYAN: 047       PINK: 032    [Q+][A-] [P+][L-]|
|          |  [timer bar]  00:47                             |
+----------+-------------------------------------------------+
```

Components:
- SectionNav (sidebar) — vertical list, active state with left border glow
- SlideCard (current) — acronym, answer (always visible to operator), source, reveal badge
- SlideCard (next) — 50% opacity preview
- ScoreDisplay — Space Mono, cyan/pink glow, +/- buttons (44px targets)
- TimerBar — 4px fill bar, signal color under 10s, pulse under 5s
- HostNotes — mixed case Space Mono, --surface-01 bg
- ShortcutOverlay — ? key, full-screen modal, two-column grid

## Audience View — The Monolith (Epic 3)

Full-bleed. Zero controls. No cursor. Ported from TEMPLATE.html.

### Renderers (Direct Port)

Every `R.*` function from TEMPLATE.html lines 332-361 ported to React components.
Same HTML structure, same CSS classes, same sizing functions (qSz, aSz, nw, sb).

### Transitions (Direct Port)

Same keyframe animations: slam, breath, punch, fade, shakeIn.
Same transition map function (tx) mapping slide types to animations.

### Halation Classes (Direct Port)

.hw (white), .hc (cyan), .hp (pink), .hg (gold), .hs (soft white).
Same multi-layer text-shadow values from TEMPLATE.html lines 37-41.

### Neon Borders (Direct Port)

.nb-pk, .nb-cy, .nb-wh, .nb-gd — same inset, border, box-shadow values.

### Timer Border (Direct Port)

Conic gradient fuse with mask-composite trick. Same CSS from TEMPLATE.html lines 50-58.

### Sound Engine (Direct Port)

All sfx() cues from TEMPLATE.html lines 249-268.
Shepard tone (lines 229-247). Web Audio API oscillator synthesis.

### Particle System (Direct Port)

Receipt rain (500 particles) + flutter (80 particles).
Canvas rendering loop from TEMPLATE.html lines 366-431.

### DOA Voting (Direct Port)

Firebase push/listen pattern from TEMPLATE.html lines 456-511.
Vote bars with transition animations.

### QR Code (Direct Port)

Minimal QR encoder from TEMPLATE.html lines 514-620.

### Crate Drop (Direct Port)

Float -> lid open -> glow reveal -> L animation sequence.

### Answer Reveal (NEW — US-016)

R key toggles reveal_state on current slide.
- Hidden: answer blurred (filter: blur(20px))
- Revealed: instant blur cut + 0.8s glow surge (the one permitted transition)
- Operator always sees answer. Audience sees blur/reveal.

### 120 BPM Bloom Pulse

Per Design System V1:
```css
@keyframes bloom-pulse {
  from { text-shadow: 0 0 8px rgba(255,255,255,0.4); }
  to   { text-shadow: 0 0 24px rgba(255,255,255,0.9); }
}
.acronym-live { animation: bloom-pulse 0.5s ease-in-out infinite alternate; }
```

## Keyboard Shortcuts

| Key | Action | Source |
|---|---|---|
| Right / Space / Click | Advance slide | TEMPLATE.html |
| Left | Previous slide | TEMPLATE.html |
| R | Reveal/hide answer (audience) | NEW US-016 |
| Q / A | Cyan score +/- | NEW US-019 |
| P / L | Pink score +/- | NEW US-019 |
| 1-6 | Jump to section | NEW US-010 |
| T | Start/stop timer | TEMPLATE.html |
| F | Fullscreen | TEMPLATE.html |
| H | Host panel (legacy) | TEMPLATE.html |
| S | Scoreboard toggle | TEMPLATE.html |
| M | Mute/unmute | TEMPLATE.html |
| ? | Shortcut overlay | NEW US-006 |
| Esc | Close overlay | NEW |

## Scoring (Epic 4)

- Q/A keys increment/decrement cyan score
- P/L keys increment/decrement pink score
- Score display on both views (team colors, glow)
- Receipt counter on operator (manual increment)
- Variable reward tier display (hotkey trigger)

## Offline / PWA (US-003, US-004)

- sw.js caches: app.html, fonts, Firebase SDK, ros-v1.json
- On load: localStorage first, Firebase fallback
- All session state persisted to localStorage on every change
- Browser refresh restores exact position

## Seed Script

seed-firebase.js (Node.js):
1. Parse SHOW_MASTER_V2.csv (same BOM/quote/CRLF handling as generate_deck.js)
2. Group rows into sections by the `section` column
3. Map each row to the schema (type mapping table above)
4. Write to Firebase shows/split-table-v2/
5. Write ros-v1.json to disk

## Design System Compliance

All UI surfaces governed by LINECONIC_LIVE_DESIGN_SYSTEM_V1.md:
- Colors: --void, --light, --signal, --cyan, --gold, surface/border/text tokens
- Typography: Neue Haas Grotesk Display Pro (95 Black, ALL CAPS) + Space Mono (Bold)
- Spacing: 8pt base scale (--space-01 through --space-08)
- Border radius: 0 everywhere, !important override
- Motion: cuts over transitions, glow breathes nothing moves, one exception (reveal)
- Icons: industrial vector, 3px minimum stroke, sharp corners
- States: glow and color shifts only, no toasts/alerts/confetti

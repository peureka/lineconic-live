# LINECONIC LIVE — DESIGN SYSTEM V1.0
## App Surface. Nike Terminal. Balenciaga Brutalism.

> **STATUS: LIVE DOCUMENT**
> Governs all UI decisions for the Lineconic Live app surface.
> This document extends the Founder Bible V6.0 into a new surface category.
> When in conflict: Founder Bible governs the show. This document governs the tool.

---

## THE PREMISE

The Founder Bible governs the *show* aesthetic. This design system governs the *tool* aesthetic. They share the same DNA but solve a different problem. The show is a performance. The app is a **live operations terminal** — the thing the host trusts with their life at 2 AM in a venue where nothing can go wrong.

The reference shift: less nightclub projection screen, more **Nike SNKRS drop at midnight** meets **Bloomberg Terminal for someone who went to Central Saint Martins**. Every element earns its presence on screen. Nothing decorative. Everything functional and cold.

---

## SECTION 1 — COLOR SYSTEM

### Foundation Palette (Inherited from V6.0)

| TOKEN | VALUE | ROLE |
|---|---|---|
| `--void` | `#000000` | All backgrounds. No exceptions. |
| `--light` | `#FFFFFF` | Primary text. Always with bloom on Audience View. |
| `--signal` | `#FF007F` | Team R.O.T. / CTAs / active states / alerts |
| `--cyan` | `#00FFFF` | Team O.G. / secondary active states |
| `--gold` | `#FFD700` | Bonus tier / premium state only |
| `--charcoal` | `#211E21` | LineDROPS only — do not migrate into app UI |

### App Surface Extensions

The Founder Bible operates in pure black and white. The app has UI chrome — panels, borders, states — that needs a tighter range to avoid visual noise on the Operator View.

| TOKEN | VALUE | ROLE |
|---|---|---|
| `--surface-01` | `#0A0A0A` | Primary panel backgrounds. Slightly lifted from void. |
| `--surface-02` | `#111111` | Elevated cards, modals, input fields |
| `--surface-03` | `#1A1A1A` | Hover states, active rows, pressed buttons |
| `--border-subtle` | `#2A2A2A` | Dividers, panel outlines. Barely visible. |
| `--border-active` | `#FFFFFF` | Focus rings, selected states. Full contrast. |
| `--text-primary` | `#FFFFFF` | All readable content |
| `--text-secondary` | `#666666` | Meta labels, timestamps, inactive states |
| `--text-disabled` | `#333333` | Locked / unavailable elements |

### Glow System (The Bloom Layer)

Not decorative. Applied contextually to signal state.

| TOKEN | VALUE | USAGE |
|---|---|---|
| `--glow-white` | `0 0 12px rgba(255,255,255,0.6)` | Active elements, current slide indicator |
| `--glow-signal` | `0 0 20px rgba(255,0,127,0.7)` | R.O.T. score, signal alerts, reveal state |
| `--glow-cyan` | `0 0 20px rgba(0,255,255,0.7)` | O.G. score, cyan team elements |
| `--glow-gold` | `0 0 16px rgba(255,215,0,0.6)` | Bonus / Gold Receipt tier only |

> **Rule: Glow is a state indicator, not decoration.** If an element isn't in an active, alert, or team-coloured state, it has no glow.

---

## SECTION 2 — TYPOGRAPHY

### Typefaces

The app uses exactly **two typefaces**. No additions. No system fonts leaking in.

**NEUE HAAS GROTESK DISPLAY PRO — The Scream Font**
Weight: 95 Black exclusively. Tracking: `-0.02em` tight. Case: ALL CAPS for display. Mixed case only for host notes (the one informal surface).

**SPACE MONO — The Code Font**
Weight: Bold (700). Used for all data, meta, counters, labels, timestamps. Monospaced deliberately — numbers don't shift width when scores change.

### Type Scale Tokens

| TOKEN | SIZE | FONT | USAGE |
|---|---|---|---|
| `--type-display` | `clamp(4rem, 10vw, 12rem)` | Neue Haas 95 | Audience View acronyms |
| `--type-hero` | `clamp(2rem, 5vw, 5rem)` | Neue Haas 95 | Audience View answer reveal |
| `--type-title` | `2rem` | Neue Haas 95 | Operator View section headers |
| `--type-label` | `0.875rem` | Space Mono Bold | ALL UI labels, tags, counters |
| `--type-meta` | `0.75rem` | Space Mono Bold | Timestamps, slide numbers, source |
| `--type-note` | `0.875rem` | Space Mono | Host notes (only mixed case instance) |

### Type Rules

- Every string in Neue Haas is ALL CAPS. No exceptions.
- Letter-spacing on display sizes: `-0.03em`. Tight is correct.
- Line height on display: `0.9`. Compressed and urgent, not airy.
- No italic. No underline. No font weight variation within the same typeface.

---

## SECTION 3 — SPACING & LAYOUT

### Grid

Two fundamentally different layout contexts share the same token system.

**Operator View:** 12-column grid. Dense. Information hierarchy. Sidebar + main content + secondary panel.

**Audience View:** No grid. Full bleed. Single centred element. Nothing else.

### Spacing Scale (8pt Base)

| TOKEN | VALUE | USAGE |
|---|---|---|
| `--space-01` | `4px` | Internal component padding, icon gaps |
| `--space-02` | `8px` | Component padding standard |
| `--space-03` | `16px` | Between related elements |
| `--space-04` | `24px` | Section padding, card padding |
| `--space-05` | `32px` | Between sections |
| `--space-06` | `48px` | Major layout divisions |
| `--space-07` | `64px` | Page-level padding |
| `--space-08` | `96px` | Audience View vertical centering buffer |

### Border Radius

**Zero.** No rounded corners anywhere. The Founder Bible specifies stencil/industrial iconography with sharp edges. The same law applies to every surface. `border-radius: 0` is global and non-negotiable. If a browser default introduces rounding, override it.

---

## SECTION 4 — COMPONENT LIBRARY

### 4.1 — Buttons

Three variants. No tertiary. No ghost with fill. No outlined with rounded corners.

**PRIMARY — The Signal**

```
Background:  --signal
Text:        --void
Font:        Neue Haas 95, ALL CAPS
Radius:      0
Hover:       box-shadow: --glow-signal (no background shift)
Active:      background: #CC0066
```

**SECONDARY — The Void**

```
Background:  --surface-02
Text:        --light
Border:      1px solid --border-subtle
Hover:       border → --border-active, box-shadow: --glow-white (0.3 opacity)
Active:      background: --surface-03
```

**DESTRUCTIVE — Lock/Kill**

Used only for: End Show, Delete Setlist, Clear Score.

```
Background:  --void
Text:        #FF4444
Border:      1px solid #FF4444
Hover:       box-shadow: 0 0 12px rgba(255,68,68,0.5)
```

> **Size standard:** `height: 44px` minimum (touch target). `padding: 0 --space-04`. All caps tracking.

---

### 4.2 — Score Display

The most important live element on the Operator View. Readable at a glance from 3 feet away in a dark room.

```
┌─────────────────┐  ┌─────────────────┐
│   TEAM O.G.     │  │   TEAM R.O.T.   │
│                 │  │                 │
│      047        │  │      032        │
│                 │  │                 │
│   [−]      [+]  │  │   [−]      [+]  │
└─────────────────┘  └─────────────────┘
```

- Score number: `--type-title` in Space Mono. Cyan glow on O.G. Signal glow on R.O.T.
- Team label: `--type-label` in Space Mono. `--text-secondary`.
- `[+]` and `[-]` buttons: `44×44px` tap targets. Square. No radius. `border: 1px solid --border-subtle`.
- Winning team: glow intensifies (`0 0 30px` spread). Losing team: glow pulls to `0.3` opacity.
- Score never animates on change — it **cuts**. No count-up animations. This is a terminal, not a game show app.

---

### 4.3 — Slide Card (Operator View)

The current slide preview panel. Two states: Current and Next.

**Current Slide**

```
border:     1px solid --border-active
box-shadow: --glow-white
```

Content layout:

```
[REVEAL STATE BADGE]                    [14 / 75]
────────────────────────────────────────────────
T.W.S.S.

That's what she said.
THE OFFICE · S01E02

// HOST NOTES: Pause here. Room needs to breathe.
```

- Acronym: `--type-title`
- Answer: `--type-label --text-secondary` (always visible to operator)
- Source: `--type-meta`
- Reveal state badge: top-right corner

**Next Slide**

```
opacity: 0.5
border:  none
label:   NEXT (--type-meta --text-secondary, top-left)
```

**Reveal State Badge**

| State | Style |
|---|---|
| `HIDDEN` | `background: --surface-03`, text `--text-secondary` |
| `REVEALED` | `background: --signal`, text `--void`, `box-shadow: --glow-signal` |

---

### 4.4 — Section Navigator (Sidebar)

Vertical list. Always visible on Operator View.

```
  THE DOORS           04
▌ CRATE A — O.G.      25   ← ACTIVE
  CRATE B — R.O.T.    25
  THE TAROT DECK      10
  THE VIP SECTION      8
  THE OUTRO            3
```

| State | Style |
|---|---|
| Active | `border-left: 2px solid --light` · text `--text-primary` · `--glow-white` on left edge |
| Inactive | `border-left: 2px solid --border-subtle` · text `--text-secondary` |
| Hover | `background: --surface-03` |

- Slide count: right-aligned, `--text-disabled`
- Click: instant jump to first slide of section. **No animation. Cut.**

---

### 4.5 — Timer Component

```
[ ████████░░░░░░░░  00:47 ]
```

| State | Style |
|---|---|
| Default | Fill: `--light`. Track: `--surface-03`. |
| Under 10s | Fill: `--signal`. `box-shadow: --glow-signal` on fill. |
| Under 5s | Fill pulses: `opacity 1 → 0.4` at 2Hz. Only animation on Operator View. |
| Audience View | **Timer is invisible. Absent from DOM entirely.** |

- Bar: `height: 4px`. No radius.
- Time remaining: Space Mono `--type-label`.

---

### 4.6 — Host Notes Field

The one informal surface. The terminal writing to itself.

```
Background:   --surface-01
Border:       1px solid --border-subtle
Font:         Space Mono regular (not bold)
Case:         Mixed case
Color:        --text-secondary
Placeholder:  // HOST NOTES  (--text-disabled)
Focus:        border → --border-active. No glow.
```

> On Audience View: **does not exist.**

---

### 4.7 — Keyboard Shortcut Overlay

Triggered by `?`. Full-screen modal over Operator View only.

```
Background:   rgba(0,0,0,0.95)
Backdrop blur: none
```

Layout: two-column grid. Key on left, action on right.

```
[ SPACE ] / [ → ]    ADVANCE SLIDE
[ ← ]                PREVIOUS SLIDE
[ R ]                REVEAL / HIDE ANSWER
[ Q ] / [ A ]        CYAN SCORE +/-
[ P ] / [ L ]        PINK SCORE +/-
[ 1 – 6 ]            JUMP TO SECTION
[ T ]                START / STOP TIMER
[ O ]                QR OVERLAY (PHASE 2)
[ ? ]                THIS MENU
[ ESC ]              CLOSE
```

- Key: Space Mono `--type-label`. `--surface-02` box. `border: 1px solid --border-subtle`. Square.
- Action: Space Mono `--type-meta --text-secondary`.

---

### 4.8 — Audience View Slide Anatomy

The Monolith. Full bleed. Two states only.

**Hidden State**

```
                ╔═══════════════════════════════╗   ← 2px CYAN or PINK edge glow
                ║                               ║
                ║                               ║
                ║         T.W.S.S.              ║
                ║                               ║
                ║    ██████████████████████     ║   ← answer blurred
                ║    ██████████████████████     ║
                ║                               ║
                ║      THE OFFICE · S01E02      ║
                ║                               ║
                ╚═══════════════════════════════╝
```

- Acronym: `--type-display`. Neue Haas 95. ALL CAPS. Centred.
- `text-shadow: --glow-white`
- Pulse: `text-shadow` intensity oscillates at 120 BPM. **Nothing moves. Only the light breathes.**
- Answer: `filter: blur(20px)`
- Source: Space Mono `--type-meta --text-secondary`. Bottom. Centred.

**Revealed State**

- Answer: `filter: blur(0)` — **instant cut, zero transition duration**
- Glow surges on reveal for `0.8s` then settles. The only non-instant transition in the system.

> The reveal is the emotional climax of every slide. Everything else serves it by contrast.

---

## SECTION 5 — MOTION PRINCIPLES

Three rules. Non-negotiable.

**Rule 1: Cuts over transitions.**
Navigation between slides, score changes, section jumps — all instant. `transition: none`. The app is a live tool operated under pressure. Transitions waste time and signal hesitation.

**Rule 2: Glow breathes, nothing moves.**
The 120 BPM pulse on acronyms is achieved through `text-shadow` and `opacity` oscillation only. No scale, no translate, no rotate. Elements do not physically move.

**Rule 3: One exception — The Reveal.**
The answer reveal on the Audience View has a `0.8s ease-out` glow surge. This is the single permitted theatrical moment. It exists because the reveal is the emotional climax of every slide. Everything else serves it by contrast.

---

## SECTION 6 — ICONOGRAPHY

Street art stencil standard. Inherited from V6.0 and applied to UI.

**Style:** Industrial vector. Thick strokes (`3px minimum`). Sharp corners. No rounded caps. If it could be a Nike Swoosh or a traffic sign, it's on-brand.

**Sizes:** 24px standard. 16px minimum (never smaller). 32px for Audience View-facing elements.

**Colour:** `--light` by default. Team-coloured only when directly associated with a team element.

### Required Icons

| ICON | STYLE NOTE |
|---|---|
| Timer | Sand timer, sharp angles only |
| Reveal Eye | Industrial, no lash detail |
| Lock | Padlock, thick shackle |
| Section Arrow | Chevron, no curve |
| Score +/- | Plus and minus, heavy weight |
| Notes Pen | Architectural, angled |
| Close | X — not ✕, not ×, full sharp cross |
| Warning | Triangle, no radius on corners |

### Prohibited

- Rounded corners on any icon
- Gradient fills
- Drop shadows on icons
- Any icon that looks like it came from Flaticon

---

## SECTION 7 — STATES & FEEDBACK

No toast notifications. No slide-in alerts. No confetti. State is communicated through glow and colour shifts only.

| STATE | SIGNAL |
|---|---|
| Active / Selected | `border: 1px solid --light` + `--glow-white` |
| Team O.G. active | `border / text: --cyan` + `--glow-cyan` |
| Team R.O.T. active | `border / text: --signal` + `--glow-signal` |
| Error / Warning | Text and border shift to `#FF4444`. Single glow pulse, then holds. |
| Disabled / Locked | `opacity: 0.3`. No interaction. No tooltip. |
| Loading (pre-show only) | Single character `_` blinking cursor in Space Mono. Nothing else. |

---

## SECTION 8 — RESPONSIVE BEHAVIOUR

### Desktop (≥1024px)

Full Operator View. Sidebar visible. Dual-panel layout. Primary use case.

### Tablet (768–1023px)

Sidebar collapses behind a single tap. Reveals section nav as a bottom drawer. Score and slide controls remain full-width.

### Mobile (≤767px)

Two modes. Operator mobile: score tracker and reveal button only — stripped command view for a producer running secondary control. Audience View: full-screen, identical to desktop.

### The Monolith (9:16 Portrait)

Audience View must be tested at `1080×1920`. Acronym display size scales via `clamp`. Source text: absolute bottom with `--space-07` buffer.

---

## SECTION 9 — THE INTEGRITY FILTER

Before any component ships, run it through these. All answers must be YES to pass.

| CHECK | QUESTION |
|---|---|
| **Radius** | Does it have zero rounded corners? |
| **Gradient** | Is it gradient-free? |
| **Motion** | Does it animate only glow opacity, not position or scale? |
| **Palette** | Are all colours on the approved token list? |
| **Origin** | Does it look nothing like a Figma Community template? |
| **Terminal** | Would a Bloomberg terminal designer recognise it as a control surface? |
| **Trust** | Would a host with a mic in their hand trust it at 2 AM? |

> If any answer is NO — kill it and rebuild.

---

## APPENDIX — QUICK REFERENCE

### Color Tokens (Complete)

```css
:root {
  /* Foundation */
  --void:           #000000;
  --light:          #FFFFFF;
  --signal:         #FF007F;
  --cyan:           #00FFFF;
  --gold:           #FFD700;

  /* App Surfaces */
  --surface-01:     #0A0A0A;
  --surface-02:     #111111;
  --surface-03:     #1A1A1A;
  --border-subtle:  #2A2A2A;
  --border-active:  #FFFFFF;
  --text-primary:   #FFFFFF;
  --text-secondary: #666666;
  --text-disabled:  #333333;

  /* Glow */
  --glow-white:  0 0 12px rgba(255,255,255,0.6);
  --glow-signal: 0 0 20px rgba(255,0,127,0.7);
  --glow-cyan:   0 0 20px rgba(0,255,255,0.7);
  --glow-gold:   0 0 16px rgba(255,215,0,0.6);

  /* Spacing */
  --space-01: 4px;
  --space-02: 8px;
  --space-03: 16px;
  --space-04: 24px;
  --space-05: 32px;
  --space-06: 48px;
  --space-07: 64px;
  --space-08: 96px;

  /* Typography */
  --type-display: clamp(4rem, 10vw, 12rem);
  --type-hero:    clamp(2rem, 5vw, 5rem);
  --type-title:   2rem;
  --type-label:   0.875rem;
  --type-meta:    0.75rem;
  --type-note:    0.875rem;
}
```

### Global Resets

```css
* {
  border-radius: 0 !important;
  box-sizing: border-box;
}

body {
  background: var(--void);
  color: var(--text-primary);
  font-family: 'Space Mono', monospace;
  -webkit-font-smoothing: antialiased;
}

.scream {
  font-family: 'Neue Haas Grotesk Display Pro', sans-serif;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.03em;
  line-height: 0.9;
}
```

### 120 BPM Pulse Animation

```css
@keyframes bloom-pulse {
  from { text-shadow: 0 0 8px rgba(255,255,255,0.4); }
  to   { text-shadow: 0 0 24px rgba(255,255,255,0.9); }
}

.acronym-live {
  animation: bloom-pulse 0.5s ease-in-out infinite alternate;
}
```

### Reveal Transition (The One Exception)

```css
.answer {
  filter: blur(20px);
  transition: none;
}

.answer.revealed {
  filter: blur(0);
  text-shadow: 0 0 40px rgba(255,255,255,1);
  transition: text-shadow 0.8s ease-out;
  /* filter cuts instantly. glow fades in. */
}
```

---

*LINECONIC LIVE DESIGN SYSTEM V1.0 — Chloe, CBO. February 2026.*
*Next review: post Sprint 3 dress rehearsal.*

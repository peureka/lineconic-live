# LINECONIC LIVE — PRODUCT ROADMAP
## Epics, User Stories & Build Order

> **STATUS: LIVE DOCUMENT**
> Single source of truth for the Lineconic Live app build.
> Tracked against the Founder Bible V6.0 and Design System V1.0.

---

## ARCHITECTURAL PRINCIPLE

Before the epics: the data model is the foundation. Every format — The Split, The Tarot, The Gauntlet, a future Split Night, a TV taping — is just a **Run of Show** object containing ordered **Sections** containing ordered **Slides**. Build the schema right in Epic 1 and every future format is an import, not a rebuild.

```json
RunOfShow
  └── sections[]
        └── slides[]
              ├── type        (acronym | quote | operational | attract | score | outro)
              ├── team        (og | rot | neutral)
              ├── content     (acronym, answer, source, tarot_modifier)
              ├── reveal_state (hidden | revealed)
              ├── timer_seconds
              └── host_notes
```

---

## EPIC 1 — CORE ENGINE

> **The non-negotiable foundation. Nothing else ships without this.**

The shell. Data model. Keyboard navigation. Dual-view routing. If this isn't bulletproof at 2 AM on a venue's shaky WiFi, everything else is irrelevant.

| ID | USER STORY |
|---|---|
| US-001 | As a host, I can open the app and be routed to Operator View via `?mode=operator` and Audience View via `?mode=audience`, so the two screens are independent from load. |
| US-002 | As a host, I can navigate slides using arrow keys and spacebar so I never touch the trackpad mid-show. |
| US-003 | As a host, the app loads and runs fully offline (PWA, service worker cached) so a dead venue WiFi doesn't kill the show. |
| US-004 | As a host, all session state (current slide, scores, reveal state) persists in localStorage so an accidental browser refresh doesn't reset the show. |
| US-005 | As a developer, the Run of Show is defined as a structured JSON schema so any future format can be loaded without touching application logic. |
| US-006 | As a host, I can press `?` to toggle a keyboard shortcut reference overlay on the Operator View so I'm never guessing a hotkey mid-show. |

---

## EPIC 2 — OPERATOR VIEW

> **The host's control surface. Private. Information-dense.**

Everything the host needs visible at a glance. The Audience View sees nothing from this layer.

| ID | USER STORY |
|---|---|
| US-007 | As a host, I can see the current slide content, reveal state, and slide number (e.g., 14/75) at all times. |
| US-008 | As a host, I can see a "Next Slide" preview panel so I know what's coming without advancing prematurely. |
| US-009 | As a host, I can see a section indicator (The Doors / Crate A / Crate B / Tarot Deck / VIP Section / Outro) so I know where I am in the Run of Show structurally. |
| US-010 | As a host, I can jump directly to any section via a sidebar navigation so I never have to arrow-key through 40 slides mid-show. |
| US-011 | As a host, I can read per-slide host notes on the Operator View (invisible to the Audience View) so I can call the right moment in the room. |
| US-012 | As a host, I can see the live score for both teams (Cyan O.G. / Pink R.O.T.) on the Operator View at all times. |

---

## EPIC 3 — AUDIENCE VIEW (THE MONOLITH)

> **The output. What The Guest List sees. Brand-perfect. Zero controls.**

This screen is half the set design. It must look like it was built for a £5M TV production.

| ID | USER STORY |
|---|---|
| US-013 | As a guest, I see full-bleed void black slides with Soft White Bloom on all white text and no operator UI elements. |
| US-014 | As a guest, I see the acronym in massive outline text pulsing at 120 BPM on all gameplay slides. |
| US-015 | As a guest, I see the answer hidden (blurred) by default on all gameplay slides. |
| US-016 | As a host, I can press `R` to reveal the answer on the Audience View without advancing the slide, so the Hive Mind mechanic plays out correctly. |
| US-017 | As a guest, I see team colour (Cyan / Neon Pink) applied as a border/accent on all team-assigned slides so the Split is visually enforced at all times. |
| US-018 | As a host, I see the Attract Loop slide auto-animate on load and loop until I advance, so the screen is never dead before the show starts. |

---

## EPIC 4 — LIVE SCORING & RECEIPT TRACKER

> **The economy. Points, receipts, dominance.**

| ID | USER STORY |
|---|---|
| US-019 | As a host, I can increment/decrement Cyan and Pink scores via `Q`/`A` (Cyan +/-) and `P`/`L` (Pink +/-) without leaving the current slide. |
| US-020 | As a host, I can see a Receipt Counter on the Operator View that I increment manually as receipts are awarded, tracking total receipts across the show. |
| US-021 | As a guest, I can see the live score on the Audience View at all times (team colours, no number labels — just the score) so the competition is always present in the room. |
| US-022 | As a host, I can trigger the Variable Reward tier display on the Audience View (Instant Cancel / The Grind / The Flop) via a hotkey so the punishment lands visually. |

---

## EPIC 5 — FISHBOWL & RED FLAG QUEUE

> **Pre-show data. The Warm Up engine.**

| ID | USER STORY |
|---|---|
| US-023 | As a host, I can pre-load up to 20 Red Flag submissions into the app before the show via a simple text input form (pre-show mode only). |
| US-024 | As a host, I can cycle through the Red Flag queue on the Operator View during Slide 02 (Vibe Check) via arrow keys, with submissions displayed one at a time. |
| US-025 | As a host, the Red Flag queue is never visible on the Audience View — it exists only as a host prompt. |
| US-026 | As a host, Red Flag submissions persist in localStorage so I can load them before leaving for the venue and access them offline. |

---

## EPIC 6 — SETLIST EDITOR

> **Pre-show only. Locked during live mode.**

| ID | USER STORY |
|---|---|
| US-027 | As a host, I can access a pre-show Setlist Editor where I can reorder slides within a section via drag-and-drop. |
| US-028 | As a host, I can swap a slide within a section for an alternate slide from the content library. |
| US-029 | As a host, the Setlist Editor is locked the moment I enter Live Mode so no accidental edits can occur mid-show. |
| US-030 | As a host, I can save a named Setlist (e.g., "Shoreditch 14 March") to localStorage so I can reuse or reference it for future shows. |
| US-031 | As a developer, new Run of Show formats (e.g., The Split Night, TV Taping format) can be imported as JSON and become available as Setlist templates without code changes. |

---

## EPIC 7 — CONTENT LIBRARY & FORMAT MANAGEMENT

> **The scalability layer. This is what makes it a platform.**

| ID | USER STORY |
|---|---|
| US-032 | As a developer, all slide content lives in a versioned JSON file (`lineconic-ros-v6.json`) separate from application logic so content updates never require a code deploy. |
| US-033 | As a host, I can switch between multiple Run of Show formats from a pre-show selector (e.g., "The Split — 90 min Standard", "The Split Night — 120 min Extended", "TV Taping — Identity Theater"). |
| US-034 | As a developer, each format defines its own section structure, slide types, and timing defaults so a TV taping format with Glass Ceiling mechanics loads correctly without UI hacks. |
| US-035 | As a developer, slide types are extensible (the `type` field in the schema) so new slide types (e.g., a "Competitive Fishbowl" slide, a "Heckler Round" slide) can be added without restructuring existing formats. |

---

## EPIC 8 — PHASE 2 HOOKS (Architecture-Ready, Not Built)

> **Scaffolding only. Ports that future features plug into.**

| ID | USER STORY |
|---|---|
| US-036 | As a developer, the app architecture includes a placeholder QR Overlay trigger (`O` key) that shows a full-screen QR code on the Audience View — wired to a config URL, not built as a feature. |
| US-037 | As a developer, the app architecture includes an audio trigger system (keypress fires a named cue) so Shepard Tone and SFX integration is a content addition, not a structural change. |
| US-038 | As a developer, the Audience View polls localStorage every 500ms for state changes so the multi-device sync upgrade (Operator on laptop, Audience on separate tablet) is a server swap, not a rewrite. |

---

## BUILD ORDER

> One rule governs the sequence: **no epic is testable until its dependency is live.**

### Sprint 1 — Foundation
**Epic 1: Core Engine — complete.**

Ship nothing else until offline navigation, dual-view routing, and the data schema are solid. This sprint has zero visible UI polish. That is correct.

```
Deliverable: App opens. Two URLs. Clicker navigates slides. Works offline.
```

### Sprint 2 — The Views
**Epic 3 + Epic 2 in parallel.**

By end of Sprint 2 you can run a full show — ugly, but functional. First clicker test happens here.

```
Deliverable: Operator View + Audience View live. Answer reveal working.
             First dress rehearsal possible.
```

### Sprint 3 — The Economy
**Epic 4: Scoring & Receipt Tracker.**

The show has stakes now. First full dress rehearsal possible.

```
Deliverable: Live score on both views. Receipt counter. Reward tier triggers.
```

### Sprint 4 — The Warm Up
**Epic 5: Fishbowl & Red Flag Queue.**

Slide 02 becomes operational. Host has material for the roast.

```
Deliverable: Red Flags pre-loaded, cycled on operator view during Vibe Check.
```

### Sprint 5 — Pre-Show Control
**Epic 6: Setlist Editor.**

Host can customise the run for the venue. Named saves. Lock on live mode.

```
Deliverable: Drag-and-drop setlist. Named save. Live Mode lock.
```

### Sprint 6 — The Platform
**Epic 7: Content Library & Format Management.**

The app stops being a single-show tool and becomes a format OS. New Run of Show JSON drops without a developer in the room.

```
Deliverable: Format selector. Versioned JSON content system. Extensible slide types.
```

### Sprint 7 — Future-Proofing
**Epic 8: Phase 2 Hooks.**

QR overlay scaffold, audio trigger ports, localStorage polling bridge. The next developer inherits a clean extension surface, not a tangle.

```
Deliverable: Scaffolded hooks. No regressions. Phase 2 features cost hours, not sprints.
```

---

## SUMMARY

| EPIC | STORIES | SPRINT | STATUS |
|---|---|---|---|
| 1 — Core Engine | US-001 → US-006 | 1 | Not started |
| 2 — Operator View | US-007 → US-012 | 2 | Not started |
| 3 — Audience View | US-013 → US-018 | 2 | Not started |
| 4 — Scoring & Receipts | US-019 → US-022 | 3 | Not started |
| 5 — Fishbowl & Red Flags | US-023 → US-026 | 4 | Not started |
| 6 — Setlist Editor | US-027 → US-031 | 5 | Not started |
| 7 — Content Library | US-032 → US-035 | 6 | Not started |
| 8 — Phase 2 Hooks | US-036 → US-038 | 7 | Not started |
| **TOTAL** | **38 stories** | **7 sprints** | |

---

## RELATED DOCUMENTS

- `LINECONIC_LIVE_DESIGN_SYSTEM_V1.md` — UI surface rules, component specs, token system
- `Founder Bible V6.0` — Brand, lexicon, show mechanics, single source of truth
- `lineconic-ros-v6.json` — Run of Show content (to be created Sprint 6)

---

*LINECONIC LIVE PRODUCT ROADMAP V1.0 — February 2026.*
*Next review: post Sprint 1 completion.*

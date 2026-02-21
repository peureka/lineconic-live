# Launcher Redesign — Role-Based Landing

**Date**: 21 Feb 2026
**Status**: Approved

## Problem

The launcher is a flat grid of 5 identical buttons. Three pain points:

1. **No show status** — can't tell what's loaded, whether Firebase is connected, if the system is ready
2. **Too many clicks** — host manually opens 3 tabs (operator, audience, answers) every time
3. **Looks like a dev tool** — audience members scanning a QR code land on a control panel instead of a welcoming entry point
4. **Builder button bug** — doesn't render reliably due to layout overflow

## Design

### Layout

Desktop: two-panel split (left ~55% host, right ~45% audience). Black background, subtle vertical divider.

Mobile (< 768px): stacked vertically. Audience section first (big JOIN button), host section below behind a collapsible "HOST ACCESS" toggle (collapsed by default).

### Host Panel (left / bottom on mobile)

Three parts:

**Status Card** — bordered card showing loaded show at a glance:
- Show name from `active_show` -> `show_index/{id}`
- Duration (90/60/30 MIN)
- Content filter label (ALL CONTENT / MOVIES ONLY / TV ONLY / MUSIC ONLY / INTERNET ONLY / SCREEN)
- Firebase connection dot (green CONNECTED / red OFFLINE via `.info/connected`)
- Falls back to localStorage `lineconic_show` if Firebase unreachable
- Shows "NO SHOW LOADED" in dimmed style if no show exists

**LAUNCH SHOW button** — primary accent button. On click:
- Navigate current tab to `/operator`
- `window.open('/audience')` in new tab
- `window.open('/answers')` in new tab
- Note under button: "Allow pop-ups for best experience"
- If no show loaded: button text becomes "LAUNCH (DEFAULT SHOW)"

**Secondary links** — row of smaller text links: OPERATOR, AUDIENCE, ANSWERS, BUILDER. For when only one specific page is needed.

### Audience Panel (right / top on mobile)

Single clear call to action:
- "IS THIS CULTURALLY..." tagline
- Large JOIN THE VOTE button (cyan glow, links to `/vote`)
- Explainer text: "Vote DEAD or ALIVE on your phone"
- No operator controls visible on this side

### Data Sources

All existing — no new Firebase paths:
- `active_show` -> `show_index/{id}` for name, duration, mediaFilter
- `.info/connected` for Firebase connection state
- localStorage `lineconic_show` as fallback

### Content Filter Label Mapping

- `[]` or absent -> "ALL CONTENT"
- `['movie']` -> "MOVIES ONLY"
- `['tv']` -> "TV ONLY"
- `['music']` -> "MUSIC ONLY"
- `['internet']` -> "INTERNET ONLY"
- `['movie','tv']` -> "SCREEN"

### Mobile Behaviour

- Audience section renders first, full-width
- HOST ACCESS toggle below, collapsed by default
- Expanding reveals status card + launch button + secondary links
- Breakpoint: 768px (matches existing operator mobile breakpoint)

### Design System

- Tokens: --void, --signal, --cyan, --surface-*, --border-subtle
- Fonts: Anton (headings), Space Mono (meta text)
- No rounded corners — cuts only
- JOIN button uses cyan glow (--cyan + box-shadow)
- LAUNCH button uses signal/pink accent (--signal)

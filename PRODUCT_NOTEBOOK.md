# LINECONIC LIVE - Product Notebook

## Session 1 - 2026-02-19

### What was built

**Live show presentation engine** for LINECONIC LIVE - an interactive game show. The system runs as a static HTML deck on GitHub Pages at `lineconic.live`.

### Decisions made

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Hosting | GitHub Pages (apex domain via A records) | Free, fast, simple for static HTML |
| Deck mode | SHEET (not INLINE) | INLINE shows answers after each question, enabling cheating when swapping scorecards. SHEET batches answers into end-of-round answer sheets |
| Operator sync | BroadcastChannel API (`lineconic-ctrl`) | Zero-latency same-browser sync between presentation window and operator dashboard. No server needed |
| QR library | qrcode-generator v1.4.4 via cdnjs | Replaced custom pseudo-QR encoder. Note: v2.0.4 does NOT exist on cdnjs (returns 404) |
| Firebase region | europe-west1 | For DOA voting system |
| Show content | Blockbuster-only lines | All 45 acronyms verified to match answers. Duplicates eliminated across rounds |

### Files created/modified

| File | Purpose |
|------|---------|
| `TEMPLATE.html` | Master presentation template (~750 lines). All decks are generated from this |
| `generate_deck.js` | Node.js CSV parser that builds INLINE and SHEET HTML decks from TEMPLATE + CSV |
| `SHOW_MASTER_V3.csv` | Show content: 161 rows, all rounds, blockbuster lines |
| `index.html` | Generated SHEET deck (165 slides). This is the live show file |
| `vote/index.html` | Mobile DOA voting page. Title: "LIVE VOTE" |
| `answers.html` | Host answer cheat sheet with all rounds, DOA verdicts, sources |
| `operator/index.html` | Operator dashboard with BroadcastChannel sync for controlling slides remotely |
| `favicon.svg` | Pink L on black rounded square (`#FF007F` on `#000`) |
| `LINECONIC_LIVE_ARCHITECTURE.md` | Architecture document |

### Key technical details

- **Domain**: `lineconic.live` (GitHub Pages, apex domain with A records)
- **Firebase**: project `lineconic-live`, DB URL `https://lineconic-live-default-rtdb.europe-west1.firebasedatabase.app`
- **Design system**: `--bk:#000`, `--cy:#00FFFF`, `--pk:#FF007F`, `--wh:#FFF`, `--gd:#FFD700`; fonts: Anton + Space Mono
- **Branches**: `main` (live site), `sprint-1-core-engine` (React app dev)
- **CommonJS workaround**: `package.json` has `"type": "module"` on sprint branch, so `generate_deck.js` must be copied to `.cjs`: `cp generate_deck.js generate_deck.cjs && node generate_deck.cjs SHOW_MASTER_V3.csv sheet`
- **Rebuild + deploy**: `cp SHOW_MASTER_V3_SHEET.html index.html && git add ... && git commit && git push`

### Bugs fixed

| Bug | Root cause | Fix |
|-----|-----------|-----|
| Vote page 404 | File at wrong path (`mnt/user-data/outputs/...`) | Copied to `vote/index.html` |
| Wrong QR URL | Hardcoded `live.lineconic.com/vote` | Changed to `lineconic.live/vote/` |
| QR not rendering | CDN version `2.0.4` returns 404 | Changed to `1.4.4` |
| Answers visible during play (cheating) | INLINE mode shows answers after each question | Switched to SHEET mode |
| Favicon L not centered | `<text>` element with `y="75%"` | Replaced with `<path d="M10 5h5v17h7v5H10z">` |
| Duplicate lines across rounds | Same quotes appeared in multiple rounds | Replaced all duplicates with unique blockbusters |
| Text too small for back of room | Small default font sizes | Increased tier_title and srcbar clamp values |

### What's pending

- **Firebase security rules** - need to be pasted in Firebase Console (deferred)
- **Sprint 1 React app** - TDD implementation on `sprint-1-core-engine` branch (separate workstream)

---

## Session 2 - Sprint 1-3 Completion - 2026-02-19

### Sprint Status

| Sprint | Epic | Status |
|--------|------|--------|
| 1 - Foundation | Core Engine (US-001-006) | COMPLETE |
| 2 - The Views | Operator + Audience (US-007-018) | COMPLETE |
| 3 - The Economy | Scoring & Receipts (US-019-022) | COMPLETE |

### What was built (Sprint 3)

- **Receipt counter increment**: `C` key + clickable button in operator bar
- **Variable Reward tier display** (US-022): `G` key cycles through Instant Cancel / The Grind / The Flop as full-screen overlay on audience view. Synced via Firebase + BroadcastChannel
- **Homepage Launcher**: Default route shows LINECONIC LIVE landing page with Operator, Audience, Answers, Vote launch buttons. Connection signal and show name displayed
- **Auto-timer** (`A` key): Auto-starts timer on question slides
- **Auto-advance** (`D` key): Auto-advances slide when timer expires
- **Timer options**: 10s, 15s, 30s, 1m duration buttons
- **Connection signal**: Firebase `.info/connected` indicator
- **Quick access buttons**: Open Answer/Vote/Audience in new tabs
- **Answers page redesign**: innerHTML-based rendering, scroll fix
- **Score key remap**: Q/W (cyan +/-), P/O (pink +/-)

### Sprint 3 Backlog (deferred to future sprint)

- **Homepage enhancement**: Show selection, show status, richer landing experience

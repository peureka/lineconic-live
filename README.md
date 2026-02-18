# LINECONIC LIVE

Live show deck and audience voting system for LINECONIC events.

## URLs

- `live.lineconic.com` — Show deck (inline mode, answers after each question)
- `live.lineconic.com/sheet.html` — Show deck (sheet mode, answers at end of round)
- `live.lineconic.com/vote` — Audience voting page (Dead or Alive)

## How to run a show

1. Open `live.lineconic.com` in a browser on the host laptop
2. Press **F** for fullscreen
3. Press **H** to open host controls
4. Use arrow keys or click to advance slides

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| → / Space / Click | Next slide |
| ← | Previous slide |
| H | Host panel |
| S | Scoreboard |
| T | Start timer |
| P | Pause / resume |
| F | Fullscreen |
| M | Mute / unmute |
| A | Auto-timer |
| D | Auto-advance |

## Rebuilding the deck

If you edit the CSV content, rebuild with:

```bash
cd build
node generate_deck.js SHOW_MASTER_V2.csv --name "LINECONIC TABLE FORMAT"
cp SHOW_MASTER_V2_INLINE.html ../index.html
cp SHOW_MASTER_V2_SHEET.html ../sheet.html
```

## Firebase

Real-time voting uses Firebase Realtime Database (europe-west1).  
Project: `lineconic-live`  
The host deck pushes topic names to Firebase. Audience phones read them and vote.

## Stack

- Single-file HTML (no build tools, no dependencies for the show)
- Web Audio API (synthesised sound, no audio files)
- Canvas particle system (receipt rain, flutter)
- Firebase Realtime Database (audience voting)
- GitHub Pages (hosting)

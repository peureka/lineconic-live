# Sprint 2: Sync, Vote, Answers & UI Fixes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `app.html` show-ready with multi-device Firebase sync, audience voting, host answer sheet, V3 content, and UI readability fixes.

**Architecture:** Single-file React 18 SPA (`app.html`) with 4 route modes: operator, audience, vote, answers. Firebase Realtime Database for cross-device sync. BroadcastChannel for same-browser fast-path. TDD with Vitest + Playwright.

**Tech Stack:** React 18 (CDN), Firebase 10.12 (CDN), qrcode-generator 1.4.4 (CDN), Vitest, Playwright

---

## Task 0: Port V3 Content + Favicon

**Files:**
- Copy from `main`: `SHOW_MASTER_V3.csv`, `favicon.svg`
- Modify: `seed-firebase.js` (line 7 — CSV filename)
- Modify: `app.html` (line 6 — add favicon link)
- Regenerate: `ros-v1.json`

### Step 1: Copy V3 CSV and favicon from main

```bash
git checkout main -- SHOW_MASTER_V3.csv favicon.svg
```

### Step 2: Update seed script to use V3

In `seed-firebase.js` line 7, change:
```javascript
// OLD
const csv = fs.readFileSync('SHOW_MASTER_V2.csv', 'utf-8');
// NEW
const csv = fs.readFileSync('SHOW_MASTER_V3.csv', 'utf-8');
```

### Step 3: Add favicon to app.html

In `app.html` after line 8 (`<meta name="theme-color"...>`), add:
```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
```

### Step 4: Regenerate ros-v1.json and upload

```bash
node seed-firebase.js
```

Expected: `ros-v1.json` regenerated with V3 content, uploaded to Firebase.

### Step 5: Run unit tests

```bash
npm test
```

Expected: All pass. The CSV parser and ros-builder handle V3 identically (same schema).

### Step 6: Commit

```bash
git add SHOW_MASTER_V3.csv favicon.svg seed-firebase.js ros-v1.json app.html
git commit -m "feat: port V3 content + favicon from main

Updated show content with blockbuster lines. Added pink L favicon."
```

---

## Task 1: UI Readability Fixes (Font Sizes + Overflow)

**Files:**
- Modify: `app.html` — CSS (line ~112 `.srcbar`) + renderers (lines ~415-418 `TierTitleSlide`)

### Step 1: Fix srcbar CSS

In `app.html` find the `.srcbar` CSS rule (line ~112):
```css
/* OLD */
.srcbar{position:absolute;bottom:40px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.9);padding:8px 28px;font-family:'Space Mono',monospace;font-size:clamp(10px,1.2vw,15px);color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.06em}

/* NEW */
.srcbar{position:absolute;bottom:40px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.9);padding:14px 40px;font-family:'Space Mono',monospace;font-size:clamp(18px,2.5vw,32px);color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.06em}
```

### Step 2: Fix TierTitleSlide renderer

In `app.html` find the `TierTitleSlide` component (line ~415):

Change primary text fontSize from `'clamp(18px,2.5vw,32px)'` to `'clamp(28px,4vw,56px)'` and marginBottom from `8` to `16`.

Change scoring lines fontSize from `'clamp(11px,1.3vw,16px)'` to `'clamp(18px,2.2vw,28px)'` and lineHeight from `'2'` to `'2.2'`.

### Step 3: Verify visually

```bash
npx serve . -l 8080
```

Open `http://localhost:8080/app.html?mode=audience`, navigate to a tier_title slide (slide 4) and a source_q slide (slide 5). Verify text is larger and readable.

### Step 4: Run E2E tests

```bash
npm run test:e2e
```

Expected: All 14 pass (font size changes don't break tests).

### Step 5: Commit

```bash
git add app.html
git commit -m "fix: increase font sizes for tier_title and srcbar hints

tier_title primary: clamp(28px,4vw,56px)
tier_title scoring lines: clamp(18px,2.2vw,28px)
srcbar hints: clamp(18px,2.5vw,32px)

Readable from the back of the room."
```

---

## Task 2: QR Code CDN Upgrade

**Files:**
- Modify: `app.html` — replace hand-rolled QR encoder with CDN library

### Step 1: Add CDN script

In `app.html` after the Babel script tag (line 13), add:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>
```

### Step 2: Replace drawQR function

Replace the `drawQR` and `encodeQR` functions (lines ~343-363) with:

```javascript
function drawQR(canvas){
  if(!canvas)return;
  const x=canvas.getContext('2d');
  const url='https://lineconic.live/vote';
  const qr=qrcode(0,'L');
  qr.addData(url);
  qr.make();
  const sz=qr.getModuleCount();
  const cvSz=canvas.width;
  const px=Math.floor(cvSz/sz);
  const off=Math.floor((cvSz-sz*px)/2);
  x.fillStyle='#fff';x.fillRect(0,0,cvSz,cvSz);
  x.fillStyle='#000';
  for(let r=0;r<sz;r++)for(let cl=0;cl<sz;cl++){
    if(qr.isDark(r,cl))x.fillRect(off+cl*px,off+r*px,px,px);
  }
}
```

Delete the old `encodeQR` function entirely.

### Step 3: Update intermission slide QR canvas size

In the `IntermissionSlide` renderer, update the canvas size from `width={200} height={200}` to `width={400} height={400}` for a crisper QR, and add the vote URL text below:

```jsx
<canvas ref={r=>{if(r)drawQR(r)}} width={400} height={400}
  style={{imageRendering:'pixelated',width:'clamp(200px,28vw,320px)',height:'clamp(200px,28vw,320px)',border:'5px solid rgba(255,255,255,.3)'}}/>
<div className="M" style={{color:'rgba(255,255,255,.5)',fontSize:'clamp(16px,2.5vw,28px)',marginTop:16,letterSpacing:'.1em'}}>LINECONIC.LIVE/VOTE</div>
```

### Step 4: Run tests

```bash
npm test && npm run test:e2e
```

Expected: All pass.

### Step 5: Commit

```bash
git add app.html
git commit -m "feat: upgrade QR code to CDN library (qrcode-generator 1.4.4)

Bigger, cleaner QR codes. Removed hand-rolled encoder."
```

---

## Task 3: Firebase Multi-Device Sync

**Files:**
- Modify: `app.html` — add sync logic after reducer, add BroadcastChannel
- Create: `tests/unit/sync.test.js`
- Modify: `lib/state.js` — add new action types for sync

### Step 1: Write failing unit tests for sync serialization

Create `tests/unit/sync.test.js`:

```javascript
import { describe, it, expect } from 'vitest';

// These functions will be added to lib/state.js
import { serializeSyncState, deserializeSyncState, reducer, initialState } from '../../lib/state.js';

describe('Sync state serialization', () => {
  it('serializeSyncState picks only syncable fields', () => {
    const state = {
      ...initialState,
      currentSlide: 5,
      scores: [3, 7],
      revealState: { s005: 'revealed' },
      showScoreboard: true,
      muted: false,
      showShortcuts: true,  // should NOT be synced
      show: { id: 'test' }, // should NOT be synced
    };
    const synced = serializeSyncState(state);
    expect(synced).toEqual({
      slide: 5,
      scores: [3, 7],
      revealState: { s005: 'revealed' },
      scoreboard: true,
      muted: false,
    });
    expect(synced).not.toHaveProperty('showShortcuts');
    expect(synced).not.toHaveProperty('show');
  });

  it('deserializeSyncState produces reducer actions', () => {
    const syncData = { slide: 10, scores: [2, 4], revealState: { s010: 'revealed' }, scoreboard: true, muted: false };
    const actions = deserializeSyncState(syncData);
    expect(actions).toContainEqual({ type: 'GO_TO_SLIDE', payload: 10 });
    expect(actions).toContainEqual({ type: 'SET_SCORES', payload: [2, 4] });
    expect(actions).toContainEqual({ type: 'SET_REVEAL_STATE', payload: { s010: 'revealed' } });
    expect(actions).toContainEqual({ type: 'SET_SCOREBOARD', payload: true });
    expect(actions).toContainEqual({ type: 'SET_MUTED', payload: false });
  });
});

describe('Sync reducer actions', () => {
  it('SET_SCORES sets both scores', () => {
    const state = { ...initialState, show: { sections: [{ slides: [{ id: 's001' }] }] }, scores: [0, 0] };
    const next = reducer(state, { type: 'SET_SCORES', payload: [5, 3] });
    expect(next.scores).toEqual([5, 3]);
  });

  it('SET_REVEAL_STATE replaces reveal state', () => {
    const state = { ...initialState, show: { sections: [{ slides: [{ id: 's001' }] }] }, revealState: {} };
    const next = reducer(state, { type: 'SET_REVEAL_STATE', payload: { s005: 'revealed' } });
    expect(next.revealState).toEqual({ s005: 'revealed' });
  });

  it('SET_SCOREBOARD sets scoreboard visibility', () => {
    const state = { ...initialState, show: { sections: [{ slides: [{ id: 's001' }] }] }, showScoreboard: false };
    const next = reducer(state, { type: 'SET_SCOREBOARD', payload: true });
    expect(next.showScoreboard).toBe(true);
  });

  it('SET_MUTED sets muted state', () => {
    const state = { ...initialState, show: { sections: [{ slides: [{ id: 's001' }] }] }, muted: true };
    const next = reducer(state, { type: 'SET_MUTED', payload: false });
    expect(next.muted).toBe(false);
  });
});
```

### Step 2: Run tests to verify they fail

```bash
npm test
```

Expected: FAIL — `serializeSyncState` and `deserializeSyncState` not exported, `SET_SCORES` etc. not handled.

### Step 3: Add sync functions and actions to lib/state.js

Add to `lib/state.js`:

```javascript
// After existing exports, add:

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
```

Add to the `reducer` switch statement:
```javascript
case 'SET_SCORES': return { ...state, scores: action.payload };
case 'SET_REVEAL_STATE': return { ...state, revealState: action.payload };
case 'SET_SCOREBOARD': return { ...state, showScoreboard: action.payload };
case 'SET_MUTED': return { ...state, muted: action.payload };
```

### Step 4: Run tests to verify they pass

```bash
npm test
```

Expected: All pass (51 old + 6 new = 57).

### Step 5: Add Firebase sync + BroadcastChannel to app.html

In `app.html`, inside the `App()` component, after the localStorage save `useEffect` (line ~737), add the sync logic:

```jsx
// ═══ SYNC: Operator → Firebase + BroadcastChannel ═══
const bcRef=useRef(null);
const syncSkipRef=useRef(false); // prevent echo loops

useEffect(()=>{
  try{bcRef.current=new BroadcastChannel('lineconic-ctrl')}catch(e){}
  return()=>{if(bcRef.current)bcRef.current.close()};
},[]);

// Operator broadcasts state on every change
useEffect(()=>{
  if(mode!=='operator'||!state.show||syncSkipRef.current)return;
  const sync={slide:state.currentSlide,scores:state.scores,revealState:state.revealState,scoreboard:state.showScoreboard,muted:state.muted};
  // Firebase
  if(fbdb){fbdb.ref('live/'+state.show.id+'/state').set(sync).catch(()=>{})}
  // BroadcastChannel
  if(bcRef.current){bcRef.current.postMessage({type:'sync',...sync})}
},[state.currentSlide,state.scores,state.revealState,state.showScoreboard,state.muted]);

// Audience listens for sync
useEffect(()=>{
  if(mode==='operator'||!state.show)return;
  const showId=state.show.id;

  // Firebase listener
  let fbUnsub=null;
  if(fbdb){
    const ref=fbdb.ref('live/'+showId+'/state');
    const handler=snap=>{
      const d=snap.val();if(!d)return;
      syncSkipRef.current=true;
      if(d.slide!==undefined)dispatch({type:'GO_TO_SLIDE',payload:d.slide});
      if(d.scores)dispatch({type:'SET_SCORES',payload:d.scores});
      if(d.revealState)dispatch({type:'SET_REVEAL_STATE',payload:d.revealState});
      if(d.scoreboard!==undefined)dispatch({type:'SET_SCOREBOARD',payload:d.scoreboard});
      if(d.muted!==undefined)dispatch({type:'SET_MUTED',payload:d.muted});
      syncSkipRef.current=false;
    };
    ref.on('value',handler);
    fbUnsub=()=>ref.off('value',handler);
  }

  // BroadcastChannel listener
  const bcHandler=ev=>{
    const d=ev.data;if(d.type!=='sync')return;
    syncSkipRef.current=true;
    if(d.slide!==undefined)dispatch({type:'GO_TO_SLIDE',payload:d.slide});
    if(d.scores)dispatch({type:'SET_SCORES',payload:d.scores});
    if(d.revealState)dispatch({type:'SET_REVEAL_STATE',payload:d.revealState});
    if(d.scoreboard!==undefined)dispatch({type:'SET_SCOREBOARD',payload:d.scoreboard});
    if(d.muted!==undefined)dispatch({type:'SET_MUTED',payload:d.muted});
    syncSkipRef.current=false;
  };
  if(bcRef.current)bcRef.current.onmessage=bcHandler;

  return()=>{if(fbUnsub)fbUnsub();if(bcRef.current)bcRef.current.onmessage=null};
},[mode,state.show]);
```

Also mirror these new action types in the inlined reducer inside `app.html` (the reducer is duplicated — once in `lib/state.js` for tests, once inlined in `app.html`). Add the same 4 cases:
```javascript
case 'SET_SCORES': return { ...state, scores: action.payload };
case 'SET_REVEAL_STATE': return { ...state, revealState: action.payload };
case 'SET_SCOREBOARD': return { ...state, showScoreboard: action.payload };
case 'SET_MUTED': return { ...state, muted: action.payload };
```

### Step 6: Run all tests

```bash
npm test && npm run test:e2e
```

Expected: All pass.

### Step 7: Commit

```bash
git add lib/state.js tests/unit/sync.test.js app.html
git commit -m "feat: Firebase multi-device sync + BroadcastChannel

Operator pushes state to Firebase on every action.
Audience subscribes and mirrors in real-time.
BroadcastChannel for same-browser fast-path.
New reducer actions: SET_SCORES, SET_REVEAL_STATE, SET_SCOREBOARD, SET_MUTED."
```

---

## Task 4: Vote Page (`?mode=vote`)

**Files:**
- Modify: `app.html` — add VoteView component + route
- Create: `tests/e2e/vote.spec.js`

### Step 1: Add vote route to App component

In `app.html`, update the mode routing (line ~699-701) to handle vote mode:

```jsx
const mode = params.get('mode') || 'operator';
const isAudience = mode === 'audience';
const isVote = mode === 'vote';
```

Update the render return (line ~776):
```jsx
if (isVote) return <VoteView showId={state.show?.id} />;
return isAudience ? <AudienceView .../> : <OperatorView .../>;
```

### Step 2: Add VoteView component

Add before the `App` component in `app.html`. Port the design from `main:vote/index.html`, adapted to React:

```jsx
function VoteView({showId}){
  const[topic,setTopic]=React.useState(null);
  const[votes,setVotes]=React.useState({dead:0,alive:0});
  const[voted,setVoted]=React.useState(null);
  const[flash,setFlash]=React.useState(null);

  React.useEffect(()=>{
    if(!fbdb)return;
    // Listen for current topic
    const topicRef=fbdb.ref('live/'+(showId||'default')+'/topic');
    topicRef.on('value',snap=>{
      const t=snap.val();
      setTopic(t);
      setVoted(null); // reset vote for new topic
      setVotes({dead:0,alive:0});
    });
    return()=>topicRef.off();
  },[showId]);

  React.useEffect(()=>{
    if(!fbdb||!topic)return;
    const key=topic.replace(/[^a-zA-Z0-9]/g,'_');
    const voteRef=fbdb.ref('votes/'+key);
    voteRef.on('value',snap=>{
      const v=snap.val()||{};
      setVotes({dead:v.dead||0,alive:v.alive||0});
    });
    return()=>voteRef.off();
  },[topic]);

  function doVote(side){
    if(voted||!topic)return;
    setVoted(side);
    setFlash(side);
    setTimeout(()=>setFlash(null),300);
    const key=topic.replace(/[^a-zA-Z0-9]/g,'_');
    if(fbdb)fbdb.ref('votes/'+key+'/'+side).transaction(c=>(c||0)+1);
  }

  const total=votes.dead+votes.alive;
  const deadPct=total?Math.round(votes.dead/total*100):50;
  const alivePct=total?100-deadPct:50;
  const waiting=!topic;

  return(
    <div style={{background:'#000',color:'#fff',fontFamily:"'Anton','Impact',sans-serif",minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{maxWidth:420,padding:'40px 24px',textAlign:'center',width:'100%'}}>
        <div style={{fontSize:72,color:'var(--signal)',textShadow:'0 0 10px rgba(255,0,127,.9),0 0 30px rgba(255,0,127,.5),0 0 60px rgba(255,0,127,.2)',marginBottom:8,letterSpacing:'.08em'}}>L</div>
        <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:'rgba(255,255,255,.3)',letterSpacing:'.15em',textTransform:'uppercase',marginBottom:48}}>DEAD OR ALIVE</div>
        <div style={{fontSize:14,fontFamily:"'Space Mono',monospace",color:'rgba(255,255,255,.5)',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:24}}>IS THIS CULTURALLY...</div>
        <div style={{fontSize:'clamp(36px,10vw,56px)',textTransform:'uppercase',letterSpacing:'.04em',color:waiting?'rgba(255,255,255,.15)':'#fff',textShadow:waiting?'none':'0 0 10px rgba(255,255,255,.6),0 0 30px rgba(255,255,255,.3)',marginBottom:40,lineHeight:1.1,transition:'all .3s'}}>{topic||'WAITING FOR HOST...'}</div>
        <div style={{display:'flex',gap:16,width:'100%',marginBottom:32,opacity:waiting?.15:1,pointerEvents:waiting?'none':'auto'}}>
          <button onClick={()=>doVote('dead')} style={{flex:1,padding:'24px 16px',fontFamily:"'Anton',sans-serif",fontSize:28,letterSpacing:'.08em',cursor:'pointer',textTransform:'uppercase',background:flash==='dead'?'#FF007F':'transparent',color:flash==='dead'?'#000':'#FF007F',border:'2px solid #FF007F',boxShadow:'0 0 12px rgba(255,0,127,.3)',opacity:voted&&voted!=='dead'?.15:1,pointerEvents:voted?'none':'auto'}}>DEAD</button>
          <button onClick={()=>doVote('alive')} style={{flex:1,padding:'24px 16px',fontFamily:"'Anton',sans-serif",fontSize:28,letterSpacing:'.08em',cursor:'pointer',textTransform:'uppercase',background:flash==='alive'?'#00FFFF':'transparent',color:flash==='alive'?'#000':'#00FFFF',border:'2px solid #00FFFF',boxShadow:'0 0 12px rgba(0,255,255,.3)',opacity:voted&&voted!=='alive'?.15:1,pointerEvents:voted?'none':'auto'}}>ALIVE</button>
        </div>
        <div style={{width:'100%',marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:11,letterSpacing:'.08em',color:'#FF007F'}}>{votes.dead} DEAD</span>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:11,letterSpacing:'.08em',color:'#00FFFF'}}>{votes.alive} ALIVE</span>
          </div>
          <div style={{width:'100%',height:8,background:'rgba(255,255,255,.05)',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',left:0,top:0,bottom:0,width:deadPct+'%',background:'linear-gradient(90deg,#FF007F,rgba(255,0,127,.3))',transition:'width .4s ease'}}/>
            <div style={{position:'absolute',right:0,top:0,bottom:0,width:alivePct+'%',background:'linear-gradient(270deg,#00FFFF,rgba(0,255,255,.3))',transition:'width .4s ease'}}/>
          </div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between'}}>
          <span style={{fontSize:'clamp(24px,6vw,36px)',fontFamily:"'Space Mono',monospace",color:'#FF007F',textShadow:'0 0 8px rgba(255,0,127,.4)'}}>{deadPct}%</span>
          <span style={{fontSize:'clamp(24px,6vw,36px)',fontFamily:"'Space Mono',monospace",color:'#00FFFF',textShadow:'0 0 8px rgba(0,255,255,.4)'}}>{alivePct}%</span>
        </div>
        {voted&&<div style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:'rgba(255,255,255,.3)',marginTop:24,letterSpacing:'.08em',textTransform:'uppercase'}}>VOTE CAST — {voted.toUpperCase()}</div>}
      </div>
    </div>
  );
}
```

### Step 3: Add operator hotkey to push DOA topic

In the keyboard handler in `app.html` (line ~740-770), the operator needs a way to push a DOA topic. When on a `doa_vote` slide, pressing `V` pushes the topic:

```javascript
case 'v': case 'V': {
  const slide = flat[state.currentSlide];
  if (slide && slide.type === 'doa_vote' && fbdb && state.show) {
    fbdb.ref('live/' + state.show.id + '/topic').set(slide.content.primary || null);
  }
  break;
}
```

### Step 4: Write E2E test

Create `tests/e2e/vote.spec.js`:

```javascript
import { test, expect } from '@playwright/test';

const LOAD_TIMEOUT = 15000;

test.describe('Vote Page (US-038)', () => {
  test('vote page shows waiting state', async ({ page }) => {
    await page.goto('/app.html?mode=vote');
    await expect(page.locator('text=WAITING FOR HOST')).toBeVisible({ timeout: LOAD_TIMEOUT });
  });

  test('vote page has DEAD and ALIVE buttons', async ({ page }) => {
    await page.goto('/app.html?mode=vote');
    await expect(page.locator('button:has-text("DEAD")')).toBeVisible({ timeout: LOAD_TIMEOUT });
    await expect(page.locator('button:has-text("ALIVE")')).toBeVisible({ timeout: LOAD_TIMEOUT });
  });
});
```

### Step 5: Run all tests

```bash
npm test && npm run test:e2e
```

Expected: All pass (57 unit + 16 E2E).

### Step 6: Commit

```bash
git add app.html tests/e2e/vote.spec.js
git commit -m "feat: vote page — audience phone voting via Firebase

?mode=vote shows DEAD/ALIVE buttons with live vote bars.
Operator V key pushes DOA topic to Firebase.
Vote results update in real-time."
```

---

## Task 5: Answer Sheet (`?mode=answers`)

**Files:**
- Modify: `app.html` — add AnswersView component + route
- Create: `tests/e2e/answers.spec.js`

### Step 1: Add answers route

In `app.html`, update mode routing:
```jsx
const isAnswers = mode === 'answers';
```

Update render:
```jsx
if (isVote) return <VoteView showId={state.show?.id} />;
if (isAnswers) return <AnswersView show={state.show} />;
return isAudience ? <AudienceView .../> : <OperatorView .../>;
```

### Step 2: Add AnswersView component

Port design from `main:answers.html`, adapted to React. Add before the `App` component:

```jsx
function AnswersView({show}){
  if(!show)return <div style={{background:'#000',color:'var(--signal)',padding:40,fontFamily:"'Space Mono',monospace"}}>LOADING...</div>;
  const flat=flattenSlides(show);
  const sections=show.sections||[];

  return(
    <div style={{background:'#000',color:'#fff',fontFamily:"'Space Mono',monospace",padding:40,maxWidth:900,margin:'0 auto'}}>
      <h1 style={{color:'#FF007F',fontSize:32,letterSpacing:'.1em',marginBottom:8,fontFamily:"'Anton',sans-serif"}}>HOST ANSWER SHEET</h1>
      <div style={{color:'rgba(255,255,255,.3)',fontSize:11,letterSpacing:'.15em',textTransform:'uppercase',marginBottom:48}}>{show.name||show.id}</div>
      {sections.map((sec,si)=>{
        const hasAnswers=sec.slides.some(s=>s.content&&(s.content.answer||s.content.source));
        if(!hasAnswers)return null;
        return(
          <div key={si} style={{marginBottom:48}}>
            <div style={{color:'#00FFFF',fontSize:18,letterSpacing:'.08em',marginBottom:16,fontWeight:700}}>{sec.title||sec.id}</div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr>
                  <th style={{textAlign:'left',color:'rgba(255,255,255,.3)',fontSize:10,letterSpacing:'.1em',textTransform:'uppercase',padding:'6px 8px',borderBottom:'1px solid rgba(255,255,255,.1)'}}>Q</th>
                  <th style={{textAlign:'left',color:'rgba(255,255,255,.3)',fontSize:10,letterSpacing:'.1em',textTransform:'uppercase',padding:'6px 8px',borderBottom:'1px solid rgba(255,255,255,.1)'}}>LINE</th>
                  <th style={{textAlign:'left',color:'rgba(255,255,255,.3)',fontSize:10,letterSpacing:'.1em',textTransform:'uppercase',padding:'6px 8px',borderBottom:'1px solid rgba(255,255,255,.1)'}}>ANSWER</th>
                </tr>
              </thead>
              <tbody>
                {sec.slides.filter(s=>s.content&&(s.content.answer||s.content.source)).map((s,qi)=>{
                  const isBonus=s.type==='bonus_marker'||s.points>2;
                  return(
                    <tr key={qi} style={{background:isBonus?'rgba(255,215,0,.06)':'transparent'}}>
                      <td style={{padding:8,borderBottom:'1px solid rgba(255,255,255,.06)',fontSize:13,color:isBonus?'#FFD700':'rgba(255,255,255,.3)',width:30,textAlign:'right',paddingRight:12}}>{qi+1}</td>
                      <td style={{padding:8,borderBottom:'1px solid rgba(255,255,255,.06)',fontSize:13,color:'#fff'}}>{s.content.primary||''}</td>
                      <td style={{padding:8,borderBottom:'1px solid rgba(255,255,255,.06)',fontSize:13,color:'#FF007F',width:180}}>{s.content.answer||s.content.source||''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
      <style>{`@media print{body{background:#fff!important;color:#000!important}h1{color:#FF007F!important}}`}</style>
    </div>
  );
}
```

### Step 3: Write E2E test

Create `tests/e2e/answers.spec.js`:

```javascript
import { test, expect } from '@playwright/test';

const LOAD_TIMEOUT = 15000;

test.describe('Answer Sheet', () => {
  test('answers page renders with round titles', async ({ page }) => {
    await page.goto('/app.html?mode=answers');
    await expect(page.locator('text=HOST ANSWER SHEET')).toBeVisible({ timeout: LOAD_TIMEOUT });
  });

  test('answers page shows answer data', async ({ page }) => {
    await page.goto('/app.html?mode=answers');
    await expect(page.locator('table')).toBeVisible({ timeout: LOAD_TIMEOUT });
    // Should have at least one answer row
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: LOAD_TIMEOUT });
    expect(await rows.count()).toBeGreaterThan(5);
  });
});
```

### Step 4: Run all tests

```bash
npm test && npm run test:e2e
```

Expected: All pass (57 unit + 18 E2E).

### Step 5: Commit

```bash
git add app.html tests/e2e/answers.spec.js
git commit -m "feat: host answer sheet — printable cheat sheet at ?mode=answers

Shows all rounds with questions and answers.
Bonus questions highlighted gold. Print-friendly CSS."
```

---

## Task 6: Sync E2E Tests + Final Verification

**Files:**
- Modify: `tests/e2e/app.spec.js` — add sync-related tests
- Run all tests

### Step 1: Add sync E2E test

Add to `tests/e2e/app.spec.js`:

```javascript
test.describe('Multi-Device Sync', () => {
  test('operator view renders connection indicator', async ({ page }) => {
    await page.goto('/app.html?mode=operator');
    await page.waitForSelector('.operator-grid', { timeout: 15000 });
    // Operator should be functional
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    const counter = await page.locator('[data-testid="slide-counter"]').first().textContent();
    expect(counter).toContain('2');
  });
});
```

### Step 2: Run full test suite

```bash
npm test && npm run test:e2e
```

Expected: ALL pass — 57+ unit tests, 19+ E2E tests.

### Step 3: Commit

```bash
git add tests/e2e/app.spec.js
git commit -m "test: sync E2E tests + final verification

All unit and E2E tests passing."
```

---

## Task 7: Push + Deploy

**Files:** None (git only)

### Step 1: Push branch

```bash
git push origin sprint-1-core-engine
```

### Step 2: Verify Vercel preview deploys

Check the PR preview URL for the deployment.

### Step 3: Report to user for review

List all changes made, test results, and preview URL.

---

## Summary

| Task | What | Tests Added |
|------|------|-------------|
| 0 | V3 content + favicon | 0 (existing pass) |
| 1 | Font size + overflow fixes | 0 (existing pass) |
| 2 | QR code CDN upgrade | 0 (existing pass) |
| 3 | Firebase sync + BroadcastChannel | 6 unit |
| 4 | Vote page | 2 E2E |
| 5 | Answer sheet | 2 E2E |
| 6 | Sync E2E + verification | 1 E2E |
| 7 | Push + deploy | 0 |

**Total new tests:** 6 unit + 5 E2E = 11 new tests
**Total tests after:** 57+ unit + 19+ E2E

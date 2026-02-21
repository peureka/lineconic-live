# Launcher Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the flat button grid launcher with a role-based split-screen landing page — host mission control on the left, audience entry on the right.

**Architecture:** Single-file change to `app.html`. Replace `LauncherView` component and its CSS classes. Add a `LauncherStatusCard` sub-component that reads Firebase `active_show` + `show_index` + `.info/connected`. All data sources already exist — no new Firebase paths.

**Tech Stack:** React 18 (CDN/Babel), Firebase Realtime Database (compat SDK), existing design tokens.

**Design doc:** `docs/plans/2025-02-21-launcher-redesign-design.md`

---

### Task 1: Replace Launcher CSS

**Files:**
- Modify: `app.html` — CSS section (lines ~238-245, ~367-372, ~394-398)

**Step 1: Replace the launcher CSS block**

Remove the old `.launcher-view`, `.launcher-grid`, `.launcher-btn`, `.launcher-btn-sub`, `.launcher-meta` rules (lines 238-245) and replace with:

```css
/* Launcher View — Role-Based Split */
.launcher-view{position:fixed;inset:0;background:var(--void);display:flex;flex-direction:row;align-items:stretch}
.launcher-host{flex:0 0 55%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--space-05);padding:var(--space-06);border-right:1px solid var(--border-subtle)}
.launcher-audience{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--space-05);padding:var(--space-06)}
.launcher-title{font-family:'Anton','Impact',sans-serif;text-transform:uppercase;font-size:clamp(48px,12vw,120px);letter-spacing:.06em;line-height:1;text-align:center}

/* Status Card */
.launcher-status{border:1px solid var(--border-subtle);padding:var(--space-04);width:100%;max-width:360px}
.launcher-status-name{font-family:'Anton',sans-serif;font-size:clamp(18px,2.5vw,28px);color:var(--text-primary);text-transform:uppercase;letter-spacing:.04em;line-height:1.2;margin-bottom:var(--space-02)}
.launcher-status-meta{font-family:'Space Mono',monospace;font-size:11px;color:var(--text-secondary);letter-spacing:.06em;text-transform:uppercase;display:flex;align-items:center;gap:var(--space-02);flex-wrap:wrap}
.launcher-status-empty{font-family:'Space Mono',monospace;font-size:12px;color:var(--text-disabled);letter-spacing:.06em;text-transform:uppercase;text-align:center;padding:var(--space-03) 0}
.launcher-conn{display:flex;align-items:center;gap:6px}
.launcher-conn-dot{width:8px;height:8px;display:inline-block}
.launcher-conn-dot.on{background:var(--cyan);box-shadow:0 0 6px rgba(0,255,255,.8)}
.launcher-conn-dot.off{background:var(--signal);box-shadow:0 0 6px rgba(255,0,127,.8)}

/* Launch Button */
.launcher-launch{width:100%;max-width:360px;padding:var(--space-04) var(--space-03);border:2px solid var(--signal);background:transparent;color:var(--signal);font-family:'Anton',sans-serif;font-size:clamp(20px,3vw,32px);letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:all .15s}
.launcher-launch:hover{background:var(--signal);color:var(--void);box-shadow:var(--glow-signal)}

/* Secondary Links */
.launcher-links{display:flex;gap:var(--space-04);flex-wrap:wrap;justify-content:center}
.launcher-link{font-family:'Space Mono',monospace;font-size:11px;color:var(--text-disabled);letter-spacing:.08em;text-transform:uppercase;text-decoration:none;transition:color .15s}
.launcher-link:hover{color:var(--text-primary)}

/* Audience Panel */
.launcher-join{display:block;width:100%;max-width:320px;padding:var(--space-05) var(--space-04);border:2px solid var(--cyan);background:transparent;color:var(--cyan);font-family:'Anton',sans-serif;font-size:clamp(24px,4vw,40px);letter-spacing:.06em;text-transform:uppercase;text-decoration:none;text-align:center;cursor:pointer;transition:all .15s}
.launcher-join:hover{background:var(--cyan);color:var(--void);box-shadow:var(--glow-cyan)}
.launcher-tagline{font-family:'Anton',sans-serif;font-size:clamp(16px,3vw,28px);color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.06em;text-align:center}
.launcher-explain{font-family:'Space Mono',monospace;font-size:11px;color:var(--text-disabled);letter-spacing:.06em;text-transform:uppercase;text-align:center}

/* Host Access Toggle (mobile only) */
.launcher-host-toggle{display:none;width:100%;padding:var(--space-03) var(--space-04);border:1px solid var(--border-subtle);background:transparent;color:var(--text-disabled);font-family:'Space Mono',monospace;font-size:12px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;text-align:center;transition:color .15s}
.launcher-host-toggle:hover{color:var(--text-primary)}

/* Footer */
.launcher-footer{font-family:'Space Mono',monospace;font-size:9px;color:rgba(255,255,255,.1);letter-spacing:.1em;text-transform:uppercase;text-align:center;padding:var(--space-03)}
```

**Step 2: Replace the mobile portrait responsive overrides**

Remove old launcher rules from the `@media(max-width:768px)` block (~lines 367-372) and replace:

```css
/* Launcher mobile — stacked, audience first */
.launcher-view{flex-direction:column;align-items:stretch}
.launcher-host{flex:none;border-right:none;border-top:1px solid var(--border-subtle);padding:var(--space-04);gap:var(--space-03);order:2}
.launcher-audience{flex:none;padding:var(--space-05) var(--space-04);order:1}
.launcher-host-toggle{display:block;order:2}
.launcher-host.collapsed{display:none}
.launcher-title{font-size:clamp(40px,14vw,72px)}
.launcher-status{max-width:100%}
.launcher-launch{max-width:100%}
.launcher-join{max-width:100%}
```

**Step 3: Replace the landscape responsive overrides**

Remove old launcher rules from the `@media(max-height:500px)` block (~lines 394-398) and replace:

```css
/* Launcher landscape — side-by-side but compact */
.launcher-view{flex-direction:row}
.launcher-host{padding:var(--space-03);gap:var(--space-02)}
.launcher-audience{padding:var(--space-03);gap:var(--space-03)}
.launcher-title{font-size:clamp(28px,8vh,60px)}
.launcher-host-toggle{display:none}
.launcher-host.collapsed{display:flex}
```

**Step 4: Commit**

```bash
git add app.html
git commit -m "style: launcher CSS — role-based split layout with status card"
```

---

### Task 2: LauncherStatusCard Component

**Files:**
- Modify: `app.html` — add new component before `LauncherView` (~line 780)

**Step 1: Write the LauncherStatusCard component**

Add this function before `LauncherView`:

```javascript
function LauncherStatusCard(){
  var[connected,setConnected]=useState(false);
  var[showInfo,setShowInfo]=useState(null);

  useEffect(function(){
    // Firebase connection status
    if(!fbdb)return;
    var connRef=fbdb.ref('.info/connected');
    var connHandler=function(snap){setConnected(!!snap.val())};
    connRef.on('value',connHandler);

    // Load active show info
    fbdb.ref('active_show').on('value',function(snap){
      var activeId=snap.val();
      if(!activeId){setShowInfo(null);return}
      fbdb.ref('show_index/'+activeId).once('value',function(iSnap){
        var info=iSnap.val();
        if(info){setShowInfo(info)}else{setShowInfo(null)}
      });
    });

    return function(){connRef.off('value',connHandler);fbdb.ref('active_show').off()};
  },[]);

  // Fallback to localStorage if no Firebase data
  useEffect(function(){
    if(showInfo||!fbdb)return;
    try{
      var cached=JSON.parse(localStorage.getItem('lineconic_show'));
      if(cached&&cached.name){setShowInfo({name:cached.name,duration:cached.duration||null,mediaFilter:cached.mediaFilter||[]})}
    }catch(e){}
  },[showInfo]);

  var filterLabel=function(mf){
    if(!mf||!mf.length)return'ALL CONTENT';
    var sorted=mf.slice().sort().join(',');
    var map={'internet':'INTERNET ONLY','movie':'MOVIES ONLY','movie,tv':'SCREEN','music':'MUSIC ONLY','tv':'TV ONLY'};
    return map[sorted]||mf.join(' + ').toUpperCase();
  };

  if(!showInfo){
    return React.createElement('div',{className:'launcher-status'},
      React.createElement('div',{className:'launcher-status-empty'},'NO SHOW LOADED'),
      React.createElement('div',{className:'launcher-status-meta',style:{justifyContent:'center',marginTop:'var(--space-02)'}},
        React.createElement('span',{className:'launcher-conn'},
          React.createElement('span',{className:'launcher-conn-dot '+(connected?'on':'off')}),
          connected?'CONNECTED':'OFFLINE'
        )
      )
    );
  }

  var dur=showInfo.duration?(showInfo.duration+' MIN'):'';
  var filt=filterLabel(showInfo.mediaFilter);

  return React.createElement('div',{className:'launcher-status'},
    React.createElement('div',{className:'launcher-status-name'},showInfo.name),
    React.createElement('div',{className:'launcher-status-meta'},
      dur&&React.createElement('span',null,dur),
      dur&&filt&&React.createElement('span',{style:{color:'var(--border-subtle)'}},'·'),
      React.createElement('span',null,filt),
      React.createElement('span',{style:{color:'var(--border-subtle)'}},'·'),
      React.createElement('span',{className:'launcher-conn'},
        React.createElement('span',{className:'launcher-conn-dot '+(connected?'on':'off')}),
        connected?'CONNECTED':'OFFLINE'
      )
    )
  );
}
```

**Step 2: Commit**

```bash
git add app.html
git commit -m "feat: LauncherStatusCard — shows loaded show + Firebase status"
```

---

### Task 3: Replace LauncherView Component

**Files:**
- Modify: `app.html` — replace `LauncherView` function (~lines 780-795)

**Step 1: Replace LauncherView with the role-based layout**

```jsx
function LauncherView({showName}){
  var[hostOpen,setHostOpen]=useState(false);
  var hasShow=!!showName;

  function handleLaunch(){
    window.open('/audience','_blank');
    window.open('/answers','_blank');
    window.location.href='/operator';
  }

  return(
    <div className="launcher-view">
      {/* AUDIENCE PANEL — right on desktop, top on mobile */}
      <div className="launcher-audience">
        <div>
          <a href="/" style={{textDecoration:'none'}}>
            <div className="launcher-title hp">LINECONIC</div>
            <div className="launcher-title hs" style={{fontSize:'clamp(16px,4vw,32px)',letterSpacing:'.2em',marginTop:8}}>LIVE</div>
          </a>
        </div>
        <div className="launcher-tagline">IS THIS CULTURALLY...</div>
        <a className="launcher-join" href="/vote">JOIN THE VOTE</a>
        <div className="launcher-explain">VOTE DEAD OR ALIVE ON YOUR PHONE</div>
      </div>

      {/* HOST ACCESS TOGGLE — mobile only */}
      <button className="launcher-host-toggle" onClick={function(){setHostOpen(function(v){return!v})}}>
        {hostOpen?'HIDE HOST CONTROLS':'HOST ACCESS'}
      </button>

      {/* HOST PANEL — left on desktop, bottom on mobile */}
      <div className={'launcher-host'+(hostOpen?'':' collapsed')}>
        <LauncherStatusCard/>
        <button className="launcher-launch" onClick={handleLaunch}>
          {hasShow?'LAUNCH SHOW':'LAUNCH (DEFAULT SHOW)'}
        </button>
        <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:'var(--text-disabled)',letterSpacing:'.06em',textTransform:'uppercase',textAlign:'center'}}>ALLOW POP-UPS FOR BEST EXPERIENCE</div>
        <div className="launcher-links">
          <a className="launcher-link" href="/operator">OPERATOR</a>
          <a className="launcher-link" href="/audience" target="_blank" rel="noopener">AUDIENCE</a>
          <a className="launcher-link" href="/answers" target="_blank" rel="noopener">ANSWERS</a>
          <a className="launcher-link" href="/builder">BUILDER</a>
        </div>
      </div>

      <div className="launcher-footer">LINECONIC.COM</div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app.html
git commit -m "feat: role-based launcher — host panel + audience panel + one-click launch"
```

---

### Task 4: Visual Verification

**Step 1: Deploy to Vercel**

```bash
git checkout main && git merge sprint-1-core-engine && git push origin main && git checkout sprint-1-core-engine
```

**Step 2: Screenshot desktop layout**

Open `https://lineconic-live.vercel.app/` at 1280x800 and verify:
- Two-panel split visible
- Left panel has: status card (show name, duration, filter, connection dot), LAUNCH SHOW button, secondary links
- Right panel has: LINECONIC LIVE title, tagline, JOIN THE VOTE button, explainer text
- Vertical divider between panels
- Builder link visible in secondary links

**Step 3: Screenshot mobile layout**

Open at 390x844 and verify:
- Audience section at top with JOIN THE VOTE button
- HOST ACCESS toggle visible below
- Host panel hidden by default
- Tap HOST ACCESS to expand — shows status card + launch button + links

**Step 4: Test LAUNCH SHOW button**

Click LAUNCH SHOW and verify:
- Current tab navigates to `/operator`
- `/audience` opens in new tab
- `/answers` opens in new tab

**Step 5: Commit any adjustments and final merge**

```bash
git add app.html
git commit -m "polish: launcher layout adjustments from visual review"
git checkout main && git merge sprint-1-core-engine && git push origin main
```

---

### Task Summary

| Task | Description | Est. |
|------|-------------|------|
| 1 | Replace launcher CSS (split layout, status card, buttons) | 3 min |
| 2 | LauncherStatusCard component (Firebase status + show info) | 3 min |
| 3 | Replace LauncherView with role-based layout | 3 min |
| 4 | Visual verification (desktop + mobile + launch test) | 5 min |

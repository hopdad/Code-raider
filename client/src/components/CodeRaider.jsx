import { useState, useEffect, useCallback } from 'react';

const mono = "'Consolas','Menlo','Monaco','Courier New',monospace";

// Props:
//   buffer         string[]  — [current, next] from socket
//   onTried        ()=>void  — mark current tried
//   onFound        ()=>void  — mark current found
//   onDismissFound ()=>void  — after seeing the found screen, continue
//   roster         object[]  — { steam_id, username, online, slot }
//   progress       { tried, total }
//   myFound        string|null — code I personally just found
//   user           { steamId, username }

export default function CodeRaider({ buffer, onTried, onFound, onDismissFound, roster, progress, myFound, user }) {
  const [flash, setFlash] = useState(null); // 'tried' | 'found'

  const current = buffer[0] ?? null;
  const next    = buffer[1] ?? null;
  const pct     = progress.total ? (progress.tried / progress.total) * 100 : 0;

  const pulse = useCallback((type) => {
    setFlash(type);
    setTimeout(() => setFlash(null), 300);
  }, []);

  const handleTried = useCallback(() => {
    if (!current || myFound) return;
    pulse('tried');
    onTried();
  }, [current, myFound, pulse, onTried]);

  const handleFound = useCallback(() => {
    if (!current || myFound) return;
    pulse('found');
    onFound();
  }, [current, myFound, pulse, onFound]);

  // Keyboard: Space / Enter = tried (no shortcut for found — button only)
  useEffect(() => {
    const onKey = (e) => {
      if (myFound) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
          e.preventDefault();
          onDismissFound();
        }
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleTried(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [myFound, handleTried, onDismissFound]);

  const mainBg =
    flash === 'found' ? '#071A0C' :
    flash === 'tried' ? '#160A0A' :
    '#0F0D0A';

  // Teammates: roster members that aren't me, max 3 shown
  const teammates = (roster ?? []).filter(r => r.steam_id !== user?.steamId).slice(0, 4);

  return (
    <div style={{ background: mainBg, height: '100%', color: '#C8C0B8', fontFamily: mono, display: 'flex', flexDirection: 'column', userSelect: 'none', transition: 'background 0.2s' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ background: '#141210', borderBottom: '1px solid #222018', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, background: '#C45C1A', borderRadius: '50%', boxShadow: '0 0 7px #C45C1A88' }} />
          <span style={{ color: '#C45C1A', fontSize: 12, fontWeight: 700, letterSpacing: '0.16em' }}>CODE RAIDER</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 14 }}>
          <RosterPip name="YOU" online={true} />
          {teammates.map(t => <RosterPip key={t.steam_id} name={t.username?.toUpperCase().slice(0, 8)} online={t.online} />)}
        </div>
      </div>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>

        {myFound ? (
          /* ── Found state ─────────────────────────────────────────────── */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <span style={{ fontSize: 10, color: '#32A050', letterSpacing: '0.22em' }}>DOOR OPEN</span>
            <div style={{ display: 'flex', gap: 14 }} onClick={onDismissFound}>
              {myFound.split('').map((d, i) => <Digit key={i} char={d} variant="found" size="lg" />)}
            </div>
            <button onClick={onDismissFound} style={{ background: 'none', border: '1px solid #1E5C2A', color: '#32A050', padding: '6px 20px', fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', cursor: 'pointer' }}>
              CONTINUE RAIDING
            </button>
          </div>

        ) : (
          /* ── Normal dispenser ────────────────────────────────────────── */
          <>
            <span style={{ fontSize: 10, color: '#373330', letterSpacing: '0.2em' }}>YOUR CODE</span>

            {/* Current code — tap to mark tried on mobile */}
            <div style={{ display: 'flex', gap: 14, cursor: 'pointer' }} onClick={handleTried} title="Tap to mark tried">
              {(current ?? '----').split('').map((d, i) => <Digit key={i} char={d} variant="current" size="lg" />)}
            </div>

            {/* Next pre-loaded */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, color: '#252320', letterSpacing: '0.16em' }}>NEXT</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {(next ?? '----').split('').map((d, i) => <Digit key={i} char={d} variant="next" size="sm" />)}
              </div>
            </div>

            {/* Progress */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 10, color: '#2E2C28', letterSpacing: '0.1em' }}>
                {progress.tried.toLocaleString()} / {progress.total.toLocaleString()} tried
              </span>
              <div style={{ width: 220, height: 2, background: '#1C1A17' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: '#C45C1A', transition: 'width 0.2s' }} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Action bar ─────────────────────────────────────────────────── */}
      {!myFound && (
        <div style={{ background: '#111009', borderTop: '1px solid #1C1A16', borderBottom: '1px solid #1C1A16', padding: '8px 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <kbd style={{ background: '#1C1A17', border: '1px solid #2C2A26', padding: '2px 8px', fontSize: 10, color: '#605850', letterSpacing: '0.06em', fontFamily: mono }}>
              SPACE / ENTER
            </kbd>
            <span style={{ fontSize: 10, color: '#333028', letterSpacing: '0.08em' }}>tried</span>
          </div>
          <div style={{ width: 1, height: 16, background: '#252220' }} />
          <button
            onClick={handleFound}
            disabled={!current}
            style={{
              background:    'transparent',
              border:        '1px solid #1E5C2A',
              color:         '#32A050',
              padding:       '5px 20px',
              fontFamily:    mono,
              fontSize:      11,
              fontWeight:    700,
              letterSpacing: '0.14em',
              cursor:        current ? 'pointer' : 'default',
              opacity:       current ? 1 : 0.3,
            }}
            onMouseEnter={e => { if (current) { e.target.style.borderColor = '#32A050'; e.target.style.color = '#44C060'; }}}
            onMouseLeave={e => { e.target.style.borderColor = '#1E5C2A'; e.target.style.color = '#32A050'; }}
          >
            FOUND IT
          </button>
        </div>
      )}

      {/* ── Footer — teammate codes ─────────────────────────────────────── */}
      <div style={{ background: '#0C0A08', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 18, flexShrink: 0 }}>
        {teammates.map(t => (
          <div key={t.steam_id} style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#383430', letterSpacing: '0.07em' }}>{t.username?.slice(0, 8)}</span>
            <span style={{ fontSize: 11, color: t.online ? '#504840' : '#252220', letterSpacing: '0.1em', fontWeight: 700 }}>
              {t.online ? (t.current_code ?? '—') : '—'}
            </span>
          </div>
        ))}
        {!current && (
          <span style={{ fontSize: 10, color: '#2A2820', letterSpacing: '0.08em', marginLeft: 'auto' }}>
            {buffer.length === 0 ? 'WAITING FOR SESSION…' : 'ALL CODES EXHAUSTED'}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Digit({ char, size, variant }) {
  const dims =
    size === 'lg' ? { w: 76, h: 96, fs: 58 } :
    size === 'sm' ? { w: 34, h: 42, fs: 24 } :
                    { w: 50, h: 64, fs: 38 };

  const theme =
    variant === 'found'   ? { bg: '#081E0C', fg: '#32A050', bd: '#103C20' } :
    variant === 'current' ? { bg: '#141210', fg: '#D8D0C4', bd: '#2A2720' } :
                            { bg: '#0F0D0B', fg: '#252220', bd: '#181612' };

  return (
    <div style={{ width: dims.w, height: dims.h, background: theme.bg, border: `1px solid ${theme.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: dims.fs, color: theme.fg, fontWeight: 700, flexShrink: 0, transition: 'color 0.15s, background 0.15s' }}>
      {char}
    </div>
  );
}

function RosterPip({ name, online }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: online ? '#38A050' : '#282520' }} />
      <span style={{ fontSize: 11, color: online ? '#6A6258' : '#2E2C28' }}>{name}</span>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, clearAuthCache } from '../hooks/useAuth';

const mono = "'Consolas','Menlo','Monaco','Courier New',monospace";
const S = { background: '#0F0D0A', minHeight: '100vh', fontFamily: mono, color: '#C8C0B8', display: 'flex', flexDirection: 'column' };

export default function Lobby() {
  const user = useAuth();
  const nav  = useNavigate();

  const [tab,        setTab]        = useState('create'); // 'create' | 'join'
  const [serverInfo, setServerInfo] = useState('');
  const [gridCoord,  setGridCoord]  = useState('');
  const [joinCode,   setJoinCode]   = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  async function createSession() {
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/sessions', {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ serverInfo, gridCoord }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      const { id } = await r.json();
      nav(`/session/${id}`);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  async function joinSession() {
    const code = joinCode.trim().toUpperCase();
    if (!code) { setError('enter a session code'); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch(`/api/sessions/${code}`, { credentials: 'include' });
      if (!r.ok) throw new Error('session not found');
      nav(`/session/${code}`);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  async function logout() {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    clearAuthCache();
    nav('/');
  }

  const inputStyle = {
    background:  '#1A1714',
    border:      '1px solid #2A2720',
    color:       '#C8C0B8',
    padding:     '8px 12px',
    fontFamily:  mono,
    fontSize:    12,
    outline:     'none',
    width:       '100%',
    borderRadius: 0,
    letterSpacing: '0.05em',
  };

  const btnPrimary = {
    background:    '#C45C1A',
    border:        'none',
    color:         '#0F0D0A',
    padding:       '9px 24px',
    fontFamily:    mono,
    fontSize:      11,
    fontWeight:    700,
    letterSpacing: '0.14em',
    cursor:        loading ? 'default' : 'pointer',
    opacity:       loading ? 0.5 : 1,
    width:         '100%',
    borderRadius:  0,
  };

  return (
    <div style={S}>
      {/* Header */}
      <div style={{ background: '#141210', borderBottom: '1px solid #222018', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, background: '#C45C1A', borderRadius: '50%', boxShadow: '0 0 7px #C45C1A88' }} />
          <span style={{ color: '#C45C1A', fontSize: 12, fontWeight: 700, letterSpacing: '0.16em' }}>CODE RAIDER</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
          <NavLink href="/rankings">RANKINGS</NavLink>
          <NavLink href="/groups">GROUPS</NavLink>
          <span style={{ color: '#404038', fontSize: 11 }}>{user?.username}</span>
          <button onClick={logout} style={{ background: 'none', border: 'none', color: '#383430', fontSize: 10, cursor: 'pointer', fontFamily: mono, letterSpacing: '0.08em' }}>LOGOUT</button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>

          {/* Tabs */}
          <div style={{ display: 'flex', marginBottom: 24, borderBottom: '1px solid #1E1C18' }}>
            {['create', 'join'].map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); }} style={{ flex: 1, background: 'none', border: 'none', borderBottom: tab === t ? '2px solid #C45C1A' : '2px solid transparent', color: tab === t ? '#C45C1A' : '#403C38', fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', padding: '10px 0', cursor: 'pointer', marginBottom: -1 }}>
                {t === 'create' ? 'CREATE RAID' : 'JOIN RAID'}
              </button>
            ))}
          </div>

          {tab === 'create' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="SERVER NAME" optional>
                <input placeholder="e.g. US Main" value={serverInfo} onChange={e => setServerInfo(e.target.value)} style={inputStyle} />
              </Field>
              <Field label="GRID COORD" optional>
                <input placeholder="e.g. C7" value={gridCoord} onChange={e => setGridCoord(e.target.value)} style={inputStyle} maxLength={4} />
              </Field>
              <button onClick={createSession} disabled={loading} style={{ ...btnPrimary, marginTop: 8 }}>
                {loading ? 'CREATING…' : 'CREATE SESSION'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="SESSION CODE">
                <input
                  placeholder="RAID-XXXX"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && joinSession()}
                  style={{ ...inputStyle, letterSpacing: '0.14em', textTransform: 'uppercase' }}
                  maxLength={9}
                />
              </Field>
              <button onClick={joinSession} disabled={loading} style={{ ...btnPrimary, marginTop: 8 }}>
                {loading ? 'JOINING…' : 'JOIN SESSION'}
              </button>
            </div>
          )}

          {error && (
            <p style={{ color: '#8A3030', fontSize: 11, marginTop: 14, letterSpacing: '0.06em' }}>{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, optional, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: '#403C38', letterSpacing: '0.1em' }}>{label}</span>
        {optional && <span style={{ fontSize: 9, color: '#2A2820', letterSpacing: '0.06em' }}>OPTIONAL</span>}
      </div>
      {children}
    </div>
  );
}

function NavLink({ href, children }) {
  return (
    <a href={href} style={{ color: '#403C38', fontSize: 10, letterSpacing: '0.1em', textDecoration: 'none' }}>{children}</a>
  );
}

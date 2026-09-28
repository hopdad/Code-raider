import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const mono = "'Consolas','Menlo','Monaco','Courier New',monospace";

export default function Groups() {
  const user = useAuth();
  const [groups,    setGroups]    = useState([]);
  const [name,      setName]      = useState('');
  const [joinCode,  setJoinCode]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [msg,       setMsg]       = useState('');

  useEffect(() => { fetchGroups(); }, []);

  async function fetchGroups() {
    const r = await fetch('/api/groups', { credentials: 'include' });
    if (r.ok) setGroups(await r.json());
  }

  async function createGroup() {
    if (!name.trim()) { setError('enter a group name'); return; }
    setLoading(true); setError('');
    const r = await fetch('/api/groups', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (r.ok) { const g = await r.json(); setMsg(`Created. Invite code: ${g.inviteCode}`); setName(''); fetchGroups(); }
    else       { setError((await r.json()).error); }
    setLoading(false);
  }

  async function joinGroup() {
    const code = joinCode.trim().toUpperCase();
    if (!code) { setError('enter an invite code'); return; }
    setLoading(true); setError('');
    const r = await fetch(`/api/groups/join`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode: code }),
    });
    if (r.ok) { setMsg('Joined group.'); setJoinCode(''); fetchGroups(); }
    else       { setError((await r.json()).error); }
    setLoading(false);
  }

  const inputStyle = { background: '#1A1714', border: '1px solid #2A2720', color: '#C8C0B8', padding: '7px 10px', fontFamily: mono, fontSize: 12, outline: 'none', width: '100%', borderRadius: 0 };
  const btn = (accent) => ({ background: 'none', border: `1px solid ${accent}`, color: accent, padding: '5px 16px', fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.5 : 1, borderRadius: 0 });

  return (
    <div style={{ background: '#0F0D0A', minHeight: '100vh', fontFamily: mono, color: '#C8C0B8' }}>
      <div style={{ background: '#141210', borderBottom: '1px solid #222018', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 7, height: 7, background: '#C45C1A', borderRadius: '50%' }} />
          <span style={{ color: '#C45C1A', fontSize: 12, fontWeight: 700, letterSpacing: '0.16em' }}>CODE RAIDER</span>
        </a>
        <span style={{ color: '#343028', fontSize: 11, letterSpacing: '0.12em' }}>GROUPS</span>
      </div>

      <div style={{ maxWidth: 560, margin: '40px auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Create */}
        <div>
          <div style={{ fontSize: 10, color: '#2E2C28', letterSpacing: '0.14em', marginBottom: 14 }}>CREATE A GROUP</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input placeholder="Clan name" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createGroup()} style={{ ...inputStyle }} />
            <button onClick={createGroup} style={btn('#C45C1A')}>CREATE</button>
          </div>
        </div>

        {/* Join */}
        <div>
          <div style={{ fontSize: 10, color: '#2E2C28', letterSpacing: '0.14em', marginBottom: 14 }}>JOIN A GROUP</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input placeholder="Invite code" value={joinCode} onChange={e => setJoinCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && joinGroup()} style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '0.12em' }} maxLength={8} />
            <button onClick={joinGroup} style={btn('#4A9FD8')}>JOIN</button>
          </div>
        </div>

        {(error || msg) && (
          <span style={{ fontSize: 11, color: error ? '#8A3030' : '#32A050', letterSpacing: '0.06em' }}>{error || msg}</span>
        )}

        {/* Group list */}
        {groups.length > 0 && (
          <div>
            <div style={{ fontSize: 10, color: '#2E2C28', letterSpacing: '0.14em', marginBottom: 14 }}>YOUR GROUPS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {groups.map(g => (
                <div key={g.id} style={{ background: '#111009', border: '1px solid #1C1A16', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#A09890', letterSpacing: '0.04em' }}>{g.name}</div>
                    <div style={{ fontSize: 10, color: '#2E2C28', marginTop: 3 }}>{g.member_count} MEMBERS</div>
                  </div>
                  <div style={{ fontSize: 10, color: '#C45C1A', letterSpacing: '0.1em' }}>
                    {g.role === 'owner' ? `CODE: ${g.invite_code}` : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

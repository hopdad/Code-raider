import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSession } from '../hooks/useSession';
import CodeRaider from '../components/CodeRaider';

const mono = "'Consolas','Menlo','Monaco','Courier New',monospace";

export default function Session() {
  const { id }   = useParams();
  const user     = useAuth();
  const nav      = useNavigate();

  const { buffer, roster, progress, teamFound, connected, error, markTried, markFound } = useSession(id);

  const [myFound,  setMyFound]  = useState(null); // code I personally found
  const [copied,   setCopied]   = useState(false);

  const handleFound = useCallback(() => {
    setMyFound(buffer[0]);
    markFound();
  }, [buffer, markFound]);

  const handleDismissFound = useCallback(() => {
    setMyFound(null);
    markTried(); // advance past the found code
  }, [markTried]);

  function copyInvite() {
    navigator.clipboard.writeText(`${window.location.origin}/session/${id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (error) return (
    <div style={{ background: '#0F0D0A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono }}>
      <div style={{ textAlign: 'center', gap: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ color: '#8A3030', fontSize: 12, letterSpacing: '0.1em' }}>{error.toUpperCase()}</span>
        <button onClick={() => nav('/lobby')} style={{ background: 'none', border: '1px solid #2A2720', color: '#403C38', fontFamily: mono, fontSize: 11, padding: '6px 16px', cursor: 'pointer' }}>
          BACK TO LOBBY
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#0F0D0A', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: mono }}>

      {/* Session bar — invite code + copy link */}
      <div style={{ background: '#0C0A08', borderBottom: '1px solid #1A1814', padding: '5px 18px', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <span style={{ fontSize: 10, color: '#2A2820', letterSpacing: '0.08em' }}>SESSION</span>
        <span style={{ fontSize: 11, color: '#C45C1A', fontWeight: 700, letterSpacing: '0.16em' }}>{id}</span>
        <button onClick={copyInvite} style={{ background: 'none', border: '1px solid #252220', color: copied ? '#32A050' : '#383430', fontFamily: mono, fontSize: 10, padding: '2px 10px', cursor: 'pointer', letterSpacing: '0.08em' }}>
          {copied ? 'COPIED' : 'COPY INVITE'}
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: connected ? '#38A050' : '#8A3030' }} />
          <span style={{ fontSize: 10, color: '#2A2820', letterSpacing: '0.06em' }}>{connected ? 'LIVE' : 'CONNECTING…'}</span>
        </div>
      </div>

      {/* Team-found notification banner */}
      {teamFound && teamFound.foundBy?.steamId !== user?.steamId && (
        <div style={{ background: '#0A2A10', borderBottom: '1px solid #1A5A28', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span style={{ color: '#32A050', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em' }}>DOOR OPEN</span>
          <span style={{ color: '#5A9870', fontSize: 12, letterSpacing: '0.1em', fontWeight: 700 }}>{teamFound.code}</span>
          <span style={{ color: '#2A6040', fontSize: 10, letterSpacing: '0.06em' }}>found by {teamFound.foundBy?.username}</span>
        </div>
      )}

      {/* Main raid UI */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <CodeRaider
          buffer={buffer}
          onTried={markTried}
          onFound={handleFound}
          onDismissFound={handleDismissFound}
          roster={roster}
          progress={progress}
          myFound={myFound}
          user={user}
        />
      </div>
    </div>
  );
}

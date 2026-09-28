import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const mono = "'Consolas','Menlo','Monaco','Courier New',monospace";

export default function Home() {
  const user = useAuth();
  const nav  = useNavigate();

  useEffect(() => {
    if (user) nav('/lobby', { replace: true });
  }, [user, nav]);

  // Still loading
  if (user === undefined) return null;

  return (
    <div style={{ background: '#0F0D0A', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: mono, color: '#C8C0B8' }}>

      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
        <div style={{ width: 12, height: 12, background: '#C45C1A', borderRadius: '50%', boxShadow: '0 0 12px #C45C1A' }} />
        <span style={{ color: '#C45C1A', fontSize: 22, fontWeight: 700, letterSpacing: '0.18em' }}>CODE RAIDER</span>
      </div>

      <p style={{ color: '#3A3630', fontSize: 12, letterSpacing: '0.12em', marginBottom: 40, textAlign: 'center', lineHeight: 1.8 }}>
        COORDINATED CODE-RAIDING FOR RUST CLANS<br />
        SYNC YOUR TEAM · WORK THROUGH CODES FASTER · LOG THE WINS
      </p>

      {/* Steam login */}
      <a
        href="/auth/steam"
        style={{
          display:       'flex',
          alignItems:    'center',
          gap:           12,
          background:    '#1B2838',
          border:        '1px solid #2A3A50',
          color:         '#C6D4DF',
          padding:       '12px 28px',
          fontFamily:    mono,
          fontSize:      12,
          fontWeight:    700,
          letterSpacing: '0.1em',
          textDecoration: 'none',
          cursor:        'pointer',
        }}
      >
        <SteamIcon />
        SIGN IN WITH STEAM
      </a>

      <p style={{ color: '#252220', fontSize: 10, letterSpacing: '0.08em', marginTop: 48 }}>
        ACCOUNTS ARE LINKED TO YOUR STEAM PROFILE
      </p>
    </div>
  );
}

function SteamIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="#C6D4DF">
      <path d="M16 0C7.2 0 0 7.2 0 16c0 7.8 5.6 14.3 13 15.7L8.5 21.3C7.6 20 7 18.5 7 16.8c0-4.4 3.6-8 8-8s8 3.6 8 8c0 1.7-.5 3.3-1.4 4.6l-2.4 3.6c.3 0 .5 0 .8 0 8.8 0 16-7.2 16-16S24.8 0 16 0z"/>
      <path d="M15 25.5c-1.4 2.1-3.8 3.5-6.5 3.5-4.4 0-8-3.6-8-8 0-1 .2-2 .5-2.9L7 21.9c.4 2 2.2 3.6 4.5 3.6 2.5 0 4.5-2 4.5-4.5 0-.5-.1-1-.3-1.5L15 25.5z"/>
    </svg>
  );
}

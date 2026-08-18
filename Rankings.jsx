import { useState, useEffect } from 'react';

const mono = "'Consolas','Menlo','Monaco','Courier New',monospace";

export default function Rankings() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/rankings', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: '#0F0D0A', minHeight: '100vh', fontFamily: mono, color: '#C8C0B8' }}>
      {/* Header */}
      <div style={{ background: '#141210', borderBottom: '1px solid #222018', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 7, height: 7, background: '#C45C1A', borderRadius: '50%' }} />
          <span style={{ color: '#C45C1A', fontSize: 12, fontWeight: 700, letterSpacing: '0.16em' }}>CODE RAIDER</span>
        </a>
        <span style={{ color: '#343028', fontSize: 11, letterSpacing: '0.12em' }}>RANKINGS</span>
      </div>

      <div style={{ maxWidth: 680, margin: '40px auto', padding: '0 20px' }}>
        <div style={{ color: '#2E2C28', fontSize: 10, letterSpacing: '0.14em', marginBottom: 20 }}>
          GLOBAL LEADERBOARD — CODES FOUND
        </div>

        {loading ? (
          <div style={{ color: '#2A2820', fontSize: 11, letterSpacing: '0.1em' }}>LOADING…</div>
        ) : rows.length === 0 ? (
          <div style={{ color: '#2A2820', fontSize: 11, letterSpacing: '0.1em' }}>NO DATA YET — START RAIDING</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 80px 80px', gap: 12, padding: '6px 12px', fontSize: 9, color: '#2A2820', letterSpacing: '0.12em', borderBottom: '1px solid #1A1814' }}>
              <span>#</span>
              <span>PLAYER</span>
              <span style={{ textAlign: 'right' }}>FOUND</span>
              <span style={{ textAlign: 'right' }}>SESSIONS</span>
            </div>

            {rows.map((row, i) => (
              <div
                key={row.steam_id}
                style={{
                  display:         'grid',
                  gridTemplateColumns: '40px 1fr 80px 80px',
                  gap:             12,
                  padding:         '10px 12px',
                  background:      i === 0 ? '#141008' : i < 3 ? '#111009' : 'transparent',
                  borderBottom:    '1px solid #141210',
                  alignItems:      'center',
                }}
              >
                <span style={{ fontSize: 11, color: i === 0 ? '#C45C1A' : '#2E2C28', fontWeight: i < 3 ? 700 : 400 }}>
                  {i + 1}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {row.avatar_url && (
                    <img src={row.avatar_url} alt="" style={{ width: 24, height: 24, borderRadius: 2, opacity: 0.8 }} />
                  )}
                  <span style={{ fontSize: 12, color: '#A09890', letterSpacing: '0.04em' }}>{row.username}</span>
                </div>
                <span style={{ fontSize: 12, color: '#32A050', fontWeight: 700, textAlign: 'right', letterSpacing: '0.06em' }}>
                  {row.codes_found}
                </span>
                <span style={{ fontSize: 11, color: '#404038', textAlign: 'right' }}>
                  {row.sessions_participated}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

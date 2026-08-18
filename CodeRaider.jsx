import { useState, useEffect, useCallback } from "react";

// ─── Top codes by real-world frequency ────────────────────────────────────────
// In prod: load from a full statistical dataset (rockyou 4-digit list, etc.)
const TOP_CODES = [
  "1234","0000","1111","1212","7777","1004","2000","4444","2222","6969",
  "9999","3333","5555","6666","1122","1313","8888","4321","2001","1010",
  "6868","2580","0987","1235","2468","0123","4567","8520","0007","1001",
  "0852","2143","3456","6789","0001","1000","1979","1982","1998","1990",
  "2468","1357","9876","2345","3579","7531","0002","0003","0004","0005",
  "1230","1231","1232","1233","1235","0011","0022","0033","0044","0055",
  "0069","0099","0123","0420","0911","1011","1100","1123","1221","1223",
  "1314","1411","1414","1488","1500","1515","1600","1618","1620","1776",
  "1800","1900","1911","1919","1945","1955","1956","1957","1958","1959",
];

function buildQueue() {
  const seen = new Set(TOP_CODES);
  const q = [...TOP_CODES];
  for (let i = 0; i <= 9999; i++) {
    const c = i.toString().padStart(4, "0");
    if (!seen.has(c)) q.push(c);
  }
  return q;
}

const QUEUE = buildQueue(); // 10,000 codes, priority-ordered

// ─── Round-robin queue builder ─────────────────────────────────────────────────
// With N_PLAYERS players and BUF codes buffered per player:
//   Each player owns BUF codes at a time before queue advances to next player.
//   Step between a player's batches = N_PLAYERS * BUF
//
//   N=4, BUF=2:
//     YOU    → codes [0,1],   [8,9],   [16,17] …
//     SLASH  → codes [2,3],   [10,11], [18,19] …
//     WRENCH → codes [4,5],   [12,13], [20,21] …
//     K1NG   → codes [6,7],   [14,15], [22,23] …

const N_PLAYERS = 4;
const BUF       = 2;
const STEP      = N_PLAYERS * BUF;

function buildMyQueue(slot = 0) {
  const out = [];
  let start = slot * BUF;
  while (start < QUEUE.length) {
    for (let b = 0; b < BUF && start + b < QUEUE.length; b++) {
      out.push(QUEUE[start + b]);
    }
    start += STEP;
  }
  return out;
}

const MY_QUEUE = buildMyQueue(0); // slot 0 = YOU

// Simulated teammates — in prod, populated from WebSocket session state
const TEAMMATES = [
  { name: "SLASH",  online: true,  code: QUEUE[BUF]     },
  { name: "WRENCH", online: true,  code: QUEUE[BUF * 2] },
  { name: "K1NG",   online: false, code: null            },
];

// ─── Root ─────────────────────────────────────────────────────────────────────
const mono = "'Consolas','Menlo','Monaco','Courier New',monospace";

export default function App() {
  const [idx,     setIdx]     = useState(0);
  const [history, setHistory] = useState([]);   // [{ code, result }]
  const [found,   setFound]   = useState(null); // code string when door opens
  const [flash,   setFlash]   = useState(null); // "tried" | "found" for bg pulse

  const current = MY_QUEUE[idx]     ?? null;
  const next    = MY_QUEUE[idx + 1] ?? null;
  const pct     = MY_QUEUE.length ? (idx / MY_QUEUE.length) * 100 : 0;

  const pulse = useCallback((type) => {
    setFlash(type);
    setTimeout(() => setFlash(null), 350);
  }, []);

  const markTried = useCallback(() => {
    if (!current || found) return;
    setHistory(h => [{ code: current, result: "tried" }, ...h].slice(0, 10));
    pulse("tried");
    setIdx(i => i + 1);
  }, [current, found, pulse]);

  const markFound = useCallback(() => {
    if (!current || found) return;
    setHistory(h => [{ code: current, result: "found" }, ...h].slice(0, 10));
    pulse("found");
    setFound(current);
  }, [current, found, pulse]);

  const dismissFound = useCallback(() => {
    setFound(null);
    setIdx(i => i + 1);
  }, []);

  // Keyboard handler
  useEffect(() => {
    const onKey = (e) => {
      if (found) {
        if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
          e.preventDefault();
          dismissFound();
        }
        return;
      }
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); markTried(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [found, markTried, markFound, dismissFound]);

  // ── Visual helpers ──────────────────────────────────────────────────────────
  const mainBg =
    flash === "found" ? "#071A0C" :
    flash === "tried" ? "#160A0A" :
    "#0F0D0A";

  return (
    <div style={{ background: mainBg, height: "100vh", color: "#C8C0B8", fontFamily: mono, display: "flex", flexDirection: "column", userSelect: "none", transition: "background 0.25s" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ background: "#141210", borderBottom: "1px solid #222018", padding: "10px 20px", display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 7, height: 7, background: "#C45C1A", borderRadius: "50%", boxShadow: "0 0 7px #C45C1A88" }} />
          <span style={{ color: "#C45C1A", fontSize: 12, fontWeight: 700, letterSpacing: "0.16em" }}>CODE RAIDER</span>
        </div>
        <span style={{ color: "#333028", fontSize: 11, letterSpacing: "0.1em" }}>RAID-4X7K</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 14 }}>
          {[{ name: "YOU", online: true }, ...TEAMMATES].map(p => (
            <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: p.online ? "#38A050" : "#282520" }} />
              <span style={{ fontSize: 11, color: p.online ? "#6A6258" : "#2E2C28" }}>{p.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main code display ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28 }}>

        {found ? (
          /* ── Found state ────────────────────────────────────────────────── */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <span style={{ fontSize: 10, color: "#32A050", letterSpacing: "0.22em" }}>DOOR OPEN</span>
            <div style={{ display: "flex", gap: 14 }}>
              {found.split("").map((d, i) => (
                <Digit key={i} char={d} size="lg" variant="found" />
              ))}
            </div>
            <span style={{ fontSize: 10, color: "#32A05088", letterSpacing: "0.12em" }}>ENTER to continue</span>
          </div>

        ) : (
          /* ── Normal dispenser ───────────────────────────────────────────── */
          <>
            <span style={{ fontSize: 10, color: "#373330", letterSpacing: "0.2em" }}>YOUR CODE</span>

            {/* Current code — large */}
            <div style={{ display: "flex", gap: 14 }}>
              {(current ?? "----").split("").map((d, i) => (
                <Digit key={i} char={d} size="lg" variant="current" />
              ))}
            </div>

            {/* Next code — pre-loaded, smaller */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 9, color: "#252320", letterSpacing: "0.16em" }}>NEXT</span>
              <div style={{ display: "flex", gap: 8 }}>
                {(next ?? "----").split("").map((d, i) => (
                  <Digit key={i} char={d} size="sm" variant="next" />
                ))}
              </div>
            </div>

            {/* Position + progress */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 10, color: "#2E2C28", letterSpacing: "0.1em" }}>
                #{(idx + 1).toLocaleString()} / {MY_QUEUE.length.toLocaleString()}
              </span>
              <div style={{ width: 220, height: 2, background: "#1C1A17" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: "#C45C1A", transition: "width 0.15s" }} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Action bar ──────────────────────────────────────────────────────── */}
      <div style={{ background: "#111009", borderTop: "1px solid #1C1A16", borderBottom: "1px solid #1C1A16", padding: "8px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 20, flexShrink: 0 }}>
        {/* Keyboard shortcut hint */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <kbd style={{ background: "#1C1A17", border: "1px solid #2C2A26", padding: "2px 8px", fontSize: 10, color: "#605850", letterSpacing: "0.06em", fontFamily: mono }}>
            SPACE / ENTER
          </kbd>
          <span style={{ fontSize: 10, color: "#333028", letterSpacing: "0.08em" }}>tried</span>
        </div>

        <div style={{ width: 1, height: 16, background: "#252220" }} />

        {/* Found button — deliberate click only, no keyboard shortcut */}
        <button
          onClick={markFound}
          disabled={!!found || !current}
          style={{
            background:    "transparent",
            border:        "1px solid #1E5C2A",
            color:         "#32A050",
            padding:       "5px 20px",
            fontFamily:    mono,
            fontSize:      11,
            fontWeight:    700,
            letterSpacing: "0.14em",
            cursor:        found || !current ? "default" : "pointer",
            opacity:       found || !current ? 0.3 : 1,
            transition:    "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={e => { if (!found && current) { e.target.style.borderColor = "#32A050"; e.target.style.color = "#44C060"; }}}
          onMouseLeave={e => { e.target.style.borderColor = "#1E5C2A"; e.target.style.color = "#32A050"; }}
        >
          FOUND IT
        </button>
      </div>

      {/* ── Footer — team + history ─────────────────────────────────────────── */}
      <div style={{ background: "#0C0A08", padding: "10px 20px", display: "flex", alignItems: "center", gap: 20, flexShrink: 0 }}>
        {/* Teammate current codes */}
        <div style={{ display: "flex", gap: 18 }}>
          {TEAMMATES.map(t => (
            <div key={t.name} style={{ display: "flex", gap: 7, alignItems: "center" }}>
              <span style={{ fontSize: 10, color: "#383430", letterSpacing: "0.07em" }}>{t.name}</span>
              <span style={{ fontSize: 11, color: t.online ? "#504840" : "#252220", letterSpacing: "0.1em", fontWeight: 700 }}>
                {t.online && t.code ? t.code : "—"}
              </span>
            </div>
          ))}
        </div>

        {/* Recent tried codes — fades left */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          {history.slice(0, 8).reverse().map((h, i) => (
            <span key={i} style={{ fontSize: 10, letterSpacing: "0.08em", color: h.result === "found" ? "#32A050" : `rgba(58,54,50,${0.3 + i * 0.09})` }}>
              {h.code}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Digit cell component ──────────────────────────────────────────────────────
function Digit({ char, size, variant }) {
  const isLg   = size === "lg";
  const isSm   = size === "sm";

  const dims = isLg ? { w: 76, h: 96, fs: 58 }
             : isSm ? { w: 34, h: 42, fs: 24 }
             :        { w: 50, h: 64, fs: 38 };

  const theme =
    variant === "found"   ? { bg: "#081E0C", fg: "#32A050", bd: "#103C20" } :
    variant === "current" ? { bg: "#141210", fg: "#D8D0C4", bd: "#2A2720" } :
    /* next */              { bg: "#0F0D0B", fg: "#252220", bd: "#181612" };

  return (
    <div style={{
      width:       dims.w,
      height:      dims.h,
      background:  theme.bg,
      border:      `1px solid ${theme.bd}`,
      display:     "flex",
      alignItems:  "center",
      justifyContent: "center",
      fontSize:    dims.fs,
      color:       theme.fg,
      fontWeight:  700,
      flexShrink:  0,
      transition:  "color 0.2s, background 0.2s",
    }}>
      {char}
    </div>
  );
}

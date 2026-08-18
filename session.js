const db    = require('../db');
const redis = require('../redis');
const { QUEUE } = require('../queue');

const BUF = 2; // codes pre-assigned per player

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Atomically claim the next N codes from the global queue for this session.
// Returns array of code strings. Safe under concurrent player actions.
async function claimCodes(sessionId, n) {
  const newIdx = await redis.incrBy(`session:${sessionId}:queue_idx`, n);
  const startIdx = newIdx - n;
  const codes = [];
  for (let i = startIdx; i < newIdx && i < QUEUE.length; i++) {
    codes.push(QUEUE[i]);
  }
  return codes; // length may be < n if we hit the end of the queue
}

// Persist a player's current code buffer to Redis so they survive reconnects.
async function saveBuffer(sessionId, steamId, buffer) {
  await redis.set(
    `session:${sessionId}:player:${steamId}:buffer`,
    JSON.stringify(buffer),
    { EX: 3600 * 6 } // expire after 6 h (raid shouldn't take longer than that)
  );
}

async function loadBuffer(sessionId, steamId) {
  const raw = await redis.get(`session:${sessionId}:player:${steamId}:buffer`);
  return raw ? JSON.parse(raw) : null;
}

// Broadcast the current session player list to everyone in the room.
async function broadcastRoster(io, sessionId) {
  const members = await db.query(
    `SELECT sm.slot, sm.steam_id, u.username, u.avatar_url
     FROM session_members sm
     JOIN users u ON u.steam_id = sm.steam_id
     WHERE sm.session_id = $1
     ORDER BY sm.slot`,
    [sessionId]
  );

  // Annotate each member with their online status from Redis
  const online = await redis.sMembers(`session:${sessionId}:online`);
  const onlineSet = new Set(online);

  const roster = members.rows.map(m => ({
    ...m,
    online: onlineSet.has(m.steam_id),
  }));

  io.to(sessionId).emit('session:roster', roster);
}

// ─── Main socket handler ──────────────────────────────────────────────────────

module.exports = function registerSessionSocket(io) {
  io.on('connection', (socket) => {
    const user = socket.request.user;

    // Gate: only authenticated connections get past here
    if (!user) {
      socket.emit('error', { message: 'not authenticated' });
      socket.disconnect();
      return;
    }

    const { steamId, username } = user;
    let currentSession = null; // track which session this socket is in

    // ── session:join ────────────────────────────────────────────────────────
    // Client sends this on page load or after entering a session code.
    socket.on('session:join', async ({ sessionId }) => {
      try {
        const meta = await redis.hGetAll(`session:${sessionId}:meta`);
        if (!meta?.createdBy) {
          socket.emit('error', { message: 'session not found' });
          return;
        }
        if (meta.status !== 'active') {
          socket.emit('error', { message: 'session is no longer active' });
          return;
        }

        currentSession = sessionId;
        socket.join(sessionId);
        await redis.sAdd(`session:${sessionId}:online`, steamId);

        // Check if this player has an existing slot (reconnect case)
        const existingSlot = await redis.get(`session:${sessionId}:player:${steamId}:slot`);
        let buffer = await loadBuffer(sessionId, steamId);

        if (existingSlot !== null && buffer) {
          // Reconnect: restore their buffer
          socket.emit('code:assign', {
            buffer,
            slot:   parseInt(existingSlot, 10),
            reconnect: true,
          });
        } else {
          // New player: assign next available slot and claim initial codes
          const slot = await redis.incr(`session:${sessionId}:slot_counter`) - 1;
          await redis.set(`session:${sessionId}:player:${steamId}:slot`, slot);

          // Persist to Postgres (upsert in case of edge-case double-join)
          await db.query(
            `INSERT INTO session_members (session_id, steam_id, slot)
             VALUES ($1, $2, $3)
             ON CONFLICT (session_id, steam_id) DO NOTHING`,
            [sessionId, steamId, slot]
          );

          buffer = await claimCodes(sessionId, BUF);
          await saveBuffer(sessionId, steamId, buffer);

          socket.emit('code:assign', { buffer, slot, reconnect: false });
        }

        await broadcastRoster(io, sessionId);
      } catch (err) {
        console.error('[socket:session:join]', err);
        socket.emit('error', { message: 'failed to join session' });
      }
    });

    // ── code:tried ──────────────────────────────────────────────────────────
    // Client marks the first code in their buffer as tried and needs a replacement.
    socket.on('code:tried', async ({ code }) => {
      if (!currentSession) return;
      try {
        // Record in Redis tried set
        await redis.sAdd(`session:${currentSession}:tried`, code);

        // Advance client's buffer: drop tried code, append one new code
        let buffer = await loadBuffer(currentSession, steamId);
        if (!buffer) return;

        buffer.shift(); // remove tried code

        // Claim one replacement code
        const [next] = await claimCodes(currentSession, 1);
        if (next) buffer.push(next);

        await saveBuffer(currentSession, steamId, buffer);

        // Send updated buffer to this player only
        socket.emit('code:assign', { buffer });

        // Broadcast progress count to room
        const triedCount = await redis.sCard(`session:${currentSession}:tried`);
        io.to(currentSession).emit('session:progress', {
          tried: triedCount,
          total: QUEUE.length,
        });
      } catch (err) {
        console.error('[socket:code:tried]', err);
      }
    });

    // ── code:found ──────────────────────────────────────────────────────────
    // Client reports a code that worked. Broadcast to room + persist.
    socket.on('code:found', async ({ code }) => {
      if (!currentSession) return;
      try {
        // Persist to Postgres
        await db.query(
          `INSERT INTO found_codes (session_id, steam_id, code)
           VALUES ($1, $2, $3)`,
          [currentSession, steamId, code]
        );

        // Broadcast to entire room — everyone gets to see the win
        io.to(currentSession).emit('code:found', {
          code,
          foundBy: { steamId, username },
        });
      } catch (err) {
        console.error('[socket:code:found]', err);
      }
    });

    // ── disconnect ──────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      if (!currentSession) return;
      try {
        await redis.sRem(`session:${currentSession}:online`, steamId);
        await broadcastRoster(io, currentSession);
      } catch (err) {
        console.error('[socket:disconnect]', err);
      }
    });
  });
};

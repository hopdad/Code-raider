const express = require('express');
const db      = require('../db');
const redis   = require('../redis');

const router = express.Router();

// Auth guard
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'not authenticated' });
  next();
}

// Generate a RAID-XXXX style session code
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `RAID-${suffix}`;
}

// ─── POST /api/sessions ───────────────────────────────────────────────────────
// Create a new raid session. Returns the session id the team uses to join.
router.post('/', requireAuth, async (req, res) => {
  const { serverInfo, gridCoord } = req.body;
  const { steamId } = req.user;

  let id;
  let tries = 0;
  // Retry on collision (extremely unlikely but safe)
  while (tries < 5) {
    id = generateCode();
    try {
      await db.query(
        `INSERT INTO sessions (id, created_by, server_info, grid_coord)
         VALUES ($1, $2, $3, $4)`,
        [id, steamId, serverInfo ?? null, gridCoord ?? null]
      );
      break;
    } catch (err) {
      if (err.code === '23505') { tries++; continue; } // unique violation
      throw err;
    }
  }

  // Seed Redis meta for this session
  await redis.hSet(`session:${id}:meta`, {
    createdBy:  steamId,
    status:     'active',
    queueIdx:   '0',
    nPlayers:   '0',
  });

  res.json({ id });
});

// ─── GET /api/sessions/:id ────────────────────────────────────────────────────
// Fetch session info — used by client on page load / share link.
router.get('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  const sessionResult = await db.query(
    `SELECT s.*, u.username as creator_name
     FROM sessions s
     JOIN users u ON u.steam_id = s.created_by
     WHERE s.id = $1`,
    [id]
  );
  if (!sessionResult.rows.length) return res.status(404).json({ error: 'session not found' });

  const members = await db.query(
    `SELECT sm.slot, sm.steam_id, u.username, u.avatar_url
     FROM session_members sm
     JOIN users u ON u.steam_id = sm.steam_id
     WHERE sm.session_id = $1
     ORDER BY sm.slot`,
    [id]
  );

  const queueIdx = await redis.hGet(`session:${id}:meta`, 'queueIdx');

  res.json({
    session: sessionResult.rows[0],
    members: members.rows,
    queueIdx: parseInt(queueIdx ?? '0', 10),
  });
});

// ─── POST /api/sessions/:id/complete ─────────────────────────────────────────
router.post('/:id/complete', requireAuth, async (req, res) => {
  const { id } = req.params;
  await db.query(
    `UPDATE sessions SET status = 'completed', completed_at = NOW() WHERE id = $1`,
    [id]
  );
  await redis.hSet(`session:${id}:meta`, 'status', 'completed');
  res.json({ ok: true });
});

module.exports = router;

const express = require('express');
const db      = require('../db');

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'not authenticated' });
  next();
}

function genInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

// GET /api/groups — my groups
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT g.id, g.name, g.invite_code, gm.role,
             (SELECT COUNT(*) FROM group_members WHERE group_id = g.id)::int AS member_count
      FROM groups g
      JOIN group_members gm ON gm.group_id = g.id AND gm.steam_id = $1
      ORDER BY g.created_at DESC
    `, [req.user.steamId]);
    res.json(result.rows);
  } catch (err) {
    console.error('[groups:get]', err);
    res.status(500).json({ error: 'server error' });
  }
});

// POST /api/groups — create a group
router.post('/', requireAuth, async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });

  const inviteCode = genInviteCode();
  const { steamId } = req.user;

  try {
    const r = await db.query(
      `INSERT INTO groups (name, owner_id, invite_code) VALUES ($1, $2, $3) RETURNING id, invite_code`,
      [name.trim(), steamId, inviteCode]
    );
    const { id, invite_code } = r.rows[0];
    await db.query(
      `INSERT INTO group_members (group_id, steam_id, role) VALUES ($1, $2, 'owner')`,
      [id, steamId]
    );
    res.json({ id, inviteCode: invite_code });
  } catch (err) {
    console.error('[groups:create]', err);
    res.status(500).json({ error: 'server error' });
  }
});

// POST /api/groups/join — join by invite code
router.post('/join', requireAuth, async (req, res) => {
  const { inviteCode } = req.body;
  if (!inviteCode) return res.status(400).json({ error: 'invite code required' });

  try {
    const r = await db.query(
      `SELECT id FROM groups WHERE invite_code = $1`,
      [inviteCode.trim().toUpperCase()]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'invalid invite code' });

    const groupId = r.rows[0].id;
    await db.query(
      `INSERT INTO group_members (group_id, steam_id, role)
       VALUES ($1, $2, 'member')
       ON CONFLICT DO NOTHING`,
      [groupId, req.user.steamId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[groups:join]', err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;

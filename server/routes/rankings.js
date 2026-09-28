const express = require('express');
const db      = require('../db');

const router = express.Router();

// GET /api/rankings — top 50 by codes found (public)
router.get('/', async (_req, res) => {
  try {
    const result = await db.query(`
      SELECT
        u.steam_id,
        u.username,
        u.avatar_url,
        COUNT(fc.id)::int                  AS codes_found,
        COUNT(DISTINCT fc.session_id)::int AS sessions_participated
      FROM users u
      JOIN found_codes fc ON fc.steam_id = u.steam_id AND fc.is_public = true
      GROUP BY u.steam_id, u.username, u.avatar_url
      ORDER BY codes_found DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('[rankings]', err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;

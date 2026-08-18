const express  = require('express');
const passport = require('passport');
const Steam    = require('passport-steam').Strategy;
const db       = require('../db');

const router = express.Router();

// ─── Passport setup ───────────────────────────────────────────────────────────

passport.use(new Steam(
  {
    returnURL: `${process.env.BASE_URL}/auth/steam/return`,
    realm:     process.env.BASE_URL,
    apiKey:    process.env.STEAM_API_KEY,
  },
  async (_identifier, profile, done) => {
    try {
      const steamId  = profile.id;
      const username = profile.displayName;
      const avatar   = profile.photos?.[2]?.value ?? profile.photos?.[0]?.value ?? null;

      // Upsert user — update username/avatar on each login in case they changed
      await db.query(
        `INSERT INTO users (steam_id, username, avatar_url)
         VALUES ($1, $2, $3)
         ON CONFLICT (steam_id) DO UPDATE
           SET username  = EXCLUDED.username,
               avatar_url = EXCLUDED.avatar_url`,
        [steamId, username, avatar]
      );

      return done(null, { steamId, username, avatar });
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done)   => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// ─── Routes ───────────────────────────────────────────────────────────────────

// Step 1: redirect to Steam
router.get('/steam', passport.authenticate('steam'));

// Step 2: Steam redirects back here
router.get(
  '/steam/return',
  passport.authenticate('steam', { failureRedirect: '/' }),
  (req, res) => res.redirect(process.env.CLIENT_URL ?? '/')
);

router.get('/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'not authenticated' });
  res.json(req.user);
});

router.post('/logout', (req, res) => {
  req.logout(() => res.json({ ok: true }));
});

module.exports = router;

require('dotenv').config();

const express        = require('express');
const http           = require('http');
const path           = require('path');
const fs             = require('fs');
const { Server }     = require('socket.io');
const session        = require('express-session');
const RedisStore     = require('connect-redis').default;
const passport       = require('passport');
const cors           = require('cors');

const redis          = require('./redis');
const db             = require('./db');
const authRouter     = require('./routes/auth');
const sessionsRouter = require('./routes/sessions');
const rankingsRouter = require('./routes/rankings');
const groupsRouter   = require('./routes/groups');
const registerSocket = require('./sockets/session');

const app    = express();
const server = http.createServer(app);
const isProd = process.env.NODE_ENV === 'production';

// ─── Redis ────────────────────────────────────────────────────────────────────
redis.connect().then(() => console.log('[redis] connected'));

// ─── Middleware ───────────────────────────────────────────────────────────────
if (!isProd) {
  app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:5173', credentials: true }));
}
app.use(express.json());

const sessionMiddleware = session({
  store:             new RedisStore({ client: redis }),
  secret:            process.env.SESSION_SECRET,
  resave:            false,
  saveUninitialized: false,
  cookie: { secure: isProd, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 7 },
});

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/auth',         authRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/rankings', rankingsRouter);
app.use('/api/groups',   groupsRouter);
app.get('/api/health',   (_req, res) => res.json({ ok: true }));

// ─── Static client (production) ───────────────────────────────────────────────
if (isProd) {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  // SPA fallback — must come after all API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: isProd ? undefined : {
    origin:      process.env.CLIENT_URL ?? 'http://localhost:5173',
    credentials: true,
  },
});

io.engine.use(sessionMiddleware);
io.engine.use(passport.initialize());
io.engine.use(passport.session());

registerSocket(io);

// ─── Start ────────────────────────────────────────────────────────────────────
async function start() {
  const schema = fs.readFileSync(path.join(__dirname, 'db/schema.sql'), 'utf8');
  await db.query(schema);
  console.log('[db] schema ready');

  const PORT = process.env.PORT ?? 3001;
  server.listen(PORT, () => console.log(`[server] :${PORT} (${isProd ? 'production' : 'dev'})`));
}

start().catch(err => { console.error('[startup]', err); process.exit(1); });

-- code raider schema — idempotent

CREATE TABLE IF NOT EXISTS users (
  steam_id    VARCHAR(20) PRIMARY KEY,
  username    VARCHAR(100) NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id           VARCHAR(10) PRIMARY KEY,
  created_by   VARCHAR(20) REFERENCES users(steam_id),
  status       VARCHAR(20) DEFAULT 'active',
  server_info  TEXT,
  grid_coord   VARCHAR(10),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS session_members (
  session_id   VARCHAR(10) REFERENCES sessions(id),
  steam_id     VARCHAR(20) REFERENCES users(steam_id),
  slot         INTEGER NOT NULL,
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY  (session_id, steam_id)
);

CREATE TABLE IF NOT EXISTS found_codes (
  id           SERIAL PRIMARY KEY,
  session_id   VARCHAR(10) REFERENCES sessions(id),
  steam_id     VARCHAR(20) REFERENCES users(steam_id),
  code         VARCHAR(4)  NOT NULL,
  confirmed_at TIMESTAMPTZ DEFAULT NOW(),
  is_public    BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS groups (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  owner_id     VARCHAR(20) REFERENCES users(steam_id),
  invite_code  VARCHAR(8) UNIQUE NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id     INTEGER REFERENCES groups(id),
  steam_id     VARCHAR(20) REFERENCES users(steam_id),
  role         VARCHAR(20) DEFAULT 'member',
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY  (group_id, steam_id)
);

CREATE INDEX IF NOT EXISTS idx_found_codes_steam   ON found_codes(steam_id);
CREATE INDEX IF NOT EXISTS idx_found_codes_session ON found_codes(session_id);
CREATE INDEX IF NOT EXISTS idx_session_members_user ON session_members(steam_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user   ON group_members(steam_id);

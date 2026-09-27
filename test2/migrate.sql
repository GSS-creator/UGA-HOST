-- Auth API — Turso database schema
-- Run with: ugahost db migrate migrate.sql

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  username  TEXT    NOT NULL UNIQUE,
  salt      TEXT    NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  token      TEXT NOT NULL UNIQUE,
  username   TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- Index for fast token lookup on every request
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

-- Index for fast username lookup on login
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)

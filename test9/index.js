// ── Turso HTTP client ──────────────────────────────────────────────────────────

function tursoHttpUrl(env) {
  const raw = (env.TURSO_DATABASE_URL || env.DATABASE_URL || '').trim();
  const url = raw.startsWith('libsql://')
    ? 'https://' + raw.slice('libsql://'.length)
    : raw;
  return url.replace(/\/$/, '') + '/v2/pipeline';
}

async function turso(env, sql, args = []) {
  const token = (env.TURSO_AUTH_TOKEN || env.DATABASE_AUTH_TOKEN || '').trim();
  if (!env.TURSO_DATABASE_URL && !env.DATABASE_URL) throw new Error('Database not configured');
  const res = await fetch(tursoHttpUrl(env), {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        { type: 'execute', stmt: { sql, args: args.map(v =>
            typeof v === 'number'
              ? { type: 'integer', value: String(v) }
              : { type: 'text',    value: String(v) }
        )}},
        { type: 'close' },
      ],
    }),
  });
  const data = await res.json();
  const result = data.results?.[0];
  if (result?.type === 'error') throw new Error(result.error.message);
  const rs   = result?.response?.result ?? {};
  const cols = (rs.cols ?? []).map(c => c.name);
  const rows = (rs.rows ?? []).map(r =>
    Object.fromEntries(r.map((cell, i) => [cols[i], cell.value ?? null]))
  );
  return { rows, rowsAffected: rs.affected_row_count ?? 0 };
}

async function tursoOne(env, sql, args = []) {
  const { rows } = await turso(env, sql, args);
  return rows[0] ?? null;
}

async function initDb(env) {
  if (!env.TURSO_DATABASE_URL && !env.DATABASE_URL) return;
  try {
    await turso(env, `CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT    NOT NULL UNIQUE,
      salt          TEXT    NOT NULL,
      password_hash TEXT    NOT NULL,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    )`);
    await turso(env, `CREATE TABLE IF NOT EXISTS sessions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      token      TEXT NOT NULL UNIQUE,
      username   TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
    )`);
    await turso(env, 'CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)');
    await turso(env, 'CREATE INDEX IF NOT EXISTS idx_users_username  ON users(username)');
  } catch (e) {
    console.warn('[db] Schema init warning:', e.message);
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function hexEncode(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(salt + password);
  const buf  = await crypto.subtle.digest('SHA-256', data);
  return hexEncode(new Uint8Array(buf));
}

function randomToken() {
  return hexEncode(crypto.getRandomValues(new Uint8Array(32)));
}

function randomSalt() {
  return hexEncode(crypto.getRandomValues(new Uint8Array(16)));
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type':                'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods':'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers':'Content-Type, Authorization',
    },
  });
}

async function readBody(req) {
  try { return await req.json(); }
  catch { return {}; }
}

function getToken(req) {
  const auth = req.headers.get('Authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  const url = new URL(req.url);
  return url.searchParams.get('token') || '';
}

// Resolve the authenticated username from a token, or return null.
async function resolveUser(req, env) {
  const token = getToken(req);
  if (!token) return null;
  return await tursoOne(env, 'SELECT username FROM sessions WHERE token = ?', [token]);
}

// ── Route handlers ─────────────────────────────────────────────────────────────

async function handleRegister(req, env) {
  const { username = '', password = '' } = await readBody(req);
  if (!username.trim() || !password)
    return json({ error: 'username and password are required' }, 400);
  try {
    const existing = await tursoOne(env, 'SELECT id FROM users WHERE username = ?', [username.trim()]);
    if (existing) return json({ error: 'Username already taken' }, 409);
    const salt = randomSalt();
    await turso(env, 'INSERT INTO users (username, salt, password_hash) VALUES (?, ?, ?)',
      [username.trim(), salt, await hashPassword(password, salt)]);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
  return json({ message: `User '${username.trim()}' registered successfully` }, 201);
}

async function handleLogin(req, env) {
  const { username = '', password = '' } = await readBody(req);
  if (!username.trim() || !password)
    return json({ error: 'username and password are required' }, 400);
  try {
    const user = await tursoOne(env, 'SELECT salt, password_hash FROM users WHERE username = ?', [username.trim()]);
    if (!user || await hashPassword(password, user.salt) !== user.password_hash)
      return json({ error: 'Invalid credentials' }, 401);
    const token = randomToken();
    await turso(env, 'INSERT INTO sessions (token, username) VALUES (?, ?)', [token, username.trim()]);
    return json({ message: 'Login successful', token });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

async function handleLogout(req, env) {
  let token = getToken(req);
  if (!token) { const body = await readBody(req); token = body.token || ''; }
  if (!token) return json({ error: 'token is required' }, 401);
  try {
    const row = await tursoOne(env, 'SELECT username FROM sessions WHERE token = ?', [token]);
    if (!row) return json({ error: 'Invalid or expired token' }, 401);
    await turso(env, 'DELETE FROM sessions WHERE token = ?', [token]);
    return json({ message: `User '${row.username}' logged out successfully` });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

async function handleMe(req, env) {
  const session = await resolveUser(req, env);
  if (!session) return json({ error: 'token required or invalid' }, 401);
  try {
    const user = await tursoOne(env, 'SELECT id, username, created_at FROM users WHERE username = ?', [session.username]);
    if (!user) return json({ error: 'User not found' }, 404);
    return json({ id: user.id, username: user.username, created_at: user.created_at });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

// PUT /me/password — change password (requires current password)
async function handleUpdatePassword(req, env) {
  const session = await resolveUser(req, env);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  const { current_password = '', new_password = '' } = await readBody(req);
  if (!current_password || !new_password)
    return json({ error: 'current_password and new_password are required' }, 400);
  if (new_password.length < 6)
    return json({ error: 'new_password must be at least 6 characters' }, 400);
  try {
    const user = await tursoOne(env, 'SELECT salt, password_hash FROM users WHERE username = ?', [session.username]);
    if (!user || await hashPassword(current_password, user.salt) !== user.password_hash)
      return json({ error: 'Current password is incorrect' }, 403);
    const newSalt = randomSalt();
    const newHash = await hashPassword(new_password, newSalt);
    await turso(env, 'UPDATE users SET salt = ?, password_hash = ? WHERE username = ?',
      [newSalt, newHash, session.username]);
    // Invalidate all other sessions so stale tokens can't be reused
    await turso(env, 'DELETE FROM sessions WHERE username = ?', [session.username]);
    return json({ message: 'Password updated. Please log in again.' });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

// PATCH /me/username — change username
async function handleUpdateUsername(req, env) {
  const session = await resolveUser(req, env);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  const { new_username = '' } = await readBody(req);
  if (!new_username.trim())
    return json({ error: 'new_username is required' }, 400);
  try {
    const taken = await tursoOne(env, 'SELECT id FROM users WHERE username = ?', [new_username.trim()]);
    if (taken) return json({ error: 'Username already taken' }, 409);
    await turso(env, 'UPDATE users SET username = ? WHERE username = ?',
      [new_username.trim(), session.username]);
    // Update sessions so the current token keeps working
    await turso(env, 'UPDATE sessions SET username = ? WHERE username = ?',
      [new_username.trim(), session.username]);
    return json({ message: `Username changed to '${new_username.trim()}'` });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

// DELETE /me — delete own account
async function handleDeleteAccount(req, env) {
  const session = await resolveUser(req, env);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  const { password = '' } = await readBody(req);
  if (!password) return json({ error: 'password is required to delete account' }, 400);
  try {
    const user = await tursoOne(env, 'SELECT salt, password_hash FROM users WHERE username = ?', [session.username]);
    if (!user || await hashPassword(password, user.salt) !== user.password_hash)
      return json({ error: 'Incorrect password' }, 403);
    // Cascade deletes sessions via FK
    await turso(env, 'DELETE FROM users WHERE username = ?', [session.username]);
    return json({ message: `Account '${session.username}' deleted` });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

// DELETE /me/sessions — logout from all devices
async function handleLogoutAll(req, env) {
  const session = await resolveUser(req, env);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  try {
    const { rowsAffected } = await turso(env, 'DELETE FROM sessions WHERE username = ?', [session.username]);
    return json({ message: `Logged out from ${rowsAffected} session(s)` });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

// GET /users — list all users (id, username, created_at — no secrets)
async function handleListUsers(env) {
  try {
    const { rows } = await turso(env, 'SELECT id, username, created_at FROM users ORDER BY created_at DESC');
    return json({ users: rows, total: rows.length });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

async function handleUsersCount(env) {
  try {
    const row = await tursoOne(env, 'SELECT COUNT(*) AS cnt FROM users');
    return json({ users: parseInt(row?.cnt ?? '0') });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

// ── Worker entry point ─────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url    = new URL(request.url);
    const method = request.method;
    const path   = url.pathname;

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }});
    }

    // Lazy schema init on every cold start
    await initDb(env);

    const db = (env.TURSO_DATABASE_URL || env.DATABASE_URL) ? 'turso' : 'unavailable';

    if (method === 'GET' && (path === '/' || path === '/health'))
      return json({
        app: 'Auth API (Node.js)', version: '2.0', status: 'running', db,
        endpoints: [
          'POST   /register',
          'POST   /login',
          'POST   /logout',
          'GET    /me',
          'PUT    /me/password',
          'PATCH  /me/username',
          'DELETE /me',
          'DELETE /me/sessions',
          'GET    /users',
          'GET    /users/count',
        ],
      });

    // Auth endpoints
    if (method === 'POST'   && path === '/register')      return await handleRegister(request, env);
    if (method === 'POST'   && path === '/login')         return await handleLogin(request, env);
    if (method === 'POST'   && path === '/logout')        return await handleLogout(request, env);

    // Profile endpoints (require auth token)
    if (method === 'GET'    && path === '/me')            return await handleMe(request, env);
    if (method === 'PUT'    && path === '/me/password')   return await handleUpdatePassword(request, env);
    if (method === 'PATCH'  && path === '/me/username')   return await handleUpdateUsername(request, env);
    if (method === 'DELETE' && path === '/me')            return await handleDeleteAccount(request, env);
    if (method === 'DELETE' && path === '/me/sessions')   return await handleLogoutAll(request, env);

    // User listing
    if (method === 'GET'    && path === '/users')         return await handleListUsers(env);
    if (method === 'GET'    && path === '/users/count')   return await handleUsersCount(env);

    return json({ error: 'Not found' }, 404);
  },
};

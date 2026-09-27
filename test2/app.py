from http.server import HTTPServer, BaseHTTPRequestHandler
import hashlib
import json
import os
import secrets
import urllib.request
import urllib.error

# ── Config ─────────────────────────────────────────────────────────────────────
PORT = int(os.environ.get("PORT", 8080))

# ── Turso HTTP client (no third-party packages) ────────────────────────────────
# Creds are read lazily on every call so they are resolved from os.environ
# at request time — not at module import time when the env may not be set yet.

def _get_turso_url():
    return (os.environ.get("TURSO_DATABASE_URL") or os.environ.get("DATABASE_URL", "")).strip()

def _get_turso_token():
    return (os.environ.get("TURSO_AUTH_TOKEN") or os.environ.get("DATABASE_AUTH_TOKEN", "")).strip()

def _turso_http_url(url):
    if url.startswith("libsql://"):
        url = "https://" + url[len("libsql://"):]
    return url.rstrip("/") + "/v2/pipeline"

def turso(sql: str, args: list = None):
    """Execute one SQL statement against Turso and return (columns, rows, rows_affected)."""
    turso_url   = _get_turso_url()
    turso_token = _get_turso_token()
    if not turso_url or not turso_token:
        raise RuntimeError("Database not configured: TURSO_URL/TURSO_TOKEN missing")
    payload = json.dumps({
        "requests": [
            {"type": "execute", "stmt": {"sql": sql, "args": [
                {"type": "text", "value": str(a)} if isinstance(a, str)
                else {"type": "integer", "value": str(int(a))} if isinstance(a, int)
                else {"type": "text", "value": str(a)}
                for a in (args or [])
            ]}},
            {"type": "close"}
        ]
    }).encode()

    req = urllib.request.Request(
        _turso_http_url(turso_url),
        data=payload,
        headers={
            "Authorization": f"Bearer {turso_token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        result = json.loads(resp.read())

    res = result["results"][0]
    if res["type"] == "error":
        raise RuntimeError(res["error"]["message"])

    rs = res["response"]["result"]
    cols = [c["name"] for c in rs.get("cols", [])]
    rows = [
        {cols[i]: cell.get("value") for i, cell in enumerate(row)}
        for row in rs.get("rows", [])
    ]
    rows_affected = rs.get("affected_row_count", 0)
    return cols, rows, rows_affected

def turso_fetchone(sql: str, args: list = None):
    _, rows, _ = turso(sql, args)
    return rows[0] if rows else None

def init_db():
    """Run schema migrations — non-fatal, never prevents server startup."""
    if not _get_turso_url() or not _get_turso_token():
        print("[init_db] TURSO creds not set — skipping schema init", flush=True)
        return
    try:
        turso("""CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            username      TEXT    NOT NULL UNIQUE,
            salt          TEXT    NOT NULL,
            password_hash TEXT    NOT NULL,
            created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
        )""")
        turso("""CREATE TABLE IF NOT EXISTS sessions (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            token      TEXT NOT NULL UNIQUE,
            username   TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
        )""")
        turso("CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)")
        turso("CREATE INDEX IF NOT EXISTS idx_users_username  ON users(username)")
        print("[init_db] Database schema ready.", flush=True)
    except Exception as e:
        print(f"[init_db] WARNING: schema init failed: {e}", flush=True)

# ── Helpers ────────────────────────────────────────────────────────────────────

def hash_password(password: str, salt: str) -> str:
    return hashlib.sha256((salt + password).encode()).hexdigest()


class Handler(BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        print(f"[{self.address_string()}] {format % args}", flush=True)

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def send_json(self, data: dict, status: int = 200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def read_json(self):
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"
        return json.loads(raw)

    # ── GET ───────────────────────────────────────────────────────────────────

    def do_GET(self):
        turso_url   = _get_turso_url()
        turso_token = _get_turso_token()
        if self.path in ("/", "/health"):
            self.send_json({
                "app": "Auth API",
                "version": "2.0",
                "status": "running",
                "db": "turso" if (turso_url and turso_token) else "unavailable",
                "endpoints": [
                    "POST /register",
                    "POST /login",
                    "POST /logout",
                    "GET  /me  (Authorization: Bearer <token>)",
                    "GET  /users/count",
                ],
            })
        elif self.path == "/debug-env":
            self.send_json({
                "TURSO_URL_set": bool(turso_url),
                "TURSO_TOKEN_set": bool(turso_token),
                "TURSO_URL_prefix": turso_url[:40] if turso_url else None,
                "env_keys": [k for k in os.environ if "TURSO" in k or "DATABASE" in k or "PORT" in k],
            })
        elif self.path == "/users/count":
            return self._users_count()
        elif self.path.startswith("/me"):
            return self._me()
        else:
            self.send_json({"error": "Not found"}, 404)

    # ── POST ──────────────────────────────────────────────────────────────────

    def do_POST(self):
        try:
            body = self.read_json()
        except (ValueError, json.JSONDecodeError):
            return self.send_json({"error": "Invalid JSON body"}, 400)

        if self.path == "/register":
            return self._register(body)
        if self.path == "/login":
            return self._login(body)
        if self.path == "/logout":
            return self._logout(body)
        self.send_json({"error": "Not found"}, 404)

    # ── Handlers ──────────────────────────────────────────────────────────────

    def _register(self, body: dict):
        username = (body.get("username") or "").strip()
        password = body.get("password") or ""
        if not username or not password:
            return self.send_json({"error": "username and password are required"}, 400)
        try:
            existing = turso_fetchone("SELECT id FROM users WHERE username = ?", [username])
            if existing:
                return self.send_json({"error": "Username already taken"}, 409)
            salt = secrets.token_hex(16)
            turso(
                "INSERT INTO users (username, salt, password_hash) VALUES (?, ?, ?)",
                [username, salt, hash_password(password, salt)],
            )
        except Exception as e:
            print(f"[register error] {e}", flush=True)
            return self.send_json({"error": str(e)}, 500)
        self.send_json({"message": f"User '{username}' registered successfully"}, 201)

    def _login(self, body: dict):
        username = (body.get("username") or "").strip()
        password = body.get("password") or ""
        if not username or not password:
            return self.send_json({"error": "username and password are required"}, 400)
        try:
            row = turso_fetchone(
                "SELECT salt, password_hash FROM users WHERE username = ?", [username]
            )
            if not row or hash_password(password, row["salt"]) != row["password_hash"]:
                return self.send_json({"error": "Invalid credentials"}, 401)
            token = secrets.token_hex(32)
            turso("INSERT INTO sessions (token, username) VALUES (?, ?)", [token, username])
        except Exception as e:
            print(f"[login error] {e}", flush=True)
            return self.send_json({"error": str(e)}, 500)
        self.send_json({"message": "Login successful", "token": token})

    def _logout(self, body: dict):
        token = (body.get("token") or "").strip()
        if not token:
            auth = self.headers.get("Authorization") or ""
            if auth.startswith("Bearer "):
                token = auth[len("Bearer "):]
        if not token:
            return self.send_json({"error": "token is required"}, 401)
        try:
            row = turso_fetchone("SELECT username FROM sessions WHERE token = ?", [token])
            if not row:
                return self.send_json({"error": "Invalid or expired token"}, 401)
            turso("DELETE FROM sessions WHERE token = ?", [token])
        except Exception as e:
            print(f"[logout error] {e}", flush=True)
            return self.send_json({"error": str(e)}, 500)
        self.send_json({"message": f"User '{row['username']}' logged out successfully"})

    def _me(self):
        """GET /me — return the username for the current session token."""
        token = ""
        auth = self.headers.get("Authorization") or ""
        if auth.startswith("Bearer "):
            token = auth[len("Bearer "):]
        # Also accept ?token= query param (avoids custom header preflight)
        if not token and "?" in self.path:
            for part in self.path.split("?", 1)[1].split("&"):
                if part.startswith("token="):
                    token = part[6:]
        if not token:
            return self.send_json({"error": "token required"}, 401)
        try:
            row = turso_fetchone("SELECT username FROM sessions WHERE token = ?", [token])
            if not row:
                return self.send_json({"error": "Invalid or expired token"}, 401)
        except Exception as e:
            return self.send_json({"error": str(e)}, 500)
        self.send_json({"username": row["username"]})

    def _users_count(self):
        """GET /users/count — total registered users."""
        try:
            row = turso_fetchone("SELECT COUNT(*) AS cnt FROM users")
            count = int(row["cnt"]) if row else 0
        except Exception as e:
            return self.send_json({"error": str(e)}, 500)
        self.send_json({"users": count})


# ── Entry point ────────────────────────────────────────────────────────────────

print(f"Starting Auth API on port {PORT}", flush=True)
print(f"Turso URL at startup: {_get_turso_url() or '(not set yet)'}", flush=True)
init_db()
HTTPServer(("0.0.0.0", PORT), Handler).serve_forever()

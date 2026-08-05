# TwinTest Server — Cloudflare Python Worker
# Deployed via ugahost to Cloudflare Workers / Pyodide.
# Uses ONLY the workers API + Python stdlib — no pip packages.
# Database: Turso (libSQL) via its HTTP API (TURSO_DATABASE_URL + TURSO_AUTH_TOKEN env vars)
#
# Endpoints:
#   GET    /               Server info (JSON)
#   GET    /api/status     Health check
#   POST   /api/register   Create account  { username, email, password }
#   POST   /api/login      Authenticate    { username, password }
#   GET    /api/whoami     Current user info (auth required)
#   POST   /api/echo       Echo JSON payload (rate-limited)
#   GET    /admin/users    List all users (admin token required)
#
# Auth: HMAC-SHA256 signed Bearer tokens returned by /api/login

import json
import hmac
import time
import hashlib
import base64
import re
import os
from urllib.parse import urlparse

from workers import WorkerEntrypoint, Response

# ── Config ────────────────────────────────────────────────────────────────────

SECRET_KEY = os.environ.get("SECRET_KEY", "twin-test-change-in-prod-min32chars")
TOKEN_TTL  = 7200

# In-memory rate limit store { key: [timestamp, ...] }
_rate_store = {}


# ── Turso HTTP client ─────────────────────────────────────────────────────────

class TursoDB:
    """Minimal Turso HTTP API client using stdlib + workers fetch.

    All SQL uses positional ? placeholders; pass args as a list or tuple.
    """

    def __init__(self, url, token):
        # url is like  libsql://name-org.turso.io
        # HTTP API lives at  https://name-org.turso.io
        self.base = url.replace("libsql://", "https://")
        self.token = token

    async def execute(self, sql, args=None):
        """Execute one statement, return list-of-row-dicts or raise."""
        stmt_obj = {"sql": sql}
        if args:
            stmt_obj["args"] = [self._val(v) for v in args]
        body = json.dumps({
            "requests": [
                {"type": "execute", "stmt": stmt_obj},
                {"type": "close"},
            ]
        })
        import pyodide.http
        resp = await pyodide.http.pyfetch(
            f"{self.base}/v2/pipeline",
            method="POST",
            headers={
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json",
            },
            body=body,
        )
        data = json.loads(await resp.string())
        res = data["results"][0]
        if res["type"] == "error":
            raise RuntimeError(res["error"]["message"])
        result = res["response"]["result"]
        cols = [c["name"] for c in result["cols"]]
        return [dict(zip(cols, [self._unwrap(v) for v in row])) for row in result["rows"]]

    async def run(self, sql, args=None):
        """Execute a statement that returns no rows (INSERT/UPDATE/DELETE/CREATE)."""
        await self.execute(sql, args)

    def _val(self, v):
        if v is None:
            return {"type": "null"}
        if isinstance(v, bool):
            return {"type": "integer", "value": str(int(v))}
        if isinstance(v, int):
            return {"type": "integer", "value": str(v)}
        if isinstance(v, float):
            return {"type": "float", "value": str(v)}
        return {"type": "text", "value": str(v)}

    def _unwrap(self, v):
        if v["type"] == "null":
            return None
        if v["type"] == "integer":
            return int(v["value"])
        if v["type"] == "float":
            return float(v["value"])
        return v["value"]


# ── Crypto helpers ────────────────────────────────────────────────────────────

def _b64url_encode(data):
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def _b64url_decode(s):
    pad = 4 - len(s) % 4
    return base64.urlsafe_b64decode(s + "=" * (pad % 4))

def _hash_password(plaintext):
    salt = os.urandom(16)
    dk   = hashlib.pbkdf2_hmac("sha256", plaintext.encode(), salt, 260_000)
    return "pbkdf2:" + _b64url_encode(salt) + ":" + _b64url_encode(dk)

def _verify_password(plaintext, stored):
    try:
        parts = stored.split(":")
        salt  = _b64url_decode(parts[1])
        dk    = _b64url_decode(parts[2])
        check = hashlib.pbkdf2_hmac("sha256", plaintext.encode(), salt, 260_000)
        return hmac.compare_digest(dk, check)
    except Exception:
        return False

def _make_token(user_id, username, is_admin):
    payload = _b64url_encode(json.dumps({
        "user_id":  user_id,
        "username": username,
        "is_admin": is_admin,
        "exp":      int(time.time()) + TOKEN_TTL,
    }).encode())
    sig = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).digest()
    return payload + "." + _b64url_encode(sig)

def _verify_token(token):
    try:
        payload_b64, sig_b64 = token.rsplit(".", 1)
        expected = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(_b64url_decode(sig_b64), expected):
            return None
        data = json.loads(_b64url_decode(payload_b64))
        if data.get("exp", 0) < time.time():
            return None
        return data
    except Exception:
        return None


# ── Rate limiter ──────────────────────────────────────────────────────────────

def _rate_check(key, limit, window):
    now  = time.time()
    hits = [t for t in _rate_store.get(key, []) if now - t < window]
    if len(hits) >= limit:
        _rate_store[key] = hits
        return False
    hits.append(now)
    _rate_store[key] = hits
    return True


# ── Validation ────────────────────────────────────────────────────────────────

_END = chr(36)
_USERNAME_RE = re.compile(r"^[A-Za-z0-9_-]{3,64}" + _END)
_EMAIL_RE    = re.compile(r"^[^@\s]+" + r"@[^@\s]+\.[^@\s]+" + _END)
_PW_RE       = re.compile(r"^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,128}" + _END)

def _validate_register(body):
    if not _USERNAME_RE.match(body.get("username", "")):
        return "Username: 3-64 chars, letters/digits/_ or -"
    if not _EMAIL_RE.match(body.get("email", "")):
        return "Invalid email address"
    if not _PW_RE.match(body.get("password", "")):
        return "Password needs 8+ chars, one uppercase, one digit, one special char"
    return None


# ── Response helpers ──────────────────────────────────────────────────────────

def _json(data, status=200):
    return Response(
        json.dumps(data),
        status=status,
        headers={
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "X-Content-Type-Options": "nosniff",
        },
    )

def _err(msg, status):
    return _json({"error": msg}, status)


# ── Landing JSON ──────────────────────────────────────────────────────────────

LANDING = {
    "server":  "TwinTest",
    "version": "2.0.0",
    "hosted":  "ugahost / Cloudflare Workers",
    "endpoints": [
        {"method": "GET",    "path": "/api/status"},
        {"method": "POST",   "path": "/api/register",  "rate": "10/10min"},
        {"method": "POST",   "path": "/api/login",     "rate": "10/min"},
        {"method": "GET",    "path": "/api/whoami",    "auth": True},
        {"method": "POST",   "path": "/api/echo",      "rate": "5/min"},
        {"method": "GET",    "path": "/admin/users",   "auth": "admin"},
    ],
    "note": "POST /api/login returns a Bearer token. Pass as: Authorization: Bearer <token>",
    "default_admin": "username=admin password=Admin@1234!",
}


# ── DB bootstrap ──────────────────────────────────────────────────────────────

_DB_INIT = [
    (
        "CREATE TABLE IF NOT EXISTS users ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "username TEXT UNIQUE NOT NULL,"
        "email TEXT UNIQUE NOT NULL,"
        "password_hash TEXT NOT NULL,"
        "is_admin INTEGER NOT NULL DEFAULT 0,"
        "is_active INTEGER NOT NULL DEFAULT 1,"
        "created_at INTEGER NOT NULL,"
        "last_login INTEGER"
        ")"
    ),
    (
        "CREATE TABLE IF NOT EXISTS audit ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "user_id INTEGER,"
        "action TEXT NOT NULL,"
        "ip TEXT,"
        "detail TEXT,"
        "ts INTEGER NOT NULL"
        ")"
    ),
]

async def _bootstrap_db(db):
    for stmt in _DB_INIT:
        await db.run(stmt)
    rows = await db.execute("SELECT id FROM users WHERE username = 'admin'")
    if not rows:
        ph = _hash_password("Admin@1234!")
        await db.run(
            "INSERT INTO users (username,email,password_hash,is_admin,is_active,created_at)"
            " VALUES ('admin','admin@twintest.local',?,1,1,?)",
            [ph, int(time.time())]
        )

async def _audit(db, action, ip, user_id=None, detail=""):
    await db.run(
        "INSERT INTO audit (user_id,action,ip,detail,ts) VALUES (?,?,?,?,?)",
        [user_id, action, ip[:45], detail[:500], int(time.time())]
    )


# ── Route handlers ────────────────────────────────────────────────────────────

async def handle_status(request, db, ip):
    return _json({"status": "ok", "server": "TwinTest", "version": "2.0.0",
                  "time": int(time.time())})

async def handle_register(request, db, ip):
    if not _rate_check("reg:" + ip, 10, 600):
        return _err("Too many registration attempts. Try again in 10 minutes.", 429)
    try:
        body = json.loads(await request.text())
    except Exception:
        return _err("Invalid JSON body", 400)

    err = _validate_register(body)
    if err:
        return _err(err, 422)

    username = body["username"].strip()
    email    = body["email"].strip().lower()
    password = body["password"]

    existing = await db.execute(
        "SELECT id FROM users WHERE username=? OR email=?",
        [username, email]
    )
    if existing:
        return _err("Username or email already registered", 409)

    ph = _hash_password(password)
    result = await db.execute(
        "INSERT INTO users (username,email,password_hash,is_admin,is_active,created_at)"
        " VALUES (?,?,?,0,1,?) RETURNING id",
        [username, email, ph, int(time.time())]
    )
    uid = result[0]["id"] if result else None
    await _audit(db, "register", ip, uid, "username=" + username)
    return _json({"success": True,
                  "message": "Account created. POST /api/login to get a token."}, 201)

async def handle_login(request, db, ip):
    if not _rate_check("login:" + ip, 10, 60):
        return _err("Too many login attempts. Wait 1 minute.", 429)
    try:
        body = json.loads(await request.text())
    except Exception:
        return _err("Invalid JSON body", 400)

    username = str(body.get("username", "")).strip()
    password = str(body.get("password", ""))
    if not username or not password:
        return _err("username and password are required", 400)

    rows = await db.execute(
        "SELECT id, password_hash, is_admin, is_active FROM users WHERE username=?",
        [username]
    )
    row    = rows[0] if rows else None
    stored = row["password_hash"] if row else "pbkdf2:AA:BB"
    valid  = _verify_password(password, stored)

    if not row or not valid or not row["is_active"]:
        await _audit(db, "login_failed", ip, detail="username=" + username)
        return _err("Invalid username or password", 401)

    await db.run(
        "UPDATE users SET last_login=? WHERE id=?",
        [int(time.time()), row["id"]]
    )
    token = _make_token(row["id"], username, bool(row["is_admin"]))
    await _audit(db, "login_success", ip, row["id"])
    return _json({
        "success":    True,
        "token":      token,
        "username":   username,
        "is_admin":   bool(row["is_admin"]),
        "expires_in": TOKEN_TTL,
    })

async def handle_whoami(request, db, ip, user):
    return _json({"user_id": user["user_id"], "username": user["username"],
                  "is_admin": user["is_admin"]})

async def handle_echo(request, db, ip):
    if not _rate_check("echo:" + ip, 5, 60):
        return _err("Rate limit: 5 requests per minute", 429)
    try:
        body = json.loads(await request.text())
    except Exception:
        return _err("Invalid JSON body", 400)
    if len(json.dumps(body)) > 4096:
        return _err("Payload too large (max 4 KB)", 413)
    return _json({"echo": body, "received_at": int(time.time())})

async def handle_admin_users(request, db, ip, user):
    if not user["is_admin"]:
        await _audit(db, "admin_denied", ip, user["user_id"])
        return _err("Forbidden - admin only", 403)
    users = await db.execute(
        "SELECT id, username, email, is_admin, is_active, created_at, last_login"
        " FROM users ORDER BY id"
    )
    audit = await db.execute(
        "SELECT * FROM audit ORDER BY ts DESC LIMIT 50"
    )
    return _json({"users": users, "recent_audit": audit})


# ── Auth helper ───────────────────────────────────────────────────────────────

def _get_user(request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    return _verify_token(auth[7:])


# ── Router ────────────────────────────────────────────────────────────────────

async def route(request, db):
    method = request.method.upper()
    path   = urlparse(request.url).path.rstrip("/") or "/"
    ip     = request.headers.get("CF-Connecting-IP", "0.0.0.0")

    # CORS preflight
    if method == "OPTIONS":
        return Response("", status=204, headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        })

    if path == "/" and method == "GET":
        return _json(LANDING)
    if path == "/api/status" and method == "GET":
        return await handle_status(request, db, ip)
    if path == "/api/register" and method == "POST":
        return await handle_register(request, db, ip)
    if path == "/api/login" and method == "POST":
        return await handle_login(request, db, ip)
    if path == "/api/echo" and method == "POST":
        return await handle_echo(request, db, ip)

    user = _get_user(request)

    if path == "/api/whoami" and method == "GET":
        if not user:
            return _err("Unauthorised - send Authorization: Bearer <token>", 401)
        return await handle_woami(request, db, ip, user)
    if path == "/admin/users" and method == "GET":
        if not user:
            return _err("Unauthorised", 401)
        return await handle_admin_users(request, db, ip, user)

    return _err("Not found", 404)


# ── Worker entrypoint ─────────────────────────────────────────────────────────

class Default(WorkerEntrypoint):
    async def on_fetch(self, request, env, ctx=None):
        turso_url   = os.environ.get("TURSO_DATABASE_URL", "")
        turso_token = os.environ.get("TURSO_AUTH_TOKEN", "")

        if not turso_url or not turso_token:
            return _json({
                "error": "Database not configured",
                "detail": "TURSO_DATABASE_URL and TURSO_AUTH_TOKEN env vars are required"
            }, 503)

        db = TursoDB(turso_url, turso_token)
        try:
            await _bootstrap_db(db)
            return await route(request, db)
        except Exception as exc:
            return _json({"error": "Internal server error", "detail": str(exc)}, 500)

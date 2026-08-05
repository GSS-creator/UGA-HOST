# UGA HOST CLI

[![npm version](https://img.shields.io/npm/v/ugahost.svg)](https://www.npmjs.com/package/ugahost)
[![npm downloads](https://img.shields.io/npm/dm/ugahost.svg)](https://www.npmjs.com/package/ugahost)
[![Node.js](https://img.shields.io/badge/Node.js-Supported-green)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-Supported-green)](https://www.python.org)
[![Turso](https://img.shields.io/badge/Turso-libSQL%2FSQLite-blue)](https://turso.tech)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

The official command-line interface for **UGA HOST** — deploy Node.js and Python backends to the edge in seconds, with a **Turso (libSQL/SQLite) database automatically provisioned** for every project.

**UGA HOST** runs on **Cloudflare Workers** — your code is deployed globally with zero cold starts. Every app gets:

- A live URL: `https://your-subdomain.gss-tec.com`
- A **Turso database** (libSQL / SQLite) with credentials injected automatically as `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`
- A full **SQL CLI** to manage tables, run queries, migrate schemas, export and import data

> 🗄️ **Powered by Turso** — [turso.tech](https://turso.tech). Each project gets its own isolated libSQL database on the free Turso plan. No configuration needed — UGA HOST provisions it on first deploy and injects the credentials into your worker automatically.

## 🚀 Features

- ✅ **Node.js Support** — Deploy Express, Fastify, Koa, or vanilla Node.js apps
- ✅ **Python Support** — Deploy Cloudflare Python Workers (Pyodide runtime) — no pip, pure Python stdlib + `workers` module
- ✅ **Edge Deployment** — Cloudflare's global network, zero cold starts
- ✅ **Turso DB auto-provisioned** — Every project gets a dedicated libSQL/SQLite database
- ✅ **Credentials auto-injected** — `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` set automatically
- ✅ **Custom Subdomains** — `your-app.gss-tec.com`
- ✅ **Environment Variables** — Secure configuration management
- ✅ **Real-time Logs** — Monitor your application
- ✅ **Smart Redeploy** — `ugahost deploy` updates existing projects automatically
- ✅ **Full SQL CLI** — `tables`, `query`, `find`, `insert`, `update`, `delete`, `migrate`, `export`, `import`
- ✅ **Dashboard DB Explorer** — Browse tables, run SQL, view schema in the browser
- ✅ **API Key Authentication** — Secure CLI access
- ✅ **Free Plan** — 2 apps, Turso free DB, 10,000 requests/day

## 📦 Installation

Install the UGA HOST CLI globally using npm:

```bash
npm install -g ugahost
```

### Upgrade to Latest Version

If you already have ugahost installed, upgrade to get the latest features:

```bash
npm install -g ugahost@latest
```

Or install a specific version:

```bash
npm install -g ugahost@2.1.0
```

Verify installation:

```bash
ugahost --version
# Output: 2.1.0
```

### What's New in v2.1.0

- ✅ **Turso (SQLite) Database CLI** — `ugahost db` commands auto-detect Turso vs R2 and route correctly
- ✅ **`ugahost db tables`** — List SQLite tables with row counts (Turso projects)
- ✅ **`ugahost db query "<SQL>"`** — Run raw SQL against your Turso database
- ✅ **`ugahost db migrate <file.sql>`** — Run `.sql` migration files (split on `;`)
- ✅ **Python Worker support** — `ugahost deploy` now works for Python projects with Turso DB auto-provisioned

### What's New in v1.0.5

- ✅ **Full Database CLI** — `ugahost db` commands (find, insert, update, delete, drop, migrate, export, import)
- ✅ **Smart Redeploy** — `ugahost deploy` detects existing projects and redeploys instead of creating new ones
- ✅ **Deployment Summary** — Shows project ID, version, URL and status after every deploy
- ✅ **Better Error Messages** — Full error details shown on failure

See [COMMANDS.md](./COMMANDS.md) for the complete command reference.

## 🎯 Quick Start

### 1. Create an Account & API Key

1. Go to the dashboard: **https://qssnpaas.gss-tec.com**
2. Login with GitHub
3. Navigate to **UGA HOST** → **API Keys** tab
4. Click **"Create API Key"**
5. Give it a name (e.g., "My Laptop")
6. **Copy the API key** (starts with `ugahost_`) - you'll only see it once!

### 2. Login to UGA HOST

```bash
ugahost login
```

Enter your:
- **Email**: Your GitHub email
- **API Key**: The key you just created

You should see:
```
✅ Login successful!
Logged in as: your-email@example.com
You can now deploy your applications with: ugahost deploy
```

### 3. Initialize Your Project

```bash
cd your-project
ugahost init
```

You'll be asked to provide:
- Project name
- Subdomain (your-app.gss-tec.com)
- Language (nodejs or python)
- Port number

This creates a `ugahost.json` configuration file in your project.

### 3. Deploy Your Application

```bash
ugahost deploy
```

Your application will be deployed and accessible at `https://your-subdomain.gss-tec.com`

## Commands

### Authentication

#### `ugahost login`
Login to your UGA HOST account.

```bash
ugahost login
```

### Project Management

#### `ugahost init`
Initialize a new UGA HOST project in the current directory.

```bash
ugahost init
```

#### `ugahost projects`
List all your projects.

```bash
ugahost projects
```

#### `ugahost status`
Show detailed status of the current project.

```bash
ugahost status
```

### Deployment

#### `ugahost deploy`
Deploy your application to UGA HOST.

```bash
ugahost deploy
ugahost deploy -m "Added new feature"
```

Options:
- `-m, --message <message>` - Deployment message

### Application Control

#### `ugahost start`
Start your backend server.

```bash
ugahost start
```

#### `ugahost stop`
Stop your backend server.

```bash
ugahost stop
```

#### `ugahost restart`
Restart your backend server.

```bash
ugahost restart
```

### Logs

#### `ugahost logs`
View application logs.

```bash
ugahost logs
ugahost logs -f
ugahost logs -n 500
```

Options:
- `-f, --follow` - Follow log output in real-time
- `-n, --lines <number>` - Number of lines to show (default: 100)

### Environment Variables

#### `ugahost env list`
List all environment variables.

```bash
ugahost env list
```

#### `ugahost env set <key> <value>`
Set an environment variable.

```bash
ugahost env set DATABASE_URL "postgresql://..."
ugahost env set API_KEY "secret123" --secret
```

Options:
- `-s, --secret` - Mark the variable as secret (will be hidden in logs)

#### `ugahost env unset <key>`
Remove an environment variable.

```bash
ugahost env unset API_KEY
```

### Database Management

Auto-detects **Turso (SQLite)** or **R2 (NoSQL)** and routes commands accordingly.

#### `ugahost db info`
Show database type, tables/collections, and URL.

```bash
ugahost db info
```

#### `ugahost db tables` *(Turso)*
List all SQLite tables with row counts.

```bash
ugahost db tables
```

#### `ugahost db collections` *(R2)*
List all NoSQL collections.

```bash
ugahost db collections
```

#### `ugahost db query "<SQL>"` *(Turso)*
Run any raw SQL statement.

```bash
ugahost db query "SELECT * FROM users"
ugahost db query "CREATE TABLE logs (id INTEGER PRIMARY KEY, msg TEXT)"
```

#### `ugahost db find <table> [filter]`
SELECT rows (Turso) or find documents (R2).

```bash
ugahost db find users
ugahost db find users '{"is_admin":1}'
ugahost db find users --json
```

#### `ugahost db get <table> <id>`
Get one row/document by `id` (Turso) or `_id` (R2).

```bash
ugahost db get users 1
```

#### `ugahost db insert <table> <json>`
Insert a row (Turso) or document (R2).

```bash
ugahost db insert users '{"username":"alice","email":"alice@x.com","is_admin":0,"is_active":1,"created_at":1700000000}'
```

#### `ugahost db update <table> <where> <set>`
UPDATE rows / update documents.

```bash
ugahost db update users '{"id":3}' '{"is_active":0}'
```

#### `ugahost db delete <table> <where>`
DELETE rows / delete documents.

```bash
ugahost db delete users '{"id":3}'
```

#### `ugahost db count <table> [filter]`
Count rows/documents.

```bash
ugahost db count users
ugahost db count users '{"is_admin":1}'
```

#### `ugahost db drop <table>`
DROP TABLE (Turso) or drop collection (R2). Asks for confirmation.

```bash
ugahost db drop example
```

#### `ugahost db migrate <file>`
Run a `.sql` file (Turso) or JSON migration file (both).

```bash
ugahost db migrate schema.sql
ugahost db migrate migrations/001_seed.json
```

#### `ugahost db export <table>`
Export all rows to a JSON file.

```bash
ugahost db export users
ugahost db export users -o backup/users.json
```

#### `ugahost db import <table> <file>`
Bulk-insert a JSON array into a table/collection.

```bash
ugahost db import users seed.json
```

> 📖 See [COMMANDS.md](./COMMANDS.md) for full details including migration file format.

## Supported Languages

UGA HOST currently supports:

- ✅ **Node.js** (`nodejs`) - Express, Fastify, vanilla Node.js
- ✅ **Python** (`python`) - Cloudflare Pyodide Workers (see constraints below)

> ⚠️ **Python on UGA HOST is NOT a traditional server.** There is no Flask, no Django, no pip, and no `requirements.txt`. Your Python app runs inside the Cloudflare Pyodide runtime. See [Python Worker Rules](#python-worker-rules) for what this means in practice.

**Note**: Only Node.js and Python are supported. Other languages require external infrastructure and are not currently available.

## Python Worker Rules

> Read this section before writing a single line of Python for UGA HOST. Every point below comes from real deployment experience.

### Entrypoint — the only valid structure

Your file **must** be named `app.py` and **must** contain exactly this pattern:

```python
from workers import WorkerEntrypoint, Response

class Default(WorkerEntrypoint):
    async def on_fetch(self, request, env, ctx=None):
        # your logic here
        return Response("hello", status=200,
                        headers={"Content-Type": "text/plain"})
```

- The class **must** be named `Default` and inherit `WorkerEntrypoint`.
- The method **must** be `async def on_fetch(self, request, env, ctx=None)`.
- Do **not** use a top-level `fetch()` function — that is the JavaScript pattern and will silently fail.

### No pip — stdlib only (plus `workers` + `pyodide.http`)

| ✅ Allowed | ❌ Not allowed |
|---|---|
| `json`, `hmac`, `hashlib`, `base64`, `re`, `os`, `time`, `urllib.parse` | `flask`, `fastapi`, `requests`, `aiohttp`, `httpx`, any pip package |
| `from workers import WorkerEntrypoint, Response` | `import flask`, `import django` |
| `import pyodide.http` (for HTTP calls) | `import urllib.request` (network calls to external URLs) |

### Making HTTP calls from your worker

Use `pyodide.http.pyfetch()` — not `requests`, not `urllib.request`:

```python
import pyodide.http

resp = await pyodide.http.pyfetch(
    "https://some-api.com/endpoint",
    method="POST",
    headers={"Content-Type": "application/json"},
    body=json.dumps({"key": "value"}),
)
data = json.loads(await resp.string())
```

### Reading the Turso database

UGA HOST auto-injects `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` as environment variables. Read them with `os.environ.get(...)` and call Turso's HTTP API directly via `pyodide.http.pyfetch`:

```python
import os, json
import pyodide.http

turso_url   = os.environ.get("TURSO_DATABASE_URL", "")   # e.g. libsql://name-org.turso.io
turso_token = os.environ.get("TURSO_AUTH_TOKEN", "")

# Convert libsql:// → https:// for the HTTP API
base = turso_url.replace("libsql://", "https://")

body = json.dumps({
    "requests": [
        {"type": "execute", "stmt": {"sql": "SELECT * FROM users", "args": []}},
        {"type": "close"},
    ]
})

resp = await pyodide.http.pyfetch(
    f"{base}/v2/pipeline",
    method="POST",
    headers={
        "Authorization": f"Bearer {turso_token}",
        "Content-Type": "application/json",
    },
    body=body,
)
data = json.loads(await resp.string())
rows_raw = data["results"][0]["response"]["result"]
cols = [c["name"] for c in rows_raw["cols"]]
rows = [dict(zip(cols, [v["value"] for v in row])) for row in rows_raw["rows"]]
```

**SQL parameter placeholders must be positional `?`** — named parameters (`:name`) are not supported by the Turso HTTP API. Always pass args as a list of typed objects:

```python
# ✅ Correct
{"sql": "SELECT id FROM users WHERE username=?", "args": [{"type": "text", "value": "alice"}]}

# ❌ Wrong — named params will cause a runtime error
{"sql": "SELECT id FROM users WHERE username=:username"}
```

### Always guard against missing DB credentials

Your worker is called before UGA HOST finishes provisioning on the very first deploy. Guard against this:

```python
class Default(WorkerEntrypoint):
    async def on_fetch(self, request, env, ctx=None):
        turso_url   = os.environ.get("TURSO_DATABASE_URL", "")
        turso_token = os.environ.get("TURSO_AUTH_TOKEN", "")
        if not turso_url or not turso_token:
            return Response(
                json.dumps({"error": "Database not configured",
                            "detail": "TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required"}),
                status=503,
                headers={"Content-Type": "application/json"},
            )
        # safe to use DB from here
```

### Schema bootstrap on every request

Because Cloudflare Workers are stateless, run `CREATE TABLE IF NOT EXISTS` on every request. It is cheap and safe:

```python
async def _bootstrap_db(db):
    await db.run(
        "CREATE TABLE IF NOT EXISTS users ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL,"
        "email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,"
        "is_admin INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1,"
        "created_at INTEGER NOT NULL, last_login INTEGER)"
    )
```

Call it at the top of `on_fetch` before any routing logic.

### Token auth with HMAC-SHA256

UGA HOST does not provide session management. Implement stateless tokens yourself using `hmac` + `hashlib` from the stdlib:

```python
import hmac, hashlib, base64, json, time, os

SECRET_KEY = os.environ.get("SECRET_KEY", "change-this-in-production-32chars!")
TOKEN_TTL  = 7200  # seconds

def _b64url_encode(data):
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def _make_token(user_id, username, is_admin):
    payload = _b64url_encode(json.dumps({
        "user_id": user_id, "username": username,
        "is_admin": is_admin, "exp": int(time.time()) + TOKEN_TTL,
    }).encode())
    sig = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).digest()
    return payload + "." + _b64url_encode(sig)

def _verify_token(token):
    try:
        payload_b64, sig_b64 = token.rsplit(".", 1)
        expected = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(base64.urlsafe_b64decode(sig_b64 + "=="), expected):
            return None
        data = json.loads(base64.urlsafe_b64decode(payload_b64 + "=="))
        return None if data.get("exp", 0) < time.time() else data
    except Exception:
        return None
```

> ⚠️ **Set `SECRET_KEY` as an environment variable in production.** Never leave the default in a live deployment.

```bash
ugahost env set SECRET_KEY "your-long-random-secret-min-32-chars" --secret
```

### Password hashing

Use `hashlib.pbkdf2_hmac` — never store plain-text passwords:

```python
import hashlib, base64, os

def _hash_password(plaintext):
    salt = os.urandom(16)
    dk   = hashlib.pbkdf2_hmac("sha256", plaintext.encode(), salt, 260_000)
    return "pbkdf2:" + base64.urlsafe_b64encode(salt).rstrip(b"=").decode() \
                     + ":" + base64.urlsafe_b64encode(dk).rstrip(b"=").decode()

def _verify_password(plaintext, stored):
    try:
        _, salt_b64, dk_b64 = stored.split(":")
        salt = base64.urlsafe_b64decode(salt_b64 + "==")
        dk   = base64.urlsafe_b64decode(dk_b64 + "==")
        check = hashlib.pbkdf2_hmac("sha256", plaintext.encode(), salt, 260_000)
        return hmac.compare_digest(dk, check)
    except Exception:
        return False
```

### In-memory rate limiting

Cloudflare Workers are long-lived in the same isolate for burst traffic, so in-memory rate limiting works for moderate protection. For stricter limits, use Cloudflare's [Rate Limiting](https://developers.cloudflare.com/waf/rate-limiting-rules/) rules at the edge.

```python
_rate_store = {}

def _rate_check(key, limit, window_seconds):
    now  = time.time()
    hits = [t for t in _rate_store.get(key, []) if now - t < window_seconds]
    if len(hits) >= limit:
        _rate_store[key] = hits
        return False
    hits.append(now)
    _rate_store[key] = hits
    return True

# Usage: 10 login attempts per minute per IP
if not _rate_check("login:" + ip, 10, 60):
    return _err("Too many login attempts. Wait 1 minute.", 429)
```

### CORS — always add headers

Browsers will block your API without CORS headers. Handle `OPTIONS` preflight and add headers to every JSON response:

```python
# In your router, handle OPTIONS first:
if request.method.upper() == "OPTIONS":
    return Response("", status=204, headers={
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    })

# In your JSON helper:
def _json(data, status=200):
    return Response(json.dumps(data), status=status, headers={
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "X-Content-Type-Options": "nosniff",
    })
```

### Getting the client IP

Cloudflare forwards the real client IP in the `CF-Connecting-IP` header:

```python
ip = request.headers.get("CF-Connecting-IP", "0.0.0.0")
```

Do not use `request.remote_addr` — it will return the Cloudflare edge IP, not the client.

### Required environment variables for a production Python backend

| Variable | Where to set | Description |
|---|---|---|
| `TURSO_DATABASE_URL` | Auto-injected by ugahost | libSQL database URL |
| `TURSO_AUTH_TOKEN` | Auto-injected by ugahost | Turso auth token |
| `SECRET_KEY` | `ugahost env set SECRET_KEY "..." --secret` | HMAC signing key for tokens |

```bash
# Set your secret key before going live
ugahost env set SECRET_KEY "$(python -c 'import secrets; print(secrets.token_hex(32))')" --secret
ugahost env list   # confirm it's set
```

## Configuration File

The `ugahost.json` file stores your project configuration:

```json
{
  "name": "my-api",
  "subdomain": "my-api",
  "language": "nodejs",
  "port": 3000,
  "projectId": "abc123"
}
```

## Database

Each project automatically gets a **Turso (libSQL/SQLite)** database — provisioned at deploy time. Credentials are injected as `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` environment variables.

Access your database using:
- The UGA HOST dashboard → Database tab (full table browser + SQL console)
- The CLI commands (`ugahost db ...`)
- Your application code via `os.environ` (Python) or `process.env` (Node.js)

## Examples

### Deploy a Node.js Express App

```bash
cd my-express-app
ugahost login
ugahost init
# Choose: nodejs, port 3000
ugahost deploy
```

### Deploy a Python Cloudflare Worker App

```bash
mkdir my-python-api && cd my-python-api
ugahost login
ugahost init
# Choose: python (no port needed — Workers don't bind a port)
ugahost deploy
```

> ⚠️ UGA HOST Python apps run as Cloudflare Workers, not Flask. See [Python Worker Rules](#python-worker-rules) for the required `app.py` structure.
>
> 📄 **Full reference example** — a production-ready auth API with Turso DB, HMAC tokens, rate limiting, CORS, and audit logging: [`examples/python-worker-full/app.py`](./examples/python-worker-full/app.py)

### Set Environment Variables

```bash
ugahost env set NODE_ENV production
ugahost env set DATABASE_URL "postgresql://..." --secret
ugahost env set API_KEY "abc123" --secret
```

### View Logs in Real-Time

```bash
ugahost logs -f
```

### Check Application Status

```bash
ugahost status
```

## Support

For issues and questions:
- **Dashboard**: https://qssnpaas.gss-tec.com
- **Email**: info@gss-tec.com
- **Partnerships**: partnership@gss-tec.com
- **WhatsApp**: +256755274944
- **Website**: https://www.gss-tec.com
- **GitHub**: https://github.com/GSS-creator/UGA-HOST
- **Issues**: https://github.com/GSS-creator/UGA-HOST/issues

## 🏗️ Architecture

### How It Works

```
Developer
    ↓
CLI (ugahost)
    ↓
Management API
    ↓
├─ Bundles Code
├─ Deploys as Cloudflare Worker
├─ Creates Route (subdomain.gss-tec.com)
└─ Provisions Turso Database
    ↓
Your App Live on Cloudflare Edge
```

### Request Flow

```
User visits: https://my-api.gss-tec.com
    ↓
Management API (Router)
    ↓
Routes to Your Worker
    ↓
Your App Responds
```

## 📚 Complete Examples

### Example 1: Node.js Express API

```bash
# Create project
mkdir my-api && cd my-api
npm init -y
npm install express

# Create app (index.js)
cat > index.js << 'EOF'
const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello from UGA HOST!' });
});

app.get('/api/users', (req, res) => {
  res.json({ 
    users: [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' }
    ]
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
EOF

# Deploy
ugahost login
ugahost init  # Choose: nodejs, port 3000
ugahost deploy

# Test
curl https://my-api.gss-tec.com/
```

### Example 2: Python API with Turso Database

> **Important — Python Workers on UGA HOST use the Cloudflare Pyodide runtime, NOT a traditional server.**
> - No `Flask`, no `pip`, no `requirements.txt` needed
> - Use **only Python stdlib** + the `workers` module (provided by the runtime)
> - The worker must define `class Default(WorkerEntrypoint)` with an `async def on_fetch(self, request, env, ctx=None)` method
> - HTTP calls use `pyodide.http.pyfetch()` — NOT `requests` or `urllib`
> - Turso credentials arrive via `os.environ` (injected by UGA HOST at deploy time)

```bash
mkdir my-python-api && cd my-python-api
ugahost login
ugahost init   # Choose: python
```

Create `app.py` — a full auth API backed by Turso SQLite:

```python
# app.py — Cloudflare Python Worker with Turso DB
# UGA HOST injects TURSO_DATABASE_URL + TURSO_AUTH_TOKEN automatically

import json, hmac, time, hashlib, base64, re, os
from urllib.parse import urlparse
from workers import WorkerEntrypoint, Response

SECRET_KEY = os.environ.get("SECRET_KEY", "change-me-in-production-32chars!")
TOKEN_TTL  = 7200

# ── Turso HTTP client ─────────────────────────────────────────────────────────
# MUST use pyodide.http.pyfetch — no requests/urllib in Python Workers
# MUST use positional ? placeholders with args=[] — NOT named :params

class TursoDB:
    def __init__(self, url, token):
        self.base  = url.replace("libsql://", "https://")
        self.token = token

    async def execute(self, sql, args=None):
        stmt = {"sql": sql}
        if args:
            stmt["args"] = [self._val(v) for v in args]
        import pyodide.http
        resp = await pyodide.http.pyfetch(
            f"{self.base}/v2/pipeline",
            method="POST",
            headers={"Authorization": f"Bearer {self.token}",
                     "Content-Type": "application/json"},
            body=json.dumps({"requests": [
                {"type": "execute", "stmt": stmt},
                {"type": "close"}
            ]})
        )
        data = json.loads(await resp.string())
        res  = data["results"][0]
        if res["type"] == "error":
            raise RuntimeError(res["error"]["message"])
        result = res["response"]["result"]
        cols   = [c["name"] for c in result["cols"]]
        return [dict(zip(cols, [self._unwrap(v) for v in row]))
                for row in result["rows"]]

    async def run(self, sql, args=None):
        await self.execute(sql, args)

    def _val(self, v):
        if v is None:            return {"type": "null"}
        if isinstance(v, bool):  return {"type": "integer", "value": str(int(v))}
        if isinstance(v, int):   return {"type": "integer", "value": str(v)}
        if isinstance(v, float): return {"type": "float",   "value": str(v)}
        return {"type": "text", "value": str(v)}

    def _unwrap(self, v):
        if v["type"] == "null":    return None
        if v["type"] == "integer": return int(v["value"])
        if v["type"] == "float":   return float(v["value"])
        return v["value"]

# ── Schema bootstrap (runs on every request, CREATE IF NOT EXISTS is safe) ────

async def _bootstrap(db):
    await db.run(
        "CREATE TABLE IF NOT EXISTS users ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL,"
        "email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,"
        "is_admin INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1,"
        "created_at INTEGER NOT NULL, last_login INTEGER)"
    )
    rows = await db.execute("SELECT id FROM users WHERE username='admin'")
    if not rows:
        import hashlib, base64
        salt = os.urandom(16)
        dk   = hashlib.pbkdf2_hmac("sha256", b"Admin@1234!", salt, 260_000)
        ph   = "pbkdf2:" + base64.urlsafe_b64encode(salt).rstrip(b"=").decode() \
                         + ":" + base64.urlsafe_b64encode(dk).rstrip(b"=").decode()
        await db.run(
            "INSERT INTO users (username,email,password_hash,is_admin,is_active,created_at)"
            " VALUES ('admin','admin@example.com',?,1,1,?)",
            [ph, int(time.time())]
        )

# ── Worker entrypoint ─────────────────────────────────────────────────────────
# MUST be named Default(WorkerEntrypoint) with on_fetch(self, request, env, ctx=None)
# NOT fetch() — Cloudflare Python Workers use on_fetch

class Default(WorkerEntrypoint):
    async def on_fetch(self, request, env, ctx=None):
        turso_url   = os.environ.get("TURSO_DATABASE_URL", "")
        turso_token = os.environ.get("TURSO_AUTH_TOKEN", "")

        if not turso_url or not turso_token:
            return Response(
                json.dumps({"error": "DB not configured — deploy via ugahost"}),
                status=503, headers={"Content-Type": "application/json"}
            )

        db = TursoDB(turso_url, turso_token)
        try:
            await _bootstrap(db)
            return await route(request, db)
        except Exception as e:
            return Response(
                json.dumps({"error": "Internal server error", "detail": str(e)}),
                status=500, headers={"Content-Type": "application/json"}
            )

async def route(request, db):
    path = urlparse(request.url).path.rstrip("/") or "/"
    method = request.method.upper()

    if method == "OPTIONS":
        return Response("", status=204, headers={
            "Access-Control-Allow-Origin":  "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        })

    def json_resp(data, status=200):
        return Response(json.dumps(data), status=status,
                        headers={"Content-Type": "application/json",
                                 "Access-Control-Allow-Origin": "*"})

    if path == "/" and method == "GET":
        return json_resp({"server": "my-python-api", "db": "turso"})

    if path == "/api/status" and method == "GET":
        rows = await db.execute("SELECT COUNT(*) as cnt FROM users")
        return json_resp({"status": "ok", "users": rows[0]["cnt"]})

    if path == "/api/login" and method == "POST":
        body = json.loads(await request.text())
        rows = await db.execute(
            "SELECT id, password_hash, is_admin FROM users WHERE username=?",
            [body.get("username", "")]
        )
        # ... verify password + return token
        return json_resp({"success": bool(rows)})

    return json_resp({"error": "Not found"}, 404)
```

```bash
# Deploy — Turso DB is auto-created, credentials auto-injected
ugahost deploy

# Check tables via CLI
ugahost db tables
# → • users   1 row

# Run a query
ugahost db query "SELECT id, username, is_admin FROM users"

# Test live endpoint
curl https://my-python-api.gss-tec.com/api/status
# → {"status":"ok","users":1}
```

### Example 3: Using the Database (Turso/SQLite)

```bash
# See database info — tables + row counts
ugahost db info

# List tables
ugahost db tables

# Run raw SQL
ugahost db query "SELECT * FROM users"
ugahost db query "SELECT COUNT(*) as total FROM users WHERE is_admin = 1"

# Find rows
ugahost db find users

# Get one row by id
ugahost db get users 1

# Export table to file
ugahost db export users -o backup.json

# Run a SQL migration
ugahost db migrate schema.sql

# Bulk-import from JSON
ugahost db import users seed.json
```

## 🔧 Development

### For Contributors

```bash
# Clone repository
git clone https://github.com/GSS-creator/UGA-HOST.git
cd UGA-HOST/paas/ugahost-cli

# Install dependencies
npm install

# Build
npm run build

# Link globally for testing
npm link

# Verify
ugahost --version
```

### Project Structure

```
ugahost-cli/
├── src/
│   ├── commands/          # All CLI commands
│   │   ├── login.ts
│   │   ├── init.ts
│   │   ├── deploy.ts
│   │   ├── logs.ts
│   │   ├── env.ts
│   │   ├── db.ts
│   │   ├── projects.ts
│   │   ├── start.ts
│   │   ├── stop.ts
│   │   ├── restart.ts
│   │   └── status.ts
│   ├── utils/             # Utilities
│   │   ├── config.ts      # Config management
│   │   └── api.ts         # API client
│   └── index.ts           # Entry point
├── dist/                  # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

## 🔐 Authentication

### How Login Works

1. **Create API Key**: Go to https://qssnpaas.gss-tec.com → UGA HOST → API Keys → Create API Key
2. **Run** `ugahost login`
3. **Enter email and API key** (not password!)
4. CLI validates API key with authentication API
5. Saves credentials to `~/.ugahost/config.json`
6. All subsequent commands use this API key for authentication

### Config File Location

- **Linux/Mac**: `~/.ugahost/config.json`
- **Windows**: `C:\Users\<username>\.ugahost\config.json`

### Config File Format

```json
{
  "email": "your-email@example.com",
  "apiKey": "ugahost_abc123...",
  "userId": "dev_123",
  "apiUrl": "https://qssn-paas-management.gastonsoftwaresolutions234.workers.dev"
}
```

## 📋 API Reference

### Management API

Base URL: `https://qssn-paas-management.gastonsoftwaresolutions234.workers.dev`

All requests require authentication:
```
Authorization: Bearer <your-api-key>
```

#### Endpoints

- `POST /api/backend/projects` - Create project
- `GET /api/backend/projects` - List projects
- `GET /api/backend/projects/:id/status` - Get status
- `POST /api/backend/projects/:id/start` - Start app
- `POST /api/backend/projects/:id/stop` - Stop app
- `POST /api/backend/projects/:id/restart` - Restart app
- `GET /api/backend/projects/:id/logs` - Get logs
- `GET /api/backend/projects/:id/env` - List env vars
- `POST /api/backend/projects/:id/env` - Set env var
- `DELETE /api/backend/projects/:id/env/:key` - Delete env var
- `GET /api/backend/projects/:id/database` - Database info
- `POST /api/backend/projects/:id/database/query` - Execute query

## ❓ FAQ

### Q: Do I need to create an account first?
**A:** Yes, create an account at the [UGA HOST Dashboard](https://qssnpaas.gss-tec.com/) first.

### Q: What languages are supported?
**A:** Node.js and Python (Cloudflare Pyodide Workers — not Flask/Django). See [Python Worker Rules](#python-worker-rules) for details. More languages coming soon.

### Q: Is there a free tier?
**A:** Check the dashboard for current pricing plans.

### Q: Can I use my own domain?
**A:** Custom domains are coming soon. Currently, you get `subdomain.gss-tec.com`.

### Q: How do I update my app?
**A:** Just run `ugahost deploy` again to update.

### Q: Where is my code stored?
**A:** Code is stored in Cloudflare R2 and deployed as Cloudflare Workers.

### Q: What database do I get?
**A:** Each project gets a **Turso (libSQL/SQLite)** database, auto-provisioned on first deploy. Use `ugahost db` commands to manage it, or read credentials from `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` env vars in your app.

### Q: Can I have multiple projects?
**A:** Yes! Free plan allows **2 projects**, each with its own subdomain and Turso database.

### Q: What are the free plan limits?
**A:** 2 apps, Turso free tier database, 10,000 requests/day per account.

## 🐛 Troubleshooting

### CLI Not Found

```bash
# Reinstall
npm uninstall -g ugahost
npm install -g ugahost

# Or link locally
cd ugahost-cli
npm link
```

### Login Fails

- Verify your credentials
- Check internet connection
- Ensure API is accessible

### Deployment Fails

```bash
# Check logs
ugahost logs

# Check status
ugahost status

# Verify configuration
cat ugahost.json
```

**Python-specific deployment failures:**

| Symptom | Cause | Fix |
|---|---|---|
| `{"error":"Database not configured"}` (503) | `TURSO_DATABASE_URL` or `TURSO_AUTH_TOKEN` not set | Redeploy — ugahost provisions the DB on first deploy; env vars are injected automatically |
| `TypeError: on_fetch is not a function` | Class not named `Default` or method misspelled | Rename class to `Default(WorkerEntrypoint)`, method to `on_fetch` |
| `ModuleNotFoundError: No module named 'flask'` | pip packages are not available | Remove all pip imports; use stdlib only + `workers` module |
| `Internal server error` with `RuntimeError` from Turso | SQL syntax error or wrong placeholder type | Use `?` positional placeholders; check arg types match the `_val()` helper pattern |
| Token always returns 401 | `SECRET_KEY` mismatch between deploys | Set a stable `SECRET_KEY` env var: `ugahost env set SECRET_KEY "..."` |
| CORS error in browser | Missing `Access-Control-Allow-Origin` header or missing OPTIONS handler | Add CORS headers to every response and handle `OPTIONS` preflight |
| Rate limit firing immediately | In-memory `_rate_store` cleared between Worker restarts | Expected behaviour — the in-memory store is per-isolate. Use Cloudflare rate limiting rules for persistent limits |

### App Not Accessible

- Wait 30-60 seconds after deployment
- Check if app is running: `ugahost status`
- View logs: `ugahost logs -f`
- For Python workers: visit `https://your-app.gss-tec.com/` — a valid JSON response means the worker is live; a 503 means DB credentials are still being provisioned (redeploy once)

## 🎯 Roadmap

- [x] Node.js support
- [x] Python support
- [x] CLI tool
- [x] Database integration
- [x] Environment variables
- [ ] Custom domains
- [ ] Team collaboration
- [ ] CI/CD integration
- [ ] More languages

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

Built with:
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Turso](https://turso.tech/)
- [Commander.js](https://github.com/tj/commander.js/)
- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js/)

---

**Made with ❤️ by Gaston Software Solutions Tec**

📧 [info@gss-tec.com](mailto:info@gss-tec.com) • 💼 [partnership@gss-tec.com](mailto:partnership@gss-tec.com) • 💬 [WhatsApp: +256755274944](https://wa.me/256755274944)

🌐 [Website](https://www.gss-tec.com) • 💻 [GitHub](https://github.com/GSS-creator) • 🚀 [Dashboard](https://3ce7ca25.qssn-cloud-manager.pages.dev)

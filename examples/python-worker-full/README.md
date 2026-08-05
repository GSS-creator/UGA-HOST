# Example: Full Python Worker with Turso DB

> **Ready-to-deploy reference app** for UGA HOST Python backends.  
> File: `app.py` — copy it to your project root and run `ugahost deploy`.

## What this example covers

| Feature | Implementation |
|---|---|
| Cloudflare Python Worker entrypoint | `class Default(WorkerEntrypoint)` + `async def on_fetch` |
| Turso HTTP client (no pip) | `TursoDB` class using `pyodide.http.pyfetch` + `/v2/pipeline` |
| DB schema bootstrap | `_bootstrap_db()` — `CREATE TABLE IF NOT EXISTS` on every request |
| Audit log table | `audit` table, written on login success/failure and admin denial |
| HMAC-SHA256 Bearer tokens | `_make_token()` / `_verify_token()` — pure stdlib |
| Password hashing | `pbkdf2_hmac` SHA-256, 260 000 iterations, random salt |
| In-memory rate limiting | `_rate_check()` — sliding window per IP |
| Input validation | Regex for username, email, password strength |
| CORS | `OPTIONS` preflight + `Access-Control-Allow-Origin: *` on all responses |
| Client IP | `CF-Connecting-IP` header |

## Endpoints

| Method | Path | Auth | Rate limit |
|---|---|---|---|
| GET | `/` | — | — |
| GET | `/api/status` | — | — |
| POST | `/api/register` | — | 10 / 10 min per IP |
| POST | `/api/login` | — | 10 / min per IP |
| GET | `/api/whoami` | Bearer token | — |
| POST | `/api/echo` | — | 5 / min per IP |
| GET | `/admin/users` | Bearer token (admin) | — |

## Deploy

```bash
# 1. Copy app.py to your project
cp app.py /path/to/my-project/app.py
cd /path/to/my-project

# 2. Init and deploy via ugahost
ugahost login
ugahost init        # choose: python
ugahost deploy

# 3. Set a strong secret key (required before going live)
ugahost env set SECRET_KEY "$(python -c 'import secrets; print(secrets.token_hex(32))')" --secret

# 4. Verify
curl https://your-app.gss-tec.com/api/status
# → {"status":"ok","server":"TwinTest","version":"2.0.0","time":...}
```

## Default admin credentials

On first deploy, a seed admin account is created automatically:

```
username: admin
password: Admin@1234!
```

**Change this immediately in production** by updating the seed in `_bootstrap_db()` or deactivating the account via `ugahost db update`.

## Environment variables

| Variable | Set by | Notes |
|---|---|---|
| `TURSO_DATABASE_URL` | UGA HOST (auto) | libSQL URL, e.g. `libsql://name-org.turso.io` |
| `TURSO_AUTH_TOKEN` | UGA HOST (auto) | Turso auth token |
| `SECRET_KEY` | You (`ugahost env set`) | Min 32 chars — used to sign Bearer tokens |

## Test with curl

```bash
BASE=https://your-app.gss-tec.com

# Health check
curl $BASE/api/status

# Register
curl -X POST $BASE/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"Alice@1234!"}'

# Login — grab the token
TOKEN=$(curl -s -X POST $BASE/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"Alice@1234!"}' | python -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Authenticated endpoint
curl $BASE/api/whoami -H "Authorization: Bearer $TOKEN"

# Admin endpoint (login as admin first)
ADMIN_TOKEN=$(curl -s -X POST $BASE/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@1234!"}' | python -c "import sys,json; print(json.load(sys.stdin)['token'])")

curl $BASE/admin/users -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Inspect the database

```bash
ugahost db tables
# → • users   2 rows
# → • audit   5 rows

ugahost db query "SELECT id, username, is_admin, is_active FROM users"
ugahost db query "SELECT action, ip, ts FROM audit ORDER BY ts DESC LIMIT 10"
```

---

See the main [README](../../README.md#python-worker-rules) for the complete Python Worker rules and constraints.

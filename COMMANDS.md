# UGA HOST CLI — Complete Command Reference

> **Version 1.1.0**  Deploy backend apps to the edge — Like `wrangler` but for UGA HOST

---

## Quick Install

```bash
npm install -g ugahost
ugahost --version
```

---

## All Commands at a Glance

```
ugahost login                              Login with email + API key
ugahost init                               Initialize project in current directory
ugahost deploy                             Deploy / redeploy your app
ugahost projects                           List all your projects
ugahost status                             Show current project status
ugahost start                              Start server
ugahost stop                               Stop server
ugahost restart                            Restart server
ugahost logs                               View last 100 log lines
ugahost logs -f                            Stream logs live
ugahost logs -n 500                        View last 500 lines
ugahost env list                           List environment variables
ugahost env set KEY value                  Set environment variable
ugahost env set KEY value --secret         Set secret environment variable
ugahost env unset KEY                      Remove environment variable
ugahost db info                            DB info — Turso tables or R2 storage
ugahost db tables                          List tables + row counts (Turso projects)
ugahost db collections                     List collections (R2/NoSQL projects)
ugahost db query "<SQL>"                   Run raw SQL (Turso projects)
ugahost db find <table>                    SELECT * (Turso) or find all docs (R2)
ugahost db find <table> '{"key":"val"}'    Find with filter / WHERE clause
ugahost db find <table> --json             Raw JSON output
ugahost db get <table> <id>               Get row/doc by id
ugahost db insert <table> '<json>'         INSERT row / insert document
ugahost db update <table> '<where>' '<set>' UPDATE rows / update documents
ugahost db delete <table> '<where>'        DELETE rows / delete documents
ugahost db count <table>                   COUNT rows / documents
ugahost db count <table> '<where>'         COUNT with filter
ugahost db drop <table>                    DROP TABLE / drop collection
ugahost db migrate <file.sql|file.json>    Run SQL file or JSON migration
ugahost db export <table>                  Export to JSON file
ugahost db export <table> -o <file>        Export to specific file
ugahost db import <table> <file.json>      Bulk-insert JSON array
```

---

## 1. Authentication

### `ugahost login`
Login with your email and UGA HOST API key.

```bash
ugahost login
```

**Steps:**
1. Go to https://qssnpaas.gss-tec.com
2. Navigate to **UGA HOST  API Keys  Create API Key**
3. Copy the key (starts with `ugahost_`)
4. Run `ugahost login`, enter email + API key

Config saved to: `~/.ugahost/config.json`

---

## 2. Project Management

### `ugahost init`
Initialize a new project. Creates `ugahost.json` in current directory.

```bash
ugahost init
```

Prompts for: name, subdomain, language (nodejs/python), port.

### `ugahost projects`
List all your deployed projects.

```bash
ugahost projects
```

### `ugahost status`
Show status of the current project.

```bash
ugahost status
```

---

## 3. Deployment

### `ugahost deploy`
Deploy or redeploy your application.

```bash
ugahost deploy
```

- **First run**: creates project, saves `projectId` to `ugahost.json`
- **Next runs**: detects `projectId` and redeploys (updates) existing project

**Output:**
```
 Redeployment successful!

  Deployment Summary
  
  Project:  my-api
  ID:       backend_ee464351-...
  Version:  vM4X2.A1B3
  URL:      https://myapi.gss-tec.com
  Status:    Running
  
```

---

## 4. Server Control

### `ugahost start`
Start a stopped server.

```bash
ugahost start
```

### `ugahost stop`
Stop a running server.

```bash
ugahost stop
```

### `ugahost restart`
Restart the server.

```bash
ugahost restart
```

---

## 5. Logs

### `ugahost logs`
View application logs.

```bash
ugahost logs              # View last 100 lines
ugahost logs -f           # Stream logs live (follow mode)
ugahost logs -n 500       # View last 500 lines
```

| Option | Description |
|--------|-------------|
| `-f, --follow` | Stream logs continuously |
| `-n, --lines <n>` | Number of lines (default: 100) |

---

## 6. Environment Variables

### `ugahost env list`
List all environment variables.

```bash
ugahost env list
```

### `ugahost env set`
Set an environment variable.

```bash
ugahost env set NODE_ENV production
ugahost env set DATABASE_URL "postgresql://user:pass@host/db"
ugahost env set API_SECRET "abc123" --secret
```

| Option | Description |
|--------|-------------|
| `-s, --secret` | Mark as secret (hidden in dashboard) |

### `ugahost env unset`
Remove an environment variable.

```bash
ugahost env unset API_SECRET
```

---

## 7. Database

UGA HOST auto-detects your project's database type:

| Project type | DB engine | Commands use |
|---|---|---|
| Python / Node.js with Turso | **Turso (libSQL / SQLite)** | SQL-based: `tables`, `query`, `find`, `insert` … |
| Node.js (legacy R2) | **R2 JSON Store** | NoSQL-based: `collections`, `find`, `insert` … |

---

### `ugahost db info`
Show database type, tables/collections, and storage.

```bash
ugahost db info
```

**Turso output:**
```
🗄️  Database Info

  Type:    Turso (libSQL / SQLite)
  URL:     libsql://myapp-org.turso.io
  Tables:  3

    • users                    6 rows
    • audit                    2 rows
    • example                  0 rows
```

**R2 output:**
```
🗄️  Database Info

  Type:        R2 JSON Store
  Collections: 3
  Storage:     0.12 MB / 200 MB
  Usage:       [█░░░░░░░░░░░░░░░░░░░] 0%
```

---

### `ugahost db tables` *(Turso projects)*
List all SQLite tables with row counts.

```bash
ugahost db tables
```

```
📋 Tables (3)

  • users                        6 rows
  • audit                        2 rows
  • example                      0 rows
```

---

### `ugahost db collections` *(R2 projects)*
List all NoSQL collections.

```bash
ugahost db collections
```

---

### `ugahost db query "<SQL>"` *(Turso projects)*
Run any raw SQL statement — SELECT, INSERT, UPDATE, DELETE, CREATE TABLE, etc.

```bash
ugahost db query "SELECT * FROM users"
ugahost db query "SELECT id, username, is_admin FROM users WHERE is_admin = 1"
ugahost db query "CREATE TABLE logs (id INTEGER PRIMARY KEY, msg TEXT, ts INTEGER)"
ugahost db query "DROP TABLE example"
```

```
  2 row(s)

  id  username  is_admin
  ──────────────────────
  1   admin     1
```

---

### `ugahost db find <table> [filter]`
SELECT all rows (Turso) or find documents (R2).

```bash
# Turso — filter is a JSON object that becomes WHERE col = ?
ugahost db find users
ugahost db find users '{"is_admin":1}'
ugahost db find users --json

# R2
ugahost db find users '{"role":"admin"}'
```

| Option | Description |
|--------|-------------|
| `--json` | Output raw JSON instead of table |

---

### `ugahost db get <table> <id>`
Get one row/document by `id` (Turso) or `_id` (R2).

```bash
ugahost db get users 1
ugahost db get users usr_abc123def456
```

---

### `ugahost db insert <table> '<json>'`
Insert a row (Turso) or document (R2).

```bash
# Turso — JSON keys map directly to column names
ugahost db insert users '{"username":"alice","email":"alice@x.com","is_admin":0,"is_active":1,"created_at":1700000000,"password_hash":"pbkdf2:x:y"}'

# R2
ugahost db insert users '{"name":"John","email":"john@x.com","role":"user"}'
```

**Turso output:**
```
✅ Row inserted
   1 row(s) affected
```

> **Windows tip:** Use `cmd /c` to avoid PowerShell stripping braces:
> ```
> cmd /c "ugahost db insert users `"{`"username`":`"alice`",`"is_admin`":0}`""
> ```

---

### `ugahost db update <table> '<where>' '<set>'`
UPDATE rows / update documents.

```bash
# Turso — first JSON = WHERE clause, second JSON = SET clause
ugahost db update users '{"id":3}' '{"is_active":0}'

# R2
ugahost db update users '{"email":"j@x.com"}' '{"name":"Jane"}'
```

---

### `ugahost db delete <table> '<where>'`
DELETE rows / delete documents.

```bash
ugahost db delete users '{"id":3}'
ugahost db delete sessions '{"expired":true}'
```

---

### `ugahost db count <table> [filter]`
Count rows/documents, optionally filtered.

```bash
ugahost db count users
ugahost db count users '{"is_admin":1}'
```

```
  users: 6 row(s)
```

---

### `ugahost db drop <table>`
DROP TABLE (Turso) or drop collection (R2). Asks for confirmation.

```bash
ugahost db drop example
```

```
⚠️  This will permanently delete "example" and ALL its data.
  Type "example" to confirm: example
✅ Table "example" dropped
```

---

### `ugahost db migrate <file>`
Run a migration. Two formats supported:

**SQL file (Turso):**
```bash
ugahost db migrate schema.sql
ugahost db migrate migrations/001_init.sql
```
Each `;`-separated statement runs in order.

**JSON file (both):**
```bash
ugahost db migrate migrations/001_seed.json
```

```
🔄 Running migration: schema.sql
   3 statement(s)

  ✅ [1/3] CREATE TABLE users (…
  ✅ [2/3] CREATE TABLE audit (…
  ✅ [3/3] INSERT INTO users (…

✅ Migration complete: 3/3 succeeded
```

---

### `ugahost db export <table>`
Export all rows to a JSON file.

```bash
ugahost db export users
ugahost db export users -o backup/users-2026-08-05.json
```

| Option | Description |
|--------|-------------|
| `-o, --output <file>` | Output file path (default: `<table>-export-<ts>.json`) |

```
✅ Exported 6 row(s) → users-export-1785888970830.json
```

---

### `ugahost db import <table> <file.json>`
Bulk-insert a JSON array into a table/collection.

```bash
ugahost db import users seed.json
ugahost db import products products.json
```

```
📥 Importing 2 row(s) into "users"...

  ✅ [1/2] Inserted
  ✅ [2/2] Inserted

✅ Import complete: 2 row(s) inserted
```

> The auto-increment `id` field is stripped automatically; all other fields are preserved.

---

## 8. Migration File Formats

### SQL file (`schema.sql`) — Turso projects
```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  ip TEXT,
  ts INTEGER NOT NULL
);
```

### JSON file (`migrations/001_seed.json`) — R2 projects
```json
{
  "version": "001",
  "description": "Seed initial data",
  "operations": [
    { "op": "insert", "collection": "settings", "doc": { "key": "theme", "value": "dark" } },
    { "op": "update", "collection": "users", "query": { "role": "superadmin" }, "updates": { "role": "admin" } },
    { "op": "delete", "collection": "sessions", "query": { "expired": true } },
    { "op": "drop",   "collection": "old_logs" }
  ]
}
```

### JSON file with SQL (`migrations/001_turso.json`) — Turso projects
```json
{
  "version": "001",
  "description": "Create tables",
  "operations": [
    { "sql": "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL)" },
    { "sql": "INSERT INTO users (username) VALUES ('admin')" }
  ]
}
```

| `op` | Required fields | Description |
|------|----------------|-------------|
| `insert` | `collection`, `doc` | Insert a document (R2) |
| `update` | `collection`, `query`, `updates` | Update matching documents (R2) |
| `delete` | `collection`, `query` | Delete matching documents (R2) |
| `drop` | `collection` | Drop entire collection (R2) |
| `sql` | `sql` | Run a SQL statement (Turso) |

---

## 9. Configuration File (ugahost.json)

Created by `ugahost init`. Saved in your project root.

```json
{
  "name": "my-api",
  "subdomain": "myapi",
  "language": "nodejs",
  "port": 3000,
  "projectId": "backend_ee464351-e6e2-461a-94f2-fe2386ea2f9b"
}
```

| Field | Description |
|-------|-------------|
| `name` | Display name of your project |
| `subdomain` | Your app URL: `subdomain.gss-tec.com` |
| `language` | `nodejs` or `python` |
| `port` | Port your app listens on |
| `projectId` | Auto-saved after first deploy (do not edit) |

---

## 10. Auth Config (~/.ugahost/config.json)

```json
{
  "email": "you@example.com",
  "apiKey": "ugahost_abc123...",
  "userId": "dev_123",
  "apiUrl": "https://qssn-paas-management.gastonsoftwaresolutions234.workers.dev"
}
```

---

## 11. Free Plan Limits

| Resource | Limit |
|----------|-------|
| Apps | 2 maximum |
| Storage | 200 MB (R2) |
| Requests | 10,000 per day |
| Languages | Node.js, Python |
| Subdomain | yourapp.gss-tec.com |

---

## 12. Support

| Channel | Link |
|---------|------|
| Dashboard | https://qssnpaas.gss-tec.com |
| Email | info@gss-tec.com |
| WhatsApp | +256755274944 |
| Website | https://www.gss-tec.com |
| GitHub | https://github.com/GSS-creator/UGA-HOST |
| npm | https://www.npmjs.com/package/ugahost |

---

*Made with love by Gaston Software Solutions Tec  Uganda*

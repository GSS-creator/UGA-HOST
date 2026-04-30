# UGA HOST CLI  Complete Command Reference

> **Version 1.0.5**  Deploy backend apps to the edge  Like `wrangler` but for UGA HOST

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
ugahost db info                            DB info + storage usage
ugahost db collections                     List all collections
ugahost db find <col>                      Find all documents
ugahost db find <col> '{"key":"val"}'      Find with filter
ugahost db find <col> --json               Find (raw JSON output)
ugahost db get <col> <id>                  Get one document by _id
ugahost db insert <col> '<json>'           Insert a document
ugahost db update <col> '<query>' '<upd>'  Update matching documents
ugahost db delete <col> '<query>'          Delete matching documents
ugahost db count <col>                     Count all documents
ugahost db count <col> '<query>'           Count with filter
ugahost db drop <col>                      Drop entire collection
ugahost db migrate <file.json>             Run migration file
ugahost db export <col>                    Export collection to JSON file
ugahost db export <col> -o <file>          Export to specific file
ugahost db import <col> <file.json>        Import JSON file into collection
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

Your project's R2-backed JSON document store.
Each project gets up to **200 MB** of storage.
Think of it like MongoDB  collections of JSON documents.

### `ugahost db info`
Show database info, storage usage, and collections.

```bash
ugahost db info
```

**Output:**
```
  Database Info

  Type:        R2 JSON Store
  Collections: 3
  Storage:     0.12 MB / 200 MB
  Usage:       [] 0%

  Collections:
     users
     sessions
     settings
```

### `ugahost db collections`
List all collections.

```bash
ugahost db collections
```

### `ugahost db find`
Find documents in a collection.

```bash
ugahost db find users
ugahost db find users '{"role":"admin"}'
ugahost db find users '{"active":true}'
ugahost db find users --json
```

| Option | Description |
|--------|-------------|
| `--json` | Output raw JSON instead of table |

### `ugahost db get`
Get one document by `_id`.

```bash
ugahost db get users usr_abc123def456
```

### `ugahost db insert`
Insert a new document.

```bash
ugahost db insert users '{"name":"John Doe","email":"john@example.com","role":"user"}'
ugahost db insert settings '{"key":"theme","value":"dark"}'
```

**Output:**
```
 Document inserted
  _id:       users_m4x2_a1b3
  createdAt: 2026-04-30T05:00:00.000Z
```

### `ugahost db update`
Update documents matching a query.

```bash
ugahost db update users '{"email":"john@example.com"}' '{"name":"Jane Doe"}'
ugahost db update users '{"_id":"usr_abc123"}' '{"role":"admin"}'
ugahost db update settings '{"key":"theme"}' '{"value":"light"}'
```

**Output:**
```
 1 document(s) updated
```

### `ugahost db delete`
Delete documents matching a query.

```bash
ugahost db delete users '{"email":"john@example.com"}'
ugahost db delete users '{"_id":"usr_abc123"}'
ugahost db delete sessions '{"expired":true}'
```

**Output:**
```
 1 document(s) deleted
```

### `ugahost db count`
Count documents in a collection.

```bash
ugahost db count users
ugahost db count users '{"role":"admin"}'
```

**Output:**
```
  users: 42 document(s)
```

### `ugahost db drop`
Drop an entire collection. Asks for confirmation.

```bash
ugahost db drop sessions
```

```
  This will permanently delete ALL documents in "sessions".
  Type "sessions" to confirm: sessions
 Collection "sessions" dropped
```

### `ugahost db migrate`
Run a migration JSON file. Like `wrangler d1 execute`.

```bash
ugahost db migrate migrations/001_seed.json
ugahost db migrate migrations/002_add_roles.json
```

**Output:**
```
 Running migration: Seed initial data
   Version: 001  3 operation(s)

   [1/3] insert  users
   [2/3] insert  settings
   [3/3] insert  roles

 Migration complete: 3/3 operations succeeded
```

### `ugahost db export`
Export a collection to a JSON file.

```bash
ugahost db export users
ugahost db export users -o backup/users-2026-04-30.json
```

| Option | Description |
|--------|-------------|
| `-o, --output <file>` | Output file path |

**Output:**
```
 Exported 42 document(s) to: users-export-1746000000000.json
```

### `ugahost db import`
Import a JSON file into a collection.

```bash
ugahost db import users backup/users-2026-04-30.json
ugahost db import products products.json
```

**Output:**
```
 Importing 42 document(s) into "users"...

   [1/42] Inserted
   [2/42] Inserted

 Import complete: 42 document(s) inserted
```

---

## 8. Migration File Format

**File: `migrations/001_seed.json`**

```json
{
  "version": "001",
  "description": "Seed initial data",
  "operations": [
    { "op": "insert", "collection": "settings", "doc": { "key": "theme", "value": "dark" } },
    { "op": "insert", "collection": "roles", "doc": { "name": "admin", "level": 10 } },
    { "op": "update", "collection": "users", "query": { "role": "superadmin" }, "updates": { "role": "admin" } },
    { "op": "delete", "collection": "sessions", "query": { "expired": true } },
    { "op": "drop",   "collection": "old_logs" }
  ]
}
```

| `op` | Required fields | Description |
|------|----------------|-------------|
| `insert` | `collection`, `doc` | Insert a document |
| `update` | `collection`, `query`, `updates` | Update matching documents |
| `delete` | `collection`, `query` | Delete matching documents |
| `drop` | `collection` | Drop entire collection |

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

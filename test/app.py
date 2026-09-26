from flask import Flask, jsonify, request
import os
import json
import urllib.request
import urllib.error

app = Flask(__name__)

# ── Turso (libSQL) DB helper ──────────────────────────────────────────────────
# The platform injects these two env vars automatically at runtime:
#   DATABASE_URL        e.g. libsql://your-db.turso.io
#   DATABASE_AUTH_TOKEN e.g. eyJ...
#
# Turso exposes a standard HTTP API at the same host:
#   POST https://<db-host>/v2/pipeline
#
DATABASE_URL   = os.environ.get('TURSO_DATABASE_URL', '')
DATABASE_TOKEN = os.environ.get('TURSO_AUTH_TOKEN', '')


def turso_host() -> str:
    """Convert libsql:// URL to https:// for the HTTP API."""
    url = DATABASE_URL.strip()
    if url.startswith('libsql://'):
        url = 'https://' + url[len('libsql://'):]
    return url.rstrip('/')


def turso_query(sql: str, args: list = None):
    """Execute a SQL statement via Turso HTTP pipeline API."""
    host    = turso_host()
    payload = {
        "requests": [
            {
                "type": "execute",
                "stmt": {
                    "sql": sql,
                    "args": [{"type": "text", "value": str(a)} for a in (args or [])]
                }
            },
            {"type": "close"}
        ]
    }
    data = json.dumps(payload).encode('utf-8')
    req  = urllib.request.Request(
        f"{host}/v2/pipeline",
        data=data,
        method='POST',
        headers={
            'Authorization': f'Bearer {DATABASE_TOKEN}',
            'Content-Type':  'application/json',
        }
    )
    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Turso error {e.code}: {e.read().decode('utf-8')}")

    # Check for SQL-level errors
    res0 = result.get('results', [{}])[0]
    if res0.get('type') == 'error':
        raise RuntimeError(f"SQL error: {res0['error']['message']}")

    # Parse rows into dicts
    response = res0.get('response', {})
    result_set = response.get('result', {})
    cols = [c['name'] for c in result_set.get('cols', [])]
    rows = []
    for row in result_set.get('rows', []):
        rows.append({cols[i]: (cell.get('value') if cell.get('type') != 'null' else None)
                     for i, cell in enumerate(row)})
    return rows


def init_db():
    """Create the items table if it doesn't exist."""
    if not DATABASE_URL or not DATABASE_TOKEN:
        print("⚠️  Skipping init_db — TURSO_DATABASE_URL not set")
        return
    try:
        turso_query('''
            CREATE TABLE IF NOT EXISTS items (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                name       TEXT    NOT NULL,
                value      TEXT    DEFAULT '',
                created_at TEXT    DEFAULT (datetime('now'))
            )
        ''')
        print("✅ Database ready (Turso)")
    except Exception as e:
        print(f"⚠️  init_db failed: {e} — continuing anyway")


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "message": "UGA HOST test server is running",
        "database": "Turso (libSQL / SQLite)",
        "endpoints": {
            "GET  /api/status":         "health check",
            "GET  /api/items":          "list all items",
            "POST /api/items":          "create  { name, value }",
            "GET  /api/items/<id>":     "get one item",
            "PUT  /api/items/<id>":     "update  { name?, value? }",
            "DELETE /api/items/<id>":   "delete item"
        }
    })


@app.route('/api/status', methods=['GET'])
def status():
    db_ok  = bool(DATABASE_URL and DATABASE_TOKEN)
    detail = "connected" if db_ok else "missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN"
    try:
        if db_ok:
            turso_query("SELECT 1")
    except Exception as e:
        detail = str(e)
    return jsonify({
        "status":   "ok",
        "database": detail,
        "version":  "1.0.0",
        "port":     os.environ.get('PORT', 3000)
    })


# ── CRUD: Items ───────────────────────────────────────────────────────────────

@app.route('/api/items', methods=['GET'])
def list_items():
    rows = turso_query("SELECT * FROM items ORDER BY id DESC")
    return jsonify(rows)


@app.route('/api/items', methods=['POST'])
def create_item():
    data  = request.get_json(silent=True) or {}
    name  = data.get('name')
    value = data.get('value', '')

    if not name:
        return jsonify({"error": "name is required"}), 400

    turso_query("INSERT INTO items (name, value) VALUES (?, ?)", [name, value])
    rows = turso_query("SELECT * FROM items ORDER BY id DESC LIMIT 1")
    return jsonify(rows[0] if rows else {}), 201


@app.route('/api/items/<int:item_id>', methods=['GET'])
def get_item(item_id):
    rows = turso_query("SELECT * FROM items WHERE id = ? LIMIT 1", [item_id])
    if not rows:
        return jsonify({"error": "not found"}), 404
    return jsonify(rows[0])


@app.route('/api/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    rows = turso_query("SELECT * FROM items WHERE id = ? LIMIT 1", [item_id])
    if not rows:
        return jsonify({"error": "not found"}), 404

    data  = request.get_json(silent=True) or {}
    name  = data.get('name',  rows[0]['name'])
    value = data.get('value', rows[0]['value'])

    turso_query("UPDATE items SET name = ?, value = ? WHERE id = ?", [name, value, item_id])
    updated = turso_query("SELECT * FROM items WHERE id = ? LIMIT 1", [item_id])
    return jsonify(updated[0])


@app.route('/api/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    rows = turso_query("SELECT * FROM items WHERE id = ? LIMIT 1", [item_id])
    if not rows:
        return jsonify({"error": "not found"}), 404
    turso_query("DELETE FROM items WHERE id = ?", [item_id])
    return jsonify({"deleted": item_id})


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    if not DATABASE_URL or not DATABASE_TOKEN:
        print("⚠️  TURSO_DATABASE_URL or TURSO_AUTH_TOKEN not set")
        print("   The platform injects these automatically at runtime")
    else:
        init_db()
    print(f"🚀 Starting UGA HOST test server on port {port}")
    print(f"📡 Health: http://localhost:{port}/api/status")
    print(f"🗄️  DB:     Turso  {DATABASE_URL or '(not set)'}")
    app.run(host='0.0.0.0', port=port, debug=False)

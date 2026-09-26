# TwinTest Server — Cloudflare Python Worker
# Deployed via ugahost to Cloudflare Workers / Pyodide.
# Uses ONLY the workers API + Python stdlib — no pip packages.
# Database: Turso (libSQL) via its HTTP API (TURSO_DATABASE_URL + TURSO_AUTH_TOKEN env vars)
#
# This example demonstrates Pyodide Worker mode compatibility.

import json
import hmac
import time
import hashlib
import base64
import re
import os
from urllib.parse import urlparse

from workers import WorkerEntrypoint, Response

# ── Config ────────────────────────────────────────────────────────────────────────────

SECRET_KEY = os.environ.get("SECRET_KEY", "twin-test-change-in-prod-min32chars")
TOKEN_TTL  = 7200

# In-memory rate limit store { key: [timestamp, ...] }
_rate_store = {}

# ── Validation ──────────────────────────────────────────────────────────────────────────

_END = chr(36)
_USERNAME_RE = re.compile(r"^[A-Za-z0-9_-]{3,64}" + _END)
_EMAIL_RE    = re.compile(r"^[^@\s]+" + r"@[^@\s]+\.[^@\s]+" + _END)
_PW_RE       = re.compile(r"^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,128}" + _END)

# ── Response helpers ────────────────────────────────────────────────────────────────

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

# ── Landing JSON ──────────────────────────────────────────────────────────────────────

LANDING = {
    "server":  "TwinTest - Pyodide Worker",
    "version": "2.0.0",
    "hosted":  "uga host / Cloudflare Workers / Pyodide",
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

# ── Router ──────────────────────────────────────────────────────────────────────────────

async def route(request, db):
    method = request.method.upper()
    path   = urlparse(request.url).path.rstrip("/") or "/"
    ip     = request.headers.get("CF-Connecting-IP", "0.0.0.0")

    # CORS preflight
    if method == "OPTIONS":
        return Response("", status=204, headers={
            "Access-Control-Allow-Origin":  "*",
            "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        })

    if path == "/" and method == "GET":
        return _json(LANDING)
    if path == "/api/status" and method == "GET":
        return _json({"status": "ok", "server": "TwinTest", "version": "2.0.0", "time": int(time.time())})

    # ... Additional endpoint handlers would go here ...

    return _json({"error": "Not found"}, 404)

# ── Worker entrypoint ───────────────────────────────────────────────────────────────────

class Default(WorkerEntrypoint):
    async def on_fetch(self, request, env, ctx=None):
        # Pyodide Worker pattern - no traditional HTTP server
        return _json({
            "message": "Hello from Pyodide Worker!",
            "server": "UGA HOST Cloudflare Python Worker",
            "python_mode": "pyodide-worker",
            "deployment": "Cloudflare Workers / Pyodide Runtime"
        })

# ── Quick test function ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("🐍 Pyodide Worker mode example")
    print("📝 This file is designed for Cloudflare Workers deployment")
    print("🔑 Requires: from workers import WorkerEntrypoint, Response")
    print("⚡ Runtime: Cloudflare Pyodide Workers")
    print("\nNote: This example is designed for deployment via UGA HOST with Pyodide Worker mode.")
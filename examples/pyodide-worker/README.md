# Example: Cloudflare Pyodide Worker (UGA HOST Pyodide Worker Mode)

> **Deploy Python apps as Cloudflare Workers** using Pyodide runtime.
> 
> Features: Cloudflare Workers, Pyodide runtime, serverless edge deployment | No pip, stdlib only | Stateless edge functions

## What This Example Covers

| Feature | Implementation |
|---|---|
| **Runtime** | Cloudflare Workers with Pyodide |
| **Server Type** | Serverless edge functions (`async def on_fetch`) |
| **Deployment** | Cloudflare Workers globally distributed |
| **Framework Support** | `workers` API, `pyodide.http` only |
| **Packages** | Python stdlib only (no pip) |

## 🚀 Quick Start

```bash
# 1. Copy this app.py to your project
mkdir my-worker-api
cp examples/pyodide-worker/app.py my-worker-api/app.py
cd my-worker-api

# 2. Initialize project (Pyodide Worker mode)
ugahost init --mode pyodide-worker

# 3. Deploy
ugahost deploy

# 4. Test
curl https://your-app.gss-tec.com/
```

## 📋 File Contents

```python
app.py
├── from workers import WorkerEntrypoint, Response      # Workers API
├── import pyodide.http                               # HTTP client
├── from urllib.parse import urlparse                  # URL parsing
├── class Default(WorkerEntrypoint):                  # Cloudflare Worker entrypoint
├── async def on_fetch(self, request, env, ctx=None):  # Edge function
└── return Response(...)                             # HTTP response
```

## ✅ Mode Details

**Python Mode:** `pyodide-worker`

**What you get:**
- ✅ Cloudflare Workers edge deployment
- ✅ Pyodide runtime (Python in browser-compatible form)
- ✅ Serverless, stateless functions
- ✅ No pip packages, stdlib only
- ✅ Global CDN distribution
- ✅ Zero cold starts

**What you need:**
- Workers API pattern (`class Default(WorkerEntrypoint)`) with `async def on_fetch()`
- `pyodide.http.pyfetch()` for HTTP calls
- No traditional `app.run()` or frameworks

## 🔧 When to Use This Mode

**Use Pyodide Worker mode when:**
- ✅ You need Cloudflare Workers edge deployment
- ✅ You want global CDN distribution
- ✅ You need serverless, stateless functions
- ✅ You want zero cold starts
- ✅ You need the Pyodide runtime
- ✅ You prefer Cloudflare's edge infrastructure

**Avoid Pyodide Worker mode when:**
- ❌ You need traditional Python web frameworks
- ❌ You want Flask, FastAPI, or similar
- ❌ You need pip packages
- ❌ You want blocking server patterns

## 🛠️ Development Workflow

```bash
# Create project
mkdir my-worker-api
cd my-worker-api
# Copy this app.py or create your own

# Initialize (explicit pyodide-worker mode)
ugahost init --mode pyodide-worker

# Deploy
ugahide deploy

# Test
 curl https://your-app.gss-tec.com/
 curl https://your-app.gss-tec.com/api/status

# Check status
ugahost status

# View logs
ugahost logs -f
```

## 🔍 Validation Requirements

The validation checks for:
- ✅ Workers API: `from workers import WorkerEntrypoint, Response`
- ✅ Class: `class Default(WorkerEntrypoint):`
- ✅ Method: `async def on_fetch(self, request, env, ctx=None):`
- ✅ HTTP: `import pyodide.http` (for external API calls)
- ❌ No traditional servers: No `app.run()`, `Flask()`, etc.
- ❌ No pip imports: Only Python stdlib allowed

## 📊 Example Comparison

| Feature | Standard Mode | Pyodide Worker Mode |
|---------|---------------|---------------------|
| **Framework** | Flask, FastAPI, etc. | Cloudflare Workers API |
| **Server** | Traditional HTTP | Edge Workers runtime |
| **Packages** | Pip allowed | Pyodide stdlib only |
| **Deployment** | Standard container | Cloudflare Workers |
| **Entry Point** | `app.run()` | `class Default(WorkerEntrypoint)` |
| **Use Case** | Traditional web apps | Serverless edge functions |

## 💡 Quick Tips

1. **Use Pyodide Worker for edge APIs** - Perfect for global, low-latency APIs
2. **Leverage Cloudflare Workers** - CDN, security, global distribution
3. **Use `pyodide.http.pyfetch()`** - For HTTP calls within the worker
4. **Remember env vars** - `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` auto-injected
5. **Stateless design** - Each request is independent

## 🔧 Troubleshooting

### Common Issues

**Issue:** "Cloudflare Worker/Pyodide APIs found in Standard mode"
**Fix:** This error occurs when you have Workers API code but selected Standard mode. Either:
- Change mode to Pyodide Worker: `ugahost init --mode pyodide-worker`
- Remove Workers API code from your app.py

**Issue:** "Standard mode requires: Flask, FastAPI, Uvicorn, or standard HTTP server"
**Fix:** You have Pyodide Worker code but selected Standard mode. Switch to Pyodide Worker mode.

**Issue:** "No Cloudflare Worker/Pyodide APIs found in Pyodide Worker mode"
**Fix:** Your app.py is missing Workers API code. Add:
```python
from workers import WorkerEntrypoint, Response

class Default(WorkerEntrypoint):
    async def on_fetch(self, request, env, ctx=None):
        return Response("Hello from worker!", status=200)
```

### Validation Error Messages

- ✅ **Valid (Pyodide Worker):** `from workers import WorkerEntrypoint, Response`
- ✅ **Valid (Pyodide Worker):** `class Default(WorkerEntrypoint):`
- ✅ **Valid (Pyodide Worker):** `async def on_fetch(self, request, env, ctx=None):`
- ❌ **Invalid (Pyodide Worker):** No Workers API imports
- ❌ **Invalid (Pyodide Worker):** Missing `class Default(WorkerEntrypoint)`
- ❌ **Invalid (Pyodide Worker):** Missing `async def on_fetch` method
- ❌ **Invalid (Pyodide Worker):** Has `app.run()` or Flask code

## 🚀 Deployment Commands

```bash
# Pyodide Worker deployment (Cloudflare Workers)
ugahost init --mode pyodide-worker
ugahost deploy

# After deployment
ugahost status                   # Check deployment
ugahost logs -f                 # View real-time logs
ugahost env set SECRET_KEY "key"   # Add secrets
```

## 📊 Features Comparison

| Capability | Standard Mode | Pyodide Worker Mode |
|------------|---------------|---------------------|
| **Global Distribution** | Limited | ✅ Cloudflare CDN |
| **Zero Cold Starts** | ❌ Requires warmup | ✅ Built-in |
| **Stateless** | ⚠️ State in memory | ✅ Serverless |
| **Framework Support** | ✅ Flask, FastAPI, etc. | ❌ Workers API only |
| **Package Management** | ✅ Pip packages | ❌ Python stdlib only |
| **Edge Computing** | ❌ Application server | ✅ Serverless functions |
| **Performance** | Good for traditional apps | Excellent for global APIs |

## 🔄 Mode Switching

### Switch from Standard to Pyodide Worker
```bash
# Change mode in existing project
# Update ugahost.json and re-deploy
ugahost deploy  # This will detect mode change and re-deploy appropriately
```

### Switch from Pyodide Worker to Standard
```bash
# Similar process - re-deploy with updated configuration
ugahost deploy
```

## 💡 When to Use Each Mode

### Standard Mode (Flask/FastAPI)
**Best for:**
- Web applications with complex state
- Traditional REST APIs with database connections
- Applications using pip packages
- Developers familiar with Flask/FastAPI
- Applications requiring blocking I/O

**Examples:**
- E-commerce platforms
- Content management systems
- Real-time dashboards
- Database-backed applications

### Pyodide Worker Mode (Cloudflare Workers)
**Best for:**
- Simple API endpoints
- Global, low-latency services
- Serverless, stateless functions
- Edge-compute scenarios
- Greenfield development

**Examples:**
- Authentication APIs
- Image processing workers
- Rate limiting services
- Simple CRUD APIs

## 📞 Support

- **Dashboard**: https://qssnpaas.gss-tec.com
- **Email**: info@gss-tec.com
- **Examples**: See also `examples/standard-flask/` for Standard mode

---

**Ready to deploy!** This example demonstrates UGA HOST's Pyodide Worker mode for Cloudflare Workers.

**See also:** `examples/standard-flask/README.md` for Standard mode

**Made with ❤️ by Gaston Software Solutions Tec Uganda**

> **Pro Tip:** Start with Standard mode (Flask/FastAPI) for most applications. Use Pyodide Worker mode only when you need Cloudflare Workers edge deployment.

> **Memory Note:** Pyodide Worker mode is stateless - no in-memory state between requests.
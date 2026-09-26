# Example: Standard Flask Server (UGA HOST Standard Mode)

> **Deploy traditional Python web servers** with UGA HOST's Standard mode.
> 
> Features: Flask, FastAPI, Uvicorn, HTTPServer support | Port-based HTTP servers | Traditional deployment patterns

## What This Example Covers

| Feature | Implementation |
|---|---|
| **Framework** | Flask (Standard HTTP Server) |
| **Server Type** | Traditional blocking server (`app.run()`) |
| **Deployment** | Standard Python container |
| **Framework Support** | Flask, FastAPI, Uvicorn, Starlette, Django, etc. |
| **Pip Packages** | Allowed (context-dependent) |

## 🚀 Quick Start

```bash
# 1. Copy this app.py to your project
mkdir my-api
cp examples/standard-flask/app.py my-api/app.py
cd my-api

# 2. Initialize project (default mode = standard)
ugahost init
# Choose: python, standard mode (default)

# 3. Deploy
ugahost deploy

# 4. Test
curl https://your-app.gss-tec.com/api/status
```

## 📋 File Contents

```python
app.py
├── from flask import Flask, jsonify, request        # Standard framework
├── import os                                     # Environment variables
├── app = Flask(__name__)                         # Flask app instance
├── @app.route('/')  # Standard route decorators
├── @app.route('/api/status')  # Health check endpoint
├── @app.route('/api/data', methods=['POST'])     # POST endpoint
├── if __name__ == '__main__':                   # Traditional server startup
└── app.run(host='0.0.0.0', port=port)          # app.run() pattern
```

## ✅ Mode Details

**Python Mode:** `standard`

**What you get:**
- ✅ Traditional Python web server framework
- ✅ Standard HTTP server (blocking)
- ✅ Framework of your choice (Flask, FastAPI, etc.)
- ✅ Full pip package support
- ✅ Traditional deployment patterns

**What you need:**
- Framework code with `.run()` method
- PORT environment variable
- Standard Python server entry point

## 🔧 Framework Options

This mode supports:

### Flask Examples
```python
from flask import Flask
app = Flask(__name__)

@app.route('/')
def home():
    return {"message": "Hello from Flask!"}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)
```

### FastAPI Examples  
```python
from fastapi import FastAPI
from uvicorn import run

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello from FastAPI!"}

if __name__ == '__main__':
    run(app, host="0.0.0.0", port=3000)
```

### Uvicorn Examples
```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello from Uvicorn!"}

if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=3000)
```

### Standard HTTPServer Example
```python
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class SimpleHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "healthy"}).encode())
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 3000), SimpleHandler)
    server.serve_forever()
```

## 🎯 When to Use This Mode

**Use Standard mode when:**
- ✅ You need traditional Python web frameworks
- ✅ You want Flask, FastAPI, or similar
- ✅ You need pip packages in your deployment
- ✅ You prefer traditional blocking server patterns
- ✅ You want maximum framework compatibility

**Avoid Standard mode when:**
- ❌ You need Cloudflare Workers edge deployment
- ❌ You want zero configuration, pip-free deployment
- ❌ You need the Pyodide runtime
- ❌ You want serverless, stateless deployment

## 🛠️ Development Workflow

```bash
# Create project
mkdir my-python-api
cd my-python-api
# Copy this app.py or create your own

# Initialize (defaults to standard mode)
ugahost init
# Choose: python, standard mode (default)

# Deploy
ugahost deploy

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
- ✅ Framework: Flask, FastAPI, Starlette, Django, etc.
- ✅ Server: `.run()` method, `app.run()`, `uvicorn.run()`, `HTTPServer`, `ThreadingHTTPServer`
- ✅ Environment: `PORT` environment variable reference
- ❌ No Cloudflare Worker/Pyodide APIs (`workers`, `WorkerEntrypoint`, `pyodide`, `on_fetch`)

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

1. **Start with Standard mode** - it's easier and more familiar
2. **Use Flask for rapid development** - most Python web developers know Flask
3. **Use FastAPI for modern APIs** - great for REST APIs and OpenAPI docs
4. **Use Uvicorn for production** - high-performance ASGI server
5. **Remember PORT env var** - crucial for deployment

## 🔧 Troubleshooting

### Common Issues

**Issue:** "No standard Python HTTP server startup was found"
**Fix:** Ensure your code uses `app.run()`, `uvicorn.run()`, or `HTTPServer`

**Issue:** "Must reference PORT environment variable"
**Fix:** Add `port = os.environ.get('PORT', 3000)` or similar

**Issue:** "Cloudflare Worker/Pyodide APIs found"
**Fix:** This should work in standard mode, but if it fails, you may have Workers API code

### Validation Error Messages

- ✅ **Valid:** `from flask import Flask` + `app.run(host='0.0.0.0', port=3000)`
- ✅ **Valid:** `import uvicorn` + `uvicorn.run(app, ...)`
- ✅ **Valid:** `from http.server import HTTPServer`
- ❌ **Invalid:** `from workers import WorkerEntrypoint`
- ❌ **Invalid:** `import pyodide.http`
- ❌ **Invalid:** `class Default(WorkerEntrypoint):`

## 🚀 Deployment Commands

```bash
# Standard Flask deployment (most common)
ugahost init                    # Choose: python, standard mode (default)
ugahost deploy

# Explicit standard mode
ugahost init --mode standard
ugahost deploy

# After deployment
ugahost status                   # Check deployment
ugahost logs -f                 # View real-time logs
ugahost env set API_KEY "key"   # Add environment variables
```

## 📞 Support

- **Dashboard**: https://qssnpaas.gss-tec.com
- **Email**: info@gss-tec.com
- **Examples**: See also `examples/pyodide-worker/` for alternative mode

---

**Ready to deploy!** This example demonstrates UGA HOST's Standard mode with traditional Python web servers.

**See also:** `examples/pyodide-worker/README.md` for Pyodide Worker mode

**Made with ❤️ by Gaston Software Solutions Tec Uganda**
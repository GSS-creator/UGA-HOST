# UGA HOST CLI

[![npm version](https://img.shields.io/npm/v/ugahost.svg)](https://www.npmjs.com/package/ugahost)
[![npm downloads](https://img.shields.io/npm/dm/ugahost.svg)](https://www.npmjs.com/package/ugahost)
![Node.js](https://img.shields.io/badge/Node.js-Supported-green)
![Python](https://img.shields.io/badge/Python-Supported-green)
![License](https://img.shields.io/badge/license-MIT-blue)

The official command-line interface for deploying backend applications to UGA HOST on QSSN PaaS.

**UGA HOST** is a Platform-as-a-Service (PaaS) that allows developers to deploy Node.js and Python backend applications to the edge using Cloudflare Workers with automatic database provisioning.

## 🚀 Features

- ✅ **Node.js Support** - Deploy Express, Fastify, Koa, or vanilla Node.js apps
- ✅ **Python Support** - Deploy Flask, FastAPI, or Django applications
- ✅ **Edge Deployment** - Apps run on Cloudflare's global network
- ✅ **R2 Database** - Each project gets a JSON document store (200 MB free)
- ✅ **Custom Subdomains** - `your-app.gss-tec.com`
- ✅ **Environment Variables** - Secure configuration management
- ✅ **Real-time Logs** - Monitor your application
- ✅ **Smart Redeploy** - `ugahost deploy` updates existing projects automatically
- ✅ **Full DB CLI** - find, insert, update, delete, migrate, export, import
- ✅ **API Key Authentication** - Secure CLI access
- ✅ **Free Plan** - 2 apps, 200 MB storage, 10,000 requests/day

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
npm install -g ugahost@1.0.5
```

Verify installation:

```bash
ugahost --version
# Output: 1.0.5
```

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

#### `ugahost db info`
Show database info and storage usage.

```bash
ugahost db info
```

#### `ugahost db collections`
List all collections in your database.

```bash
ugahost db collections
```

#### `ugahost db find <collection> [query]`
Find documents in a collection.

```bash
ugahost db find users
ugahost db find users '{"role":"admin"}'
ugahost db find users --json
```

#### `ugahost db get <collection> <id>`
Get one document by `_id`.

```bash
ugahost db get users usr_abc123
```

#### `ugahost db insert <collection> <json>`
Insert a new document.

```bash
ugahost db insert users '{"name":"John","email":"john@example.com"}'
```

#### `ugahost db update <collection> <query> <updates>`
Update documents matching a query.

```bash
ugahost db update users '{"email":"john@example.com"}' '{"name":"Jane"}'
```

#### `ugahost db delete <collection> <query>`
Delete documents matching a query.

```bash
ugahost db delete users '{"email":"john@example.com"}'
```

#### `ugahost db count <collection> [query]`
Count documents in a collection.

```bash
ugahost db count users
ugahost db count users '{"role":"admin"}'
```

#### `ugahost db drop <collection>`
Drop an entire collection (asks for confirmation).

```bash
ugahost db drop sessions
```

#### `ugahost db migrate <file>`
Run a migration JSON file — like `wrangler d1 execute`.

```bash
ugahost db migrate migrations/001_seed.json
```

#### `ugahost db export <collection>`
Export a collection to a JSON file.

```bash
ugahost db export users
ugahost db export users -o backup/users.json
```

#### `ugahost db import <collection> <file>`
Import a JSON file into a collection.

```bash
ugahost db import users backup/users.json
```

> 📖 See [COMMANDS.md](./COMMANDS.md) for full details including migration file format.

## Supported Languages

UGA HOST currently supports:

- ✅ **Node.js** (`nodejs`) - Express, Fastify, vanilla Node.js
- ✅ **Python** (`python`) - Flask applications

**Note**: Only Node.js and Python are supported. Other languages require external infrastructure and are not currently available.

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

Each project automatically gets an **R2-backed JSON document store** (like MongoDB). You get up to **200 MB** of storage per account.

Access your database using:
- The UGA HOST dashboard at https://qssnpaas.gss-tec.com
- The CLI commands (`ugahost db ...`)
- Your application code via `globalThis.DB` (automatically injected)

## Examples

### Deploy a Node.js Express App

```bash
cd my-express-app
ugahost login
ugahost init
# Choose: nodejs, port 3000
ugahost deploy
```

### Deploy a Python Flask App

```bash
cd my-flask-app
ugahost login
ugahost init
# Choose: python, port 5000
ugahost deploy
```

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

### Example 2: Python Flask API

```bash
# Create project
mkdir my-flask-app && cd my-flask-app

# Create app (app.py)
cat > app.py << 'EOF'
from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify(message='Hello from UGA HOST!')

@app.route('/api/status')
def status():
    return jsonify(status='healthy')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
EOF

# Create requirements
echo "Flask==3.0.0" > requirements.txt

# Deploy
ugahost login
ugahost init  # Choose: python, port 5000
ugahost deploy

# Test
curl https://my-flask-app.gss-tec.com/
```

### Example 3: Using the Database

```bash
# See database info and storage
ugahost db info

# List collections
ugahost db collections

# Insert data
ugahost db insert users '{"name":"John","email":"john@example.com","role":"admin"}'

# Query data
ugahost db find users
ugahost db find users '{"role":"admin"}'

# Update a record
ugahost db update users '{"email":"john@example.com"}' '{"name":"Jane"}'

# Delete a record
ugahost db delete users '{"email":"john@example.com"}'

# Export collection to file
ugahost db export users -o backup.json

# Run a migration
ugahost db migrate migrations/001_seed.json
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
**A:** Currently Node.js and Python (Flask). More languages coming soon.

### Q: Is there a free tier?
**A:** Check the dashboard for current pricing plans.

### Q: Can I use my own domain?
**A:** Custom domains are coming soon. Currently, you get `subdomain.gss-tec.com`.

### Q: How do I update my app?
**A:** Just run `ugahost deploy` again to update.

### Q: Where is my code stored?
**A:** Code is stored in Cloudflare R2 and deployed as Cloudflare Workers.

### Q: What database do I get?
**A:** Each project gets an R2-backed JSON document store (like MongoDB). Use `ugahost db` commands to manage it, or access it in your app via `globalThis.DB`.

### Q: Can I have multiple projects?
**A:** Yes! Free plan allows **2 projects**, each with its own subdomain and database.

### Q: What are the free plan limits?
**A:** 2 apps, 200 MB R2 storage, 10,000 requests/day per account.

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

### App Not Accessible

- Wait 30-60 seconds after deployment
- Check if app is running: `ugahost status`
- View logs: `ugahost logs -f`

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

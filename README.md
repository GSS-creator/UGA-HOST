# UGA HOST CLI

![UGA HOST](https://img.shields.io/badge/UGA%20HOST-v1.0.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-Supported-green)
![Python](https://img.shields.io/badge/Python-Supported-green)
![License](https://img.shields.io/badge/license-MIT-blue)

The official command-line interface for deploying backend applications to UGA HOST on QSSN PaaS.

**UGA HOST** is a Platform-as-a-Service (PaaS) that allows developers to deploy Node.js and Python backend applications to the edge using Cloudflare Workers.

## 🚀 Features

- ✅ **Node.js Support** - Deploy Express, Fastify, or vanilla Node.js apps
- ✅ **Python Support** - Deploy Flask applications  
- ✅ **Edge Deployment** - Apps run on Cloudflare's global network
- ✅ **Automatic Database** - Each project gets a Turso database
- ✅ **Custom Subdomains** - `your-app.gss-tec.com`
- ✅ **Environment Variables** - Secure configuration management
- ✅ **Real-time Logs** - Monitor your application
- ✅ **Simple CLI** - Easy-to-use command-line interface

## Installation

```bash
npm install -g ugahost
```

## Quick Start

### 1. Login to UGA HOST

```bash
ugahost login
```

Enter your email and password when prompted.

### 2. Initialize Your Project

```bash
cd your-project
ugahost init
```

You'll be asked to provide:
- Project name
- Subdomain (your-app.gss-tec.com)
- Language (nodejs, python, go, php, ruby, java, rust, csharp)
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
Show database information.

```bash
ugahost db info
```

#### `ugahost db tables`
List all database tables.

```bash
ugahost db tables
```

#### `ugahost db query <sql>`
Execute a SQL query.

```bash
ugahost db query "SELECT * FROM users LIMIT 10"
ugahost db query "CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT)"
```

#### `ugahost db backup`
Create a database backup.

```bash
ugahost db backup
```

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

Each project automatically gets a Turso database. You don't need to configure anything - it's created automatically when you deploy.

Access your database using:
- The UGA HOST dashboard
- The CLI commands (`ugahost db ...`)
- Your application code (connection details available in environment variables)

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

### Example 3: Using Database

```bash
# Create table
ugahost db query "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)"

# Insert data
ugahost db query "INSERT INTO users (name, email) VALUES ('John', 'john@example.com')"

# Query data
ugahost db query "SELECT * FROM users"

# List tables
ugahost db tables

# Get database info
ugahost db info
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

1. Run `ugahost login`
2. Enter email and password
3. CLI calls authentication API
4. Receives JWT token
5. Saves token to `~/.ugahost/config.json`
6. All subsequent commands use this token

### Config File Location

- **Linux/Mac**: `~/.ugahost/config.json`
- **Windows**: `C:\Users\<username>\.ugahost\config.json`

### Config File Format

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "user@example.com",
  "apiUrl": "https://qssn-paas-management.gastonsoftwaresolutions234.workers.dev"
}
```

## 📋 API Reference

### Management API

Base URL: `https://qssn-paas-management.gastonsoftwaresolutions234.workers.dev`

All requests require authentication:
```
Authorization: Bearer <your-token>
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
**A:** Each project gets a Turso (SQLite) database automatically.

### Q: Can I have multiple projects?
**A:** Yes! Each project gets its own subdomain and database.

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

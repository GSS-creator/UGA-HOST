# UGA HOST CLI - Quick Start Guide

## Installation & Setup

### 1. Build the CLI

```bash
cd paas/ugahost-cli
npm install
npm run build
```

### 2. Link for Local Testing

```bash
npm link
```

This makes the `ugahost` command available globally on your system.

### 3. Test the CLI

```bash
ugahost --version
ugahost --help
```

## Usage Workflow

### Step 1: Login

```bash
ugahost login
```

Enter your credentials:
- Email: your-email@example.com
- Password: your-password

### Step 2: Initialize a Project

Navigate to your project directory:

```bash
cd /path/to/your/project
ugahost init
```

Answer the prompts:
- **Project name**: my-api
- **Subdomain**: my-api (will be: my-api.gss-tec.com)
- **Language**: nodejs (or python, go, php, ruby, java, rust, csharp)
- **Port**: 3000

This creates a `ugahost.json` file in your project.

### Step 3: Deploy

```bash
ugahost deploy
```

Your app will be deployed to: `https://your-subdomain.gss-tec.com`

### Step 4: Manage Your Application

#### View Status
```bash
ugahost status
```

#### View Logs
```bash
ugahost logs
ugahost logs -f  # Follow logs in real-time
```

#### Control Application
```bash
ugahost start    # Start the server
ugahost stop     # Stop the server
ugahost restart  # Restart the server
```

#### Environment Variables
```bash
ugahost env list
ugahost env set DATABASE_URL "postgresql://..."
ugahost env set API_KEY "secret123" --secret
ugahost env unset API_KEY
```

#### Database Management
```bash
ugahost db info
ugahost db tables
ugahost db query "SELECT * FROM users LIMIT 10"
ugahost db backup
```

#### List All Projects
```bash
ugahost projects
```

## Example: Deploy a Node.js Express App

```bash
# 1. Create a simple Express app
mkdir my-express-app
cd my-express-app
npm init -y
npm install express

# 2. Create index.js
cat > index.js << 'EOF'
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Hello from UGA HOST!' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
EOF

# 3. Login to UGA HOST
ugahost login

# 4. Initialize the project
ugahost init
# Choose: nodejs, port 3000

# 5. Deploy
ugahost deploy

# 6. View logs
ugahost logs -f
```

## Example: Deploy a Python Flask App

```bash
# 1. Create a Flask app
mkdir my-flask-app
cd my-flask-app

# 2. Create app.py
cat > app.py << 'EOF'
from flask import Flask, jsonify
import os

app = Flask(__name__)
port = int(os.environ.get('PORT', 5000))

@app.route('/')
def hello():
    return jsonify(message='Hello from UGA HOST!')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=port)
EOF

# 3. Create requirements.txt
echo "Flask==3.0.0" > requirements.txt

# 4. Login and deploy
ugahost login
ugahost init
# Choose: python, port 5000
ugahost deploy
```

## Troubleshooting

### CLI Not Found After `npm link`
Try:
```bash
npm unlink
npm link
```

Or use the CLI directly:
```bash
node dist/index.js --help
```

### Build Errors
```bash
rm -rf node_modules dist
npm install
npm run build
```

### Check CLI Version
```bash
ugahost --version
```

### View All Commands
```bash
ugahost --help
```

## Publishing to npm (For Maintainers)

### 1. Update Version
Edit `package.json` and bump the version.

### 2. Build
```bash
npm run build
```

### 3. Test Locally
```bash
npm link
ugahost --version
```

### 4. Publish
```bash
npm login
npm publish
```

### 5. Install from npm
```bash
npm install -g ugahost
```

## Configuration Files

### Global Config: `~/.ugahost/config.json`
Stores authentication token and API URL.

```json
{
  "token": "your-auth-token",
  "email": "your-email@example.com",
  "apiUrl": "https://qssn-paas-management.gastonsoftwaresolutions234.workers.dev"
}
```

### Project Config: `ugahost.json`
Stores project-specific configuration.

```json
{
  "name": "my-api",
  "subdomain": "my-api",
  "language": "nodejs",
  "port": 3000,
  "projectId": "abc123"
}
```

## Support

- Dashboard: https://bebb2c8a.qssn-cloud-manager.pages.dev
- API: https://qssn-paas-management.gastonsoftwaresolutions234.workers.dev
- Email: support@gss-tec.com

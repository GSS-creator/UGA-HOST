# UGA HOST CLI - Installation Guide

## For End Users (After npm Publish)

Once the CLI is published to npm, users can install it globally:

```bash
npm install -g ugahost
```

Then use it immediately:

```bash
ugahost --version
ugahost login
```

## For Development & Testing (Current)

### Prerequisites
- Node.js 16 or higher
- npm or yarn

### Step 1: Navigate to CLI Directory
```bash
cd paas/ugahost-cli
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Build the CLI
```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

### Step 4: Link for Local Testing
```bash
npm link
```

This creates a global symlink, making the `ugahost` command available system-wide.

### Step 5: Verify Installation
```bash
ugahost --version
ugahost --help
```

You should see:
```
ugahost/1.0.0
```

## Uninstalling (Development)

To remove the global link:

```bash
npm unlink -g ugahost
```

## Publishing to npm (For Maintainers)

### 1. Ensure You're Logged In
```bash
npm login
```

### 2. Update Version (if needed)
Edit `package.json` and bump the version:
```json
{
  "version": "1.0.1"
}
```

### 3: Build
```bash
npm run build
```

### 4. Publish
```bash
npm publish
```

### 5. Verify
```bash
npm info ugahost
```

## Updating the CLI (For Users)

```bash
npm update -g ugahost
```

Or reinstall:
```bash
npm uninstall -g ugahost
npm install -g ugahost
```

## Troubleshooting

### Command Not Found After `npm link`

**Solution 1**: Check npm global bin path
```bash
npm config get prefix
```

Make sure this path is in your system PATH.

**Solution 2**: Use npx
```bash
npx ugahost --help
```

**Solution 3**: Run directly
```bash
node dist/index.js --help
```

### Permission Errors on Linux/Mac

Use sudo:
```bash
sudo npm link
```

Or fix npm permissions:
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### Build Errors

Clean and rebuild:
```bash
rm -rf node_modules dist
npm install
npm run build
```

### TypeScript Errors

Make sure TypeScript is installed:
```bash
npm install -g typescript
```

## Development Workflow

### Watch Mode
For active development:
```bash
npm run dev
```

This watches for file changes and rebuilds automatically.

### Testing Changes
After making changes:
```bash
npm run build
ugahost <command>
```

The linked command will use the latest build.

## Directory Structure

```
ugahost-cli/
├── src/
│   ├── index.ts              # Main CLI entry point
│   ├── commands/             # All CLI commands
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
│   └── utils/                # Utility functions
│       ├── config.ts         # Config management
│       └── api.ts            # API client
├── dist/                     # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
├── README.md
├── QUICKSTART.md
└── INSTALLATION.md
```

## Configuration Files

### Global Config: `~/.ugahost/config.json`
Created after first login:
```json
{
  "token": "your-auth-token",
  "email": "user@example.com",
  "apiUrl": "https://qssn-paas-management.gastonsoftwaresolutions234.workers.dev"
}
```

### Project Config: `ugahost.json`
Created by `ugahost init`:
```json
{
  "name": "my-project",
  "subdomain": "my-project",
  "language": "nodejs",
  "port": 3000,
  "projectId": "abc123"
}
```

## Next Steps

After installation, see:
- `QUICKSTART.md` - Quick start guide
- `README.md` - Full documentation
- `ugahost --help` - Command reference

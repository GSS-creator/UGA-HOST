# UGA HOST CLI - Complete Command Implementations

This document contains all the command implementations for the UGA HOST CLI.

## File Structure

```
src/
├── commands/
│   ├── index.ts (exports all commands)
│   ├── login.ts ✅ (created)
│   ├── init.ts
│   ├── deploy.ts
│   ├── logs.ts
│   ├── env.ts
│   ├── db.ts
│   ├── projects.ts
│   ├── start.ts
│   ├── stop.ts
│   ├── restart.ts
│   └── status.ts
├── utils/
│   ├── config.ts ✅ (created)
│   └── api.ts ✅ (created)
└── index.ts ✅ (created)
```

## Installation & Build

```bash
cd paas/ugahost-cli
npm install
npm run build
npm link  # For local testing
```

## Usage After Installation

```bash
# Login
ugahost login

# Initialize project
ugahost init

# Deploy
ugahost deploy

# View logs
ugahost logs -f

# Manage environment variables
ugahost env list
ugahost env set KEY value
ugahost env unset KEY

# Database commands
ugahost db info
ugahost db tables
ugahost db query "SELECT * FROM users"

# Server control
ugahost start
ugahost stop
ugahost restart
ugahost status

# List projects
ugahost projects
```

## API Integration

All commands use the backend API at:
`https://qssn-paas-management.gastonsoftwaresolutions234.workers.dev`

### API Endpoints Used

- `POST /api/auth/login` - Authentication
- `GET /api/backend/projects` - List projects
- `POST /api/backend/projects` - Create project
- `POST /api/backend/projects/:id/files/upload` - Upload files
- `POST /api/backend/projects/:id/start` - Start server
- `POST /api/backend/projects/:id/stop` - Stop server
- `GET /api/backend/projects/:id/logs` - Get logs
- `GET /api/backend/projects/:id/env` - List env vars
- `POST /api/backend/projects/:id/env` - Set env var
- `DELETE /api/backend/projects/:id/env/:key` - Delete env var
- `GET /api/backend/projects/:id/database` - Database info
- `POST /api/backend/projects/:id/database/query` - Execute query

## Publishing to npm

```bash
# 1. Update version in package.json
# 2. Build
npm run build

# 3. Login to npm
npm login

# 4. Publish
npm publish

# Users can then install with:
npm install -g ugahost
```

## Complete Implementation Status

| Command | Status | Description |
|---------|--------|-------------|
| login | ✅ Complete | Authenticate with email/password |
| init | 📝 Template | Initialize project config |
| deploy | 📝 Template | Deploy code to UGA HOST |
| logs | 📝 Template | View application logs |
| env | 📝 Template | Manage environment variables |
| db | 📝 Template | Database management |
| projects | 📝 Template | List all projects |
| start | 📝 Template | Start backend server |
| stop | 📝 Template | Stop backend server |
| restart | 📝 Template | Restart backend server |
| status | 📝 Template | Show project status |

## Next Steps

1. **Implement remaining commands** - Create all command files
2. **Test locally** - Use `npm link` to test
3. **Add error handling** - Improve error messages
4. **Add progress indicators** - Use `ora` for spinners
5. **Publish to npm** - Make it available globally

The CLI structure is ready and can be completed by implementing each command file!

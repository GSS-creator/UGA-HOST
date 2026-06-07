# Environment Variables & Secrets Guide

## Overview

UGA HOST allows you to securely manage environment variables and secrets for your backend applications. **Never hardcode API keys or sensitive data in your code!** Instead, use environment variables.

## Setting Environment Variables

### Interactive Mode (Recommended)

```bash
ugahost env set
```

You'll be prompted for:
- **Variable name**: e.g., `API_KEY`, `DATABASE_URL`
- **Value**: The actual value
- **Secret?**: Mark as secret to hide in logs

### Command Line Mode

```bash
# Regular variable
ugahost env set PORT 3000

# Secret variable (hidden in logs)
ugahost env set API_KEY "sk-1234567890" --secret
```

## Using Environment Variables in Your Code

All environment variables are automatically injected into `process.env`:

```javascript
// Node.js/Express example
const express = require('express');
const app = express();

// Access environment variables
const apiKey = process.env.API_KEY;
const dbUrl = process.env.DATABASE_URL;
const port = process.env.PORT || 3000;

app.get('/api/data', async (req, res) => {
  // Use the API key
  const response = await fetch('https://api.example.com/data', {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });
  
  const data = await response.json();
  res.json(data);
});

// Export for UGA HOST
globalThis.app = app;
```

## Best Practices

### ✅ DO:
- Store API keys as secrets
- Store database URLs as environment variables
- Store configuration values as environment variables
- Mark sensitive data as secrets

### ❌ DON'T:
- Hardcode API keys in your code
- Commit `.env` files to git
- Share secrets in plain text
- Log secret values

## Common Environment Variables

### API Keys
```bash
ugahost env set OPENAI_API_KEY "sk-..." --secret
ugahost env set STRIPE_SECRET_KEY "sk_test_..." --secret
ugahost env set SENDGRID_API_KEY "SG...." --secret
```

### Database URLs
```bash
ugahost env set DATABASE_URL "postgresql://user:pass@host:5432/db"
ugahost env set REDIS_URL "redis://localhost:6379"
```

### Configuration
```bash
ugahost env set NODE_ENV "production"
ugahost env set PORT 3000
ugahost env set LOG_LEVEL "info"
```

## Managing Environment Variables

### List All Variables
```bash
ugahost env list
```

Output:
```
📋 Environment Variables:

API_KEY = ***
DATABASE_URL = postgresql://...
PORT = 3000
NODE_ENV = production
```

### Remove a Variable
```bash
ugahost env unset API_KEY
```

## Automatic Redeployment

When you set or update an environment variable, **your app is automatically redeployed** with the new values. No manual redeployment needed!

```bash
ugahost env set NEW_FEATURE_FLAG "true"
# ✅ App automatically redeployed with new variable
```

## Security Features

### Secrets
Variables marked as secret:
- Are hidden in logs (shown as `***`)
- Are encrypted in the database
- Are only visible to you

### Access Control
- Only you can view/modify your project's environment variables
- Environment variables are isolated per project
- Secrets are never exposed in API responses

## Example: Secure API Integration

### ❌ Bad (Hardcoded)
```javascript
const apiKey = 'sk-1234567890'; // DON'T DO THIS!

fetch('https://api.example.com/data', {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});
```

### ✅ Good (Environment Variable)
```javascript
// Set the secret first:
// ugahost env set API_KEY "sk-1234567890" --secret

const apiKey = process.env.API_KEY;

fetch('https://api.example.com/data', {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});
```

## Turso Database Integration

UGA HOST automatically creates a Turso database for your backend projects and injects the credentials:

```javascript
// These are automatically available:
const dbUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

// Use with @libsql/client
import { createClient } from '@libsql/client';

const client = createClient({
  url: dbUrl,
  authToken: authToken
});
```

## Troubleshooting

### Variable Not Available
If `process.env.MY_VAR` is undefined:

1. **Check it's set:**
   ```bash
   ugahost env list
   ```

2. **Redeploy if needed:**
   ```bash
   ugahost deploy
   ```

3. **Check spelling:**
   Variable names are case-sensitive!

### Secret Not Hidden
Make sure you used the `--secret` flag:
```bash
ugahost env set API_KEY "value" --secret
```

## Migration from Hardcoded Values

If you have hardcoded values in your code:

1. **Identify sensitive data:**
   - API keys
   - Database passwords
   - Secret tokens
   - Private keys

2. **Set as environment variables:**
   ```bash
   ugahost env set API_KEY "your-key" --secret
   ugahost env set DB_PASSWORD "your-password" --secret
   ```

3. **Update your code:**
   ```javascript
   // Before
   const apiKey = 'hardcoded-key';
   
   // After
   const apiKey = process.env.API_KEY;
   ```

4. **Redeploy:**
   ```bash
   ugahost deploy
   ```

## Summary

- ✅ Use `ugahost env set` to manage environment variables
- ✅ Mark sensitive data as secrets with `--secret`
- ✅ Access variables via `process.env.VARIABLE_NAME`
- ✅ Never hardcode API keys or passwords
- ✅ Automatic redeployment when variables change

---

**Your secrets are safe with UGA HOST!** 🔒
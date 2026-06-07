# Publishing UGA HOST CLI to npm

## Current Status

❌ **NOT YET PUBLISHED** - The CLI is only available locally on your machine.

To make it available worldwide (UK, USA, everywhere), you need to publish it to npm.

## Prerequisites

1. **npm Account**: Create one at https://www.npmjs.com/signup
2. **Email Verification**: Verify your npm email
3. **2FA (Optional but Recommended)**: Enable two-factor authentication

## Steps to Publish

### 1. Login to npm

```bash
npm login
```

Enter your:
- Username
- Password
- Email
- 2FA code (if enabled)

### 2. Check Package Name Availability

```bash
npm search ugahost
```

If the name is taken, you'll need to:
- Use a scoped package: `@gss-tec/ugahost`
- Choose a different name: `ugahost-cli`, `uga-host`, etc.

### 3. Update package.json (if needed)

If the name is taken, update `package.json`:

```json
{
  "name": "@gss-tec/ugahost",
  ...
}
```

### 4. Build the Package

```bash
cd paas/ugahost-cli
npm run build
```

### 5. Test Locally First

```bash
# Install locally
npm install -g .

# Test it works
ugahost --version
ugahost --help
```

### 6. Publish to npm

```bash
# For public package
npm publish --access public

# For scoped package
npm publish --access public
```

### 7. Verify Publication

```bash
# Check on npm
npm view ugahost

# Or visit
# https://www.npmjs.com/package/ugahost
```

## After Publishing

Users worldwide can install with:

```bash
npm install -g ugahost
```

## Updating the Package

When you make changes:

1. Update version in `package.json`:
   ```json
   {
     "version": "1.0.1"  // Increment version
   }
   ```

2. Build and publish:
   ```bash
   npm run build
   npm publish
   ```

## Version Guidelines

- **Patch** (1.0.0 → 1.0.1): Bug fixes
- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
- **Major** (1.0.0 → 2.0.0): Breaking changes

## Alternative: GitHub Packages

If you don't want to use npm, you can publish to GitHub Packages:

```bash
# Login to GitHub Packages
npm login --registry=https://npm.pkg.github.com

# Update package.json
{
  "name": "@GSS-creator/ugahost",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}

# Publish
npm publish
```

Users would install with:
```bash
npm install -g @GSS-creator/ugahost --registry=https://npm.pkg.github.com
```

## Recommended: Use npm Registry

For the best user experience, publish to the main npm registry. It's:
- ✅ Free for public packages
- ✅ Trusted by developers worldwide
- ✅ Easy to install (just `npm install -g ugahost`)
- ✅ Automatic updates with `npm update -g ugahost`

## Current Installation Method

Until published, users must:

```bash
# Clone the repo
git clone https://github.com/GSS-creator/UGA-HOST.git
cd UGA-HOST/paas/ugahost-cli

# Install dependencies and build
npm install
npm run build

# Install globally
npm install -g .
```

This is NOT ideal for end users!

## Next Steps

1. ✅ Create npm account
2. ✅ Verify email
3. ✅ Login: `npm login`
4. ✅ Check name: `npm search ugahost`
5. ✅ Publish: `npm publish --access public`
6. 🎉 Users can install: `npm install -g ugahost`

## Contact

If you need help publishing:
- Email: info@gss-tec.com
- WhatsApp: +256755274944

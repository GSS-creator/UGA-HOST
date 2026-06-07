# Publishing UGA HOST CLI to npm

## Prerequisites

1. **npm Account**: You need an npm account. If you don't have one, create it at https://www.npmjs.com/signup
2. **2FA Setup**: npm requires 2FA for publishing packages. Set it up at https://www.npmjs.com/settings/~/profile

## Step-by-Step Publishing Process

### 1. Login to npm

```bash
npm login
```

You'll be prompted for:
- Username
- Password
- Email
- 2FA code (if enabled)

### 2. Verify Login

```bash
npm whoami
```

This should display your npm username.

### 3. Build the Package

```bash
cd ugahost-cli
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

### 4. Test the Package Locally (Optional)

```bash
# Create a test installation
npm pack

# This creates ugahost-1.0.9.tgz
# Install it globally to test
npm install -g ./ugahost-1.0.9.tgz

# Test the CLI
ugahost --version
ugahost --help
```

### 5. Publish to npm

```bash
npm publish
```

If you get a 404 error, it might mean:
- The package name is already taken
- You're not logged in
- You don't have permission to publish

### 6. Verify Publication

```bash
# Check on npm
npm view ugahost

# Or visit
# https://www.npmjs.com/package/ugahost
```

## Version Updates

For future updates:

```bash
# Patch version (1.0.9 -> 1.0.10)
npm version patch

# Minor version (1.0.9 -> 1.1.0)
npm version minor

# Major version (1.0.9 -> 2.0.0)
npm version major

# Then publish
npm publish
```

## Current Version

**Version 1.0.9** includes:
- ✅ Interactive `ugahost env set` command
- ✅ Prompts for variable name, value, and secret flag
- ✅ Input validation for environment variables
- ✅ Backward compatible with command-line arguments

## Changelog for v1.0.9

### Added
- Interactive prompts for `ugahost env set` command
- Variable name validation (must start with letter/underscore, alphanumeric + underscore only)
- Value validation (cannot be empty)
- Secret flag prompt when not provided via `--secret` option

### Changed
- Made `key` and `value` arguments optional in `ugahost env set [key] [value]`
- Updated command description to indicate interactive mode

### Maintained
- Full backward compatibility with `ugahost env set KEY value` syntax
- `--secret` flag still works as before

## Troubleshooting

### Error: 401 Unauthorized
**Solution:** You're not logged in. Run `npm login`

### Error: 404 Not Found
**Solution:** 
- Package name might be taken. Check https://www.npmjs.com/package/ugahost
- You might not have permission. Ensure you're logged in as the package owner

### Error: 403 Forbidden
**Solution:** 
- You don't have permission to publish this package
- 2FA might be required. Set it up at https://www.npmjs.com/settings/~/profile

### Error: Package name too similar
**Solution:** npm might reject names too similar to existing packages. Choose a unique name.

## After Publishing

1. **Test Installation:**
   ```bash
   npm install -g ugahost@1.0.9
   ugahost --version
   ```

2. **Update Documentation:**
   - Update README.md with new features
   - Update CHANGELOG.md
   - Tag the release in git

3. **Announce:**
   - Update project website
   - Notify users of new features
   - Post on social media/forums

## Quick Publish Checklist

- [ ] Logged in to npm (`npm whoami`)
- [ ] Version bumped in package.json
- [ ] Code built successfully (`npm run build`)
- [ ] Tests passing (if any)
- [ ] README updated
- [ ] CHANGELOG updated
- [ ] Ready to publish (`npm publish`)

---

**Current Status:** Ready to publish v1.0.9 with interactive env set feature!

Run these commands:
```bash
npm login
npm publish
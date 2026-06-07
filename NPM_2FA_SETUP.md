# npm Two-Factor Authentication Setup

## Error Message

```
403 Forbidden - Two-factor authentication or granular access token 
with bypass 2fa enabled is required to publish packages.
```

## Solution: Enable 2FA

### Option 1: Enable 2FA (Recommended)

1. **Go to npm Settings**: https://www.npmjs.com/settings/YOUR_USERNAME/tfa

2. **Enable 2FA**:
   - Click "Enable 2FA"
   - Choose "Authorization and Publishing" (most secure)
   - Scan QR code with authenticator app (Google Authenticator, Authy, etc.)
   - Enter the 6-digit code
   - Save recovery codes in a safe place

3. **Publish Again**:
   ```bash
   npm publish --access public
   ```
   
   You'll be prompted for your 2FA code:
   ```
   npm notice Publishing to https://registry.npmjs.org/
   This operation requires a one-time password.
   Enter OTP: ______
   ```
   
   Enter the 6-digit code from your authenticator app.

### Option 2: Use Automation Token (For CI/CD)

If you want to publish without entering 2FA each time:

1. **Create an Automation Token**:
   - Go to: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Click "Generate New Token"
   - Select "Automation" type
   - Copy the token (starts with `npm_...`)

2. **Use the Token**:
   ```bash
   npm config set //registry.npmjs.org/:_authToken YOUR_TOKEN
   npm publish --access public
   ```

### Option 3: Temporary - Disable 2FA Requirement

⚠️ **Not Recommended** - Less secure

1. Go to: https://www.npmjs.com/settings/YOUR_USERNAME/tfa
2. Change to "Authorization Only" (not "Authorization and Publishing")
3. Publish: `npm publish --access public`
4. Re-enable "Authorization and Publishing" after

## Recommended Approach

**Use Option 1** - Enable 2FA with "Authorization and Publishing"

This is the most secure option and npm requires it for all package publishers.

## After Enabling 2FA

```bash
cd C:\Users\Dell\Desktop\QSSN\paas\ugahost-cli
npm publish --access public
# Enter your 6-digit 2FA code when prompted
```

## Authenticator Apps

Choose one:
- **Google Authenticator** (iOS/Android)
- **Authy** (iOS/Android/Desktop)
- **Microsoft Authenticator** (iOS/Android)
- **1Password** (if you use it)

## Troubleshooting

### "Invalid OTP"
- Make sure your phone's time is synced
- Try generating a new code
- Check you're using the right account

### "Token expired"
- Run `npm login` again
- Try publishing immediately after

### "Still getting 403"
- Log out: `npm logout`
- Log in again: `npm login`
- Try publishing again

## Quick Steps

1. ✅ Go to https://www.npmjs.com/settings/YOUR_USERNAME/tfa
2. ✅ Enable 2FA with "Authorization and Publishing"
3. ✅ Scan QR code with authenticator app
4. ✅ Save recovery codes
5. ✅ Run: `npm publish --access public`
6. ✅ Enter 6-digit code when prompted
7. 🎉 Package published!

## After Publishing

Verify at: https://www.npmjs.com/package/ugahost

Users can install with:
```bash
npm install -g ugahost
```

## Need Help?

- npm 2FA docs: https://docs.npmjs.com/configuring-two-factor-authentication
- Email: info@gss-tec.com
- WhatsApp: +256755274944

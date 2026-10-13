# NexPM 0.9.6.3 — Editable registration email configuration

## Features
- Platform-admin-only Resend sender name/email and API key editor, with database persistence.
- AES-256-GCM encryption at rest for the saved API key; existing key never returned to browser.
- Send-test-email endpoint and feedback.
- Arabic strings and RTL presentation for Application Configuration.
- Registration and account email change use the saved provider settings.

## Changes and limitations
- Calendar, Microsoft, Google and Stripe credentials remain **read-only diagnostics**, not editable.
- Does not implement generic SMTP or runtime OAuth/billing credential hot-reload.
- The legacy status endpoint is accessible to organization admins and only returns safe boolean indicators; the new editing API is platform-admin-only.
- The platform-admin allowlist must be maintained on the backend (not editable from UI).
- Test-email acceptance by provider does not prove inbox delivery.

## Upgrade
1. Back up MongoDB and source. Copy changed files only.
2. Add `PLATFORM_ADMIN_EMAILS=your-admin-login-email` and `APP_CONFIG_ENCRYPTION_KEY=$(openssl rand -hex 32)` to server `.env` (insert the generated value, not the shell expression).
3. **Keep the encryption key safe and permanent**. Losing or rotating it without re-encryption prevents reading saved secrets.
4. `npm run lint && npm test && npm run build`; restart API and frontend.
5. Sign in as the allowlisted platform administrator. Go to Application Configuration and save credentials; send a test email.
6. Verify an actual new registration and email-change flow in a separate test organization.

## Database migration
- No manual migration; Mongoose creates the new `PlatformConfig` collection on first save.

## Rollback
- Restore the backed-up source and restart. The configuration collection may remain unused; retain the encryption key for future upgrades.

## Security
- TLS is required for deployments; avoid committing `.env` or printing secrets.
- Provider API credentials are never returned in read APIs.
- An allowlisted platform administrator must still sign in normally.

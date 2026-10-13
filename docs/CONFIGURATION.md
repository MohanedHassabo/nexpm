# Environment and application configuration

**Do not publish a real `.env` file.** Keep `.env.example` sanitized and deduplicated. The v0.9.6.3 patch's `.env.example` currently includes duplicate `RESEND_API_KEY`, `EMAIL_FROM` and `EMAIL_DEV_LOG_LINK` entries; clean those before committing.

| Key | Purpose | Dev / production notes |
|---|---|---|
| `NODE_ENV` | Node runtime mode | `development` / `production` |
| `PORT` | API listen port | Typically `4000` |
| `MONGO_URL` | MongoDB connection | Local `127.0.0.1:27017/nexpm_demo_v096`; in Docker API uses `mongodb://mongo:27017/nexpm` |
| `REDIS_URL` | Redis connection | Existing WSL mapping `127.0.0.1:6380`; production internal `redis:6379` |
| `JWT_SECRET` | JWT signing secret | Random >=32 bytes; rotate with session invalidation |
| `CORS_ORIGINS` | Allowed browser origins | Exact HTTPS hostnames in production |
| `VITE_API_URL` | Browser API URL | `/api` for same origin; public build-time value |
| `PUBLIC_WEB_URL` | Link and return URL | Local `http://localhost:5173`; production HTTPS URL |
| `PUBLIC_API_URL` | OAuth API callback root | Must resolve over HTTPS in production |
| `PLATFORM_ADMIN_EMAILS` | Platform administrator allowlist | Explicit login email(s); **not all org admins** |
| `APP_CONFIG_ENCRYPTION_KEY` | 32-byte key (hex) for provider secrets | Must be securely backed up; do not rotate without re-encryption |
| `RESEND_API_KEY`, `EMAIL_FROM` | Legacy registration email fallback | Admin-configured Resend value can override; verify sender domain |
| `EMAIL_DEV_LOG_LINK` | Print verification URL in logs | `false` for internet-facing deployments |
| `CALENDAR_ENCRYPTION_KEY` | Encrypt stored calendar tokens | Must be provisioned for OAuth integration |
| `GOOGLE_CALENDAR_CLIENT_ID/SECRET` | Google Calendar OAuth | Requires Google Cloud consent screen and callback setup |
| `MICROSOFT_CLIENT_ID/SECRET` | Microsoft Graph OAuth | Requires Entra app registration/callback |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe API + webhook signature | Server-only; use live keys only for production |
| `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY` | Recurring plan Price IDs | Create in Stripe first |
| `KAFKA_BROKERS` | Optional Kafka event output | Empty = disabled |

## Admin email setup

1. Supply `PLATFORM_ADMIN_EMAILS` and `APP_CONFIG_ENCRYPTION_KEY` securely in server env.
2. Log in with matching platform-admin user (the user must exist in current database).
3. Open **Application Configuration**; fill sender name, verified sender email and Resend key.
4. Save, refresh page and verify configured status; send a test email to a controlled address.
5. Check sender-domain verification and test registration / resend-verification flows; do not assume a provider's acceptance response equals inbox delivery.

**Available UI scope:** v0.9.6.3 editing is Resend-focused. Generic SMTP settings and editing Stripe/Google/Microsoft provider secrets through UI are not implemented. Protect secret values from browser responses and logs.

## WSL shell loading

```bash
set -a
source .env
set +a
npm run dev
```

Never set `NODE_OPTIONS=--env-file=...`; that form is blocked. For production use a secrets manager or root-owned environment file, not repository secrets.

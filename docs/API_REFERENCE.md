# NexPM API — Developer & Study Reference

**Source revision:** v0.4 candidate. **Base:** `http://localhost:4000/api` (WSL development). All JSON unless otherwise noted.

> This reference describes routes in the supplied Express.js source. It is documentation, not evidence of live-provider integration testing.

## Quick start

```bash
cd ~/projects/nexpm
set -a; source .env; set +a
npm run dev
curl http://localhost:4000/api/health
```

## Authentication

- Register using `/auth/register`; the new administrator remains unverified until a one-time token is confirmed.
- Token is delivered by configured Resend email API. For local development only, set `EMAIL_DEV_LOG_LINK=true` and the verification URL is logged to the API terminal. Never enable this in production.
- Verification tokens are SHA-256 hashed at rest, valid for 30 minutes, and consumed on successful verification.
- Login returns a JWT. Send `Authorization: Bearer <token>` for protected routes. Bearer JWT is **not** an OAuth access token for third-party calendars.
- Every organization-scoped MongoDB query should be filtered by `organizationId`. Role gates apply separately.

### Example: register, verify, login

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"organization":"Sample Studio","name":"Sample Admin","email":"owner@example.com","password":"StrongPassword123!"}'

# Open the verification link sent by email (or printed in explicit local debug mode).
curl -X POST http://localhost:4000/api/auth/verify-email \
  -H "Content-Type: application/json" -d '{"token":"<64-character-token>"}'

curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@example.com","password":"StrongPassword123!"}'
```

### Example: authenticated request

```bash
TOKEN="<JWT-from-login>"
curl http://localhost:4000/api/projects -H "Authorization: Bearer $TOKEN"
```

## Complete endpoint index

### Service / readiness

| Method | Endpoint (prefix `/api`) | Access | Purpose |
|---|---|---|---|
| `GET` | `/health` | Public | Process heartbeat |
| `GET` | `/ready` | Public | MongoDB readiness |

### Account verification and authentication

| Method | Endpoint (prefix `/api`) | Access | Purpose |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Creates workspace and unverified admin account; sends email verification link |
| `POST` | `/auth/verify-email` | Public | Verifies token; enables login |
| `POST` | `/auth/resend-verification` | Public | Resends verification link, if needed |
| `POST` | `/auth/login` | Public | Returns Bearer JWT and user |

### Current user and team

| Method | Endpoint (prefix `/api`) | Access | Purpose |
|---|---|---|---|
| `GET` | `/me` | Member | Current user and organization |
| `GET` | `/users` | Member | List organization users |
| `POST` | `/users` | Admin | Create organization user; Standard member quota applies |

### Projects

| Method | Endpoint (prefix `/api`) | Access | Purpose |
|---|---|---|---|
| `GET` | `/projects` | Member | List projects; optional status filter |
| `POST` | `/projects` | Admin/Manager | Create project; quota applies |
| `PATCH` | `/projects/:id` | Admin/Manager | Update project fields |
| `DELETE` | `/projects/:id` | Admin | Delete project and its tasks |

### Tasks

| Method | Endpoint (prefix `/api`) | Access | Purpose |
|---|---|---|---|
| `GET` | `/tasks` | Member | List tasks, optional projectId and status |
| `POST` | `/tasks` | Member | Create task, validate project and assignee; quota applies |
| `PATCH` | `/tasks/:id` | Member | Update task |
| `DELETE` | `/tasks/:id` | Member | Delete task |

### Approvals and reporting

| Method | Endpoint (prefix `/api`) | Access | Purpose |
|---|---|---|---|
| `GET` | `/approvals` | Member | List approvals |
| `POST` | `/approvals` | Member | Create approval request |
| `PATCH` | `/approvals/:id/decision` | Admin/Manager | Approve or reject |
| `GET` | `/activity` | Member | Recent organization activity (35 max) |
| `GET` | `/dashboard` | Member | Dashboard aggregates |

### Subscription billing

| Method | Endpoint (prefix `/api`) | Access | Purpose |
|---|---|---|---|
| `GET` | `/billing/plan` | Member | Current plan and limits |
| `POST` | `/billing/checkout` | Admin | Creates subscription checkout session (Stripe) |
| `POST` | `/billing/portal` | Admin | Creates customer portal session (Stripe) |
| `POST` | `/billing/webhook` | Stripe signature | Payment provider event webhook; raw-body signature validation |

### Calendar connections

| Method | Endpoint (prefix `/api`) | Access | Purpose |
|---|---|---|---|
| `POST` | `/calendar/:provider/connect` | Member | Get provider authorization URL |
| `GET` | `/calendar/:provider/callback` | OAuth state | Provider OAuth callback redirects to app |
| `GET` | `/calendar/connections` | Member | List connections for current user |
| `DELETE` | `/calendar/:provider` | Member | Disconnect provider |
| `POST` | `/calendar/:provider/tasks/:taskId` | Member | Send due date to Google/Outlook calendar |

## Request payloads and validation

### Create project — `POST /api/projects`

```json
{"name":"New website rollout","description":"Customer portal","client":"Demo Company","status":"active","priority":"high","startDate":"2026-10-15","dueDate":"2026-11-15","budget":25000,"color":"#5658d8"}
```

- Required: `name` (2–120 characters).
- Status: `planning | active | on-hold | completed`. Priority: `low | medium | high`.
- Optional: description (up to 4000), client (up to 120), startDate, dueDate, nonnegative budget and color.
- PATCH accepts a subset of these fields. IDs in paths must be MongoDB 24-character hex IDs.

### Create task — `POST /api/tasks`

```json
{"projectId":"<24-character-project-id>","title":"Prepare UI prototype","description":"Build the first layout","status":"todo","priority":"medium","startDate":"2026-10-16","dueDate":"2026-10-20","tags":["frontend","design"],"estimateHours":8}
```

- Required: `projectId`, `title` (2–200 characters). Project must belong to the same workspace.
- Status: `todo | in-progress | review | done`; priority: `low | medium | high | urgent`.
- Optional `assigneeId` must belong to the same workspace; optional startDate/dueDate feed the Gantt timeline.
- Tags: up to 10 strings of 32 characters each. Estimate: 0–10000 hours.

### Approvals

```json
{"title":"Approve delivery milestone","description":"Phase 1 sign-off","projectId":"<24-character-project-id>"}
```

Decision endpoint: `PATCH /api/approvals/:id/decision` with `{"status":"approved"}` or `{"status":"rejected"}`.

### Team member creation

```json
{"name":"Demo Collaborator","email":"collaborator@example.com","password":"StrongPassword123!","role":"member"}
```

Roles: `admin | manager | member`. Note: this endpoint creates a user directly; invitation acceptance and email verification for administrator-created team members should be addressed before public production rollout.

### Billing

```json
{"interval":"month"}
```

Use `month` or `year` for `/billing/checkout`. Checkout responds with a hosted Stripe checkout `url`. Portal responds with a `url`. The `/billing/webhook` endpoint is intended for Stripe only, with `Stripe-Signature` and a provider-signed raw request body. Never activate Pro using a client-side success URL alone.

### Google / Microsoft calendar OAuth

- Valid `:provider` values: `google`, `microsoft`.
- `POST /calendar/:provider/connect` returns `{"url":"https://..."}`. Open URL for delegated authorization.
- Callback `GET /calendar/:provider/callback` is for the provider, using `code` and one-time `state`.
- `GET /calendar/connections` lists existing links.
- `POST /calendar/:provider/tasks/:taskId` creates a calendar event using the task due date.
- `DELETE /calendar/:provider` disconnects your account.
- Refresh/access tokens are encrypted with AES-256-GCM using `CALENDAR_ENCRYPTION_KEY` (64 hex characters).
- Current version supports manually exporting one task at a time, **not** full two-way synchronization or conflict resolution.

## Typical status codes

| Status | Meaning |
|---|---|
| `200` | Query/update successful |
| `201` | Created |
| `202` | Registration accepted; verification pending |
| `204` | Deleted; no body |
| `400` | Invalid request, IDs, or missing calendar data |
| `401` | Missing, invalid, or expired login token |
| `403` | Forbidden role or unverified login |
| `404` | Resource not found in your workspace |
| `409` | Duplicate email |
| `429` | Too many requests |
| `502` | Provider rejected request |
| `503` | Service or integration not configured |

Error bodies typically use `{"error":"Explanation"}`. Some validation errors include additional details.

## Security and design notes

1. **Auth:** short-lived/rotatable JWT strategy and token storage hardening remain production work. Existing frontend stores JWT in sessionStorage.
2. **Tenancy:** organization-scoped queries must be maintained in every new endpoint, including reporting and callbacks.
3. **Quotas:** Standard plan enforces projects, tasks, and members at API write time.
4. **Data:** MongoDB via Mongoose; Redis available; Kafka remains optional.
5. **CORS:** set `CORS_ORIGINS` to explicit frontend origins.
6. **Email:** verify an actual sender domain and provider credentials before public signup.
7. **Rate limiting:** authentication routes use Express Rate Limit. Further IP/account-level hardening should be tested.
8. **OpenAPI:** this is an exhaustive human-readable route index, not a generated Swagger/OpenAPI contract. Adding machine-valid OpenAPI schemas and interactive Swagger UI is a separate improvement.

## Study exercises

- Login, create a project, then use its `_id` to create and update a task.
- Use an invalid MongoDB ID and inspect the 400 response.
- Create two organizations and confirm cross-tenant data access is denied.
- Connect a test Google Calendar and export a task due date.
- Change subscription state via a *signed test webhook*; never fake a production subscription from a frontend request.
- Write Supertest tests for every role gate, tenant boundary and validation failure.

## Source map

- `apps/api/src/server.ts`: HTTP routes, billing, verification, error handling.
- `apps/api/src/calendar.ts`: Google/Microsoft OAuth and calendar export.
- `apps/api/src/validation.ts`: Zod schemas and MongoDB identifier validation.
- `apps/api/src/models.ts`: Mongoose model definitions.
- `apps/api/src/auth.ts`: JWT and role checks.
- `apps/web/src/api.ts`: Axios client.
- `apps/web/src/i18n.tsx`: English/Arabic language state and translations.

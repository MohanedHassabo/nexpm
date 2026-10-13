# Architecture and technology stack

## Frameworks and infrastructure

| Layer | Implemented technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite 6, React Router 7, Material UI 6, Emotion, Lucide icons |
| Data/visuals | Axios, TanStack React Query 5, Recharts 2, date-fns 4 |
| Backend | Node.js >=22, Express 4, TypeScript, Mongoose 8, Zod 3 |
| Security | bcryptjs password hashing, jsonwebtoken, Helmet, CORS, express-rate-limit, validation |
| Database | MongoDB 7 |
| Infrastructure | Redis 7 (configured; not yet a guaranteed worker/cache feature), Docker Compose |
| Integrations | Resend API email, Google Calendar OAuth, Microsoft Graph, Stripe, optional KafkaJS |
| Automation | GitHub Actions for lint, test, builds; deployment is manual |
| Hosting options | Ubuntu VPS + HTTPS reverse proxy, optional external static frontend |

## Application topology

See [system architecture](diagrams/SYSTEM_ARCHITECTURE.md) and [deployment](diagrams/DEPLOYMENT_TOPOLOGY.md).

- `/apps/web`: single-page React frontend served by Vite in development and Nginx in Docker production.
- `/apps/api`: Express REST JSON API, authentication, CRUD, billing and integrations.
- MongoDB persists users, organizations, projects, tasks, sessions, calendar events, platform email settings and activities.
- Redis is provisioned but do not assume background email, job execution or caching is running.
- External APIs require registration and secrets; none should be exposed in frontend builds.

## Multi-tenancy and permissions

User records belong to an organization. Most core documents have `organizationId`. Workspaces and workspace-memberships give another access tier. APIs must **always** check organization scope and workspace access, including search, task lookups and attachments; existing general API routes require further security review. Organization `admin` is different from **platform administrator** (`PLATFORM_ADMIN_EMAILS` server allowlist).

## Data diagram

See [entity relationships](diagrams/DATA_MODEL.md).

## Key API routes (selected)

| Endpoint | Function |
|---|---|
| `GET /api/health`, `/api/ready` | Basic API and DB health/readiness |
| `POST /api/auth/register`, `/api/auth/login` | Account creation and sign-in |
| `POST /api/auth/verify-email`, `/api/auth/resend-verification` | Verification flow |
| `/api/projects`, `/api/tasks` | Project/task CRUD |
| `/api/workspaces` and nested routes | Workspace and membership operations |
| `/api/approvals`, `/api/approvals/:id/decision` | Approval workflow |
| `/api/my-calendar/events` | Personal calendar CRUD |
| `/api/calendar/*` | OAuth connect/disconnect; task-to-calendar push |
| `/api/search` | Project/task query |
| `/api/notifications` | Activity notification feed |
| `/api/admin/config/status` | Basic diagnostic status |
| `/api/admin/config/email` | Platform-only email settings |
| `/api/admin/config/email/test` | Send email provider test |
| `/api/billing/*` | Stripe plan, checkout, portal, webhook |

For detailed API behavior inspect the actual TypeScript route source. The earlier `docs/API_REFERENCE.md` may be stale; avoid using it as an authoritative published contract until reviewed.

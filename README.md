# NexPM — Project, Workflow & Operations Management

> **Status: v0.9.6.x development baseline. NOT production-certified.** The last user-reported build passed (`npm run build`) with three passing backend validation tests, before subsequent v0.9.6.2 search and v0.9.6.3 email-configuration patches. Those later patches have not been verified end-to-end here.

NexPM is a multi-tenant, full-stack project and operations management web application built with React/TypeScript, Node.js/Express, MongoDB, and optional integrations. It supports project/task tracking, teams and workspaces, calendar views, approvals, search, and foundational subscription and administration features.

## Documentation

| Document | Purpose |
| --- | --- |
| [Installation](docs/INSTALLATION.md) | WSL2/Ubuntu requirements, first run, tests, troubleshooting |
| [Features and status](docs/FEATURES.md) | Real capabilities vs partially implemented vs roadmap |
| [Architecture](docs/ARCHITECTURE.md) | Technology stack, modules, data layout, security boundaries |
| [Configuration](docs/CONFIGURATION.md) | Environment variables, email provider, platform admin, calendar, Stripe |
| [Deployment](docs/DEPLOYMENT.md) | GitHub publication, Ubuntu VPS, HTTPS, backups, launch gates |
| [Diagrams](docs/diagrams/README.md) | Mermaid system architecture, ER model, authentication, deployment |
| [Release status](docs/RELEASE_STATUS.md) | Verification evidence, source caveats, publication checklist |

## Quick local setup

```bash
cd ~/projects/nexpm-demo
npm install
cp .env.example .env
# Edit .env, choose a unique database, generate JWT secret, set Redis host port.
# Start shared Mongo/Redis containers using your *existing* dev compose setup.
set -a; source .env; set +a
npm run lint && npm test && npm run build
npm run seed       # disposable demo database ONLY
npm run dev
```

Web UI: `http://localhost:5173` • API check: `http://localhost:4000/api/health`.

**Never publish `.env`, secrets, database backups or seeded admin passwords.** The shipped source examples require careful production hardening and validation. See [deployment readiness](docs/DEPLOYMENT.md).

# Actual NexPM functionality — development feature inventory

**Legend:** ✅ backend/UI functionality found in source; 🟡 present but incomplete, configuration-dependent or unverified; ⏳ planned/not implemented. This is a *source-code inventory*, not an end-to-end product certification. Some components may need fixes in live use.

| Area | Feature | Status | Evidence / limitations |
|---|---|---|---|
| Dashboard | Project/task statistics, charts, activity | ✅ | React dashboard + Express project/task routes |
| Authentication | Register organization and user, login, email verification | 🟡 | JWT, bcrypt, sessions; registration email depends on provider |
| Account | Profile/password/email, sessions and preferences | 🟡 | Account API and settings UI exist; not all preference values have operational behavior |
| Avatar | Initials / avatar color | 🟡 | `User.avatarColor` exists; user reported color change does not update reliably; image upload not complete |
| Roles | Organization admin / manager / member | ✅ | API role checks; test authorization more thoroughly |
| Workspaces | Create/manage, membership, private/shared access | 🟡 | Backend endpoints present; older generic project/task routes need full per-workspace authorization audit |
| Projects | CRUD, dates/status/priority, owner/client | ✅ | REST routes + UI |
| Tasks | CRUD, assignee, status, priority, dates, tags | ✅ | REST routes + UI |
| Tasks | Subtasks, comments, checklist, dependencies | 🟡 | Models/routes exist, advanced consistency/UX needs testing |
| Tasks | Attachments | 🟡 | Attachment models/flows present; local storage needs quotas/security and production persistent storage review |
| Tasks | Custom fields | 🟡 | Definitions and task `customValues` exist; data-validation/UX completeness unverified |
| Kanban | Status columns and drag/drop | ✅ | Frontend task board |
| Gantt | Timeline, edits, zoom, drag/resize | 🟡 | Basic interactions present; durable baselines/critical-path not complete |
| Calendar | Personal event CRUD + task deadlines month view | 🟡 | `/api/my-calendar/events` and `MyCalendar.tsx`; time zones/mobile UX need testing |
| Integrations | Google / Outlook OAuth link and push task deadline | 🟡 | Requires provider credentials; not full two-way sync |
| Approvals | Request, approve/reject, activity | ✅ | API routes; org permissions on decisions |
| Notifications | Activity-based notification feed, mark read | 🟡 | Activity/read models + UI; not a full multi-channel notification worker |
| Search | Project names and task titles/descriptions | 🟡 | v0.9.6.2 patch; task clicks route to project rather than task editor; workspace permission filtering needs review |
| Planning | Milestones, templates, forms, recurrence/reminder/rule definitions | 🟡 | Definitions persisted; automatic rule execution and scheduling **not implemented** |
| Localization | English / Arabic, language switch, RTL | 🟡 | Partial translations, Arabic dialogs and RTL consistency remain user-reported issues |
| Themes | Light / dark / system | 🟡 | UI theme switching; remaining contrast/selected menu issues reported |
| Settings | Saved personal controls + defaults | 🟡 | Many values saved but functionality is not always applied throughout app |
| Admin | Diagnostics and editable Resend registration email configuration | 🟡 | v0.9.6.3 uses platform-admin allowlist + encrypted key; generic SMTP, calendar and Stripe editing UI incomplete |
| Billing | Stripe checkout/portal/webhook, Standard/Pro foundations | 🟡 | Requires real Stripe prices, webhook secret, successful full lifecycle tests |
| Audit | Activity event records, optional Kafka output | 🟡 | Event recording present; Kafka is optional, delivery guarantees/outbox not implemented |
| SaaS | Org-scoped data, quotas, workspaces | 🟡 | Basic multi-tenancy exists; penetration testing/isolation audit needed |
| Deploy | Docker Compose, Dockerfiles, GitHub Actions | 🟡 | Build/test workflow exists; automated deployment, HA, monitoring/backups not included |
| Advanced | Persistent Gantt baselines, critical path, two-way calendar sync | ⏳ | Not complete |
| Advanced | Working scheduled reminders, recurrence automation, form/rule engine | ⏳ | Definitions only |
| Security | Production-ready invitations/SSO, comprehensive tenancy tests | ⏳ | Needs production work |

### Scope restrictions

Do not describe NexPM as enterprise-ready, fully localized, complete no-code workflow automation or a fully operational hosted SaaS until those features are implemented and independently verified. Runtime screenshots and previously discussed requirements are not proof of implementation.

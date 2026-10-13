# NexPM subtasks & attachments — developer reference

Endpoints require `Authorization: Bearer <token>`; organization is resolved from the verified token, never from client input.

- `GET /api/tasks/:id/subtasks` — list direct child tasks.
- `POST /api/tasks/:id/subtasks` with JSON `{"title":"Draft proposal"}` — create child task.
- `PATCH /api/tasks/:id` — accepts `parentTaskId` (Mongo ID or null); rejects cross-project parents and circular ancestry.
- `GET /api/tasks/:id/attachments` — list metadata (without storage paths).
- `POST /api/tasks/:id/attachments` — raw `application/octet-stream` body with URL-encoded `X-File-Name` and `X-File-Type` headers; size up to 10 MB; permitted MIME allowlist.
- `GET /api/tasks/:taskId/attachments/:attachmentId` — authorized download.
- `DELETE /api/tasks/:taskId/attachments/:attachmentId` — authorized removal.

Files are placed under `TASK_UPLOAD_DIR`, defaulting to `uploads/tasks` relative to the API process working directory. **Configure a persistent, backed-up and non-public directory on Ubuntu VPS.** Do not serve it via nginx static routes. The uploaded bytes are stored on disk; MongoDB holds metadata. For multi-replica/cloud deployments, replace local storage with an authenticated private S3-compatible object store.

Security review before production: malware scanning, total per-tenant storage quotas, signed requests/CSRF protections as appropriate, file signature validation, rate limiting, auditing, orphan cleanup, and end-to-end tests. `application/octet-stream` is accepted only as upload transport; `X-File-Type` must be allowlisted. This implementation is a development feature, not production-certified file handling.

The new task field `parentTaskId` is optional; existing tasks remain valid. Deleting a parent detaches its direct children, rather than deleting them. Attachment metadata and files need explicit cleanup on task deletion in a subsequent release.

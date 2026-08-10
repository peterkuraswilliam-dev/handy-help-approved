# Database migrations

Purpose: define migration discipline.

1. Inspect actual schema and pending changes.
2. Write a forward migration with deterministic names.
3. Add constraints/indexes before relying on application validation.
4. Enable RLS and add least-privilege policies in the same release as each exposed table.
5. Add storage policies/functions/triggers explicitly.
6. Backfill safely and idempotently; avoid long locks where possible.
7. Regenerate typed clients if used.
8. Test owner, unrelated user, admin and service-role cases.
9. Document rollback/mitigation and data compatibility.
10. Never edit already-applied production migration history to disguise a change.

No existing migrations were accessible during documentation creation.

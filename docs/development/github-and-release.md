# GitHub and release workflow

Purpose: define safe change/release practice.

Never work directly on `main`. Start from an up-to-date base using the repository's established workflow; if none exists, use `codex/<short-task>`. Keep commits scoped and do not mix unrelated user changes.

Pull requests should link the feature spec/decision, describe migrations/RLS/storage/privacy, list tests and include rollout/rollback. Protect `main` with review and required checks where available. Preview/staging verification precedes production. Production database/deploy actions require explicit user authority.

Release checklist: migration compatibility, policies enabled, secrets/config present, monitoring/errors, accessibility/mobile smoke, notification behaviour, data backfill, rollback/mitigation and docs/manifest updated.

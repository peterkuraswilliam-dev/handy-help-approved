# Admin operations

Purpose: consolidate admin queues, controls and audit expectations.

## Current operations

Owner/admin contractor invitation creation/list/revocation; application queue/search/filter/sort; evidence review; private notes/checklist; request information; approve/reject; suspend/restore; expiry management.

Contractor invitation and application approval are separate privileged actions. An invitation permits onboarding only and must never create approval automatically. See [contractor invitations](../features/contractor-invitations.md).

## Future operations

Job moderation, match oversight, message/contact flags, user/contractor management, reviews, complaints, Job Rescue, reports and configuration.

## Separation of duties

Super-admin-only candidates include granting admin roles, changing high-risk policy/configuration, viewing especially sensitive evidence, exporting data and overriding another admin's consequential decision.

Every privileged mutation requires actor, timestamp, target, old/new state and reason. See [audit log](../security/moderation-and-audit.md).

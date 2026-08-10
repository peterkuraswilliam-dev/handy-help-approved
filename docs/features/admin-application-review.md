# Feature: Admin application review

## Status

Current build; queue/detail concepts evidenced, implementation unverified.

## Implementation Status

Ready for the approved implementation slice below, subject to first inspecting the repository and verifying the existing role, route, schema and policy implementation. Advanced review operations remain excluded.

## Goal

Enable authorised admins to review applications consistently and make secure, explainable decisions.

## Why It Exists

Human review is the primary trust and moderation control.

## Users

Admin, super admin; applicants receive outcomes but cannot access admin tools.

## Confirmed Decisions

- Only authorised admins and super admins may access application-review data and actions.
- Human admin approval is required; automatic approval is prohibited.
- The core review flow includes a queue, application detail, private review notes/checklist, request-more-information, approve, reject and decision history.
- Approval and rejection must be enforced server-side and recorded with reviewer, time and reason.
- Applicants receive only sanitised requests and outcomes, never private admin notes.
- Suspend and restore are confirmed contractor-management capabilities but are not part of the first approved implementation slice.

## Working Proposals

Guided review mode, assignment/locking, response-time metrics and export.

## Open Questions

Admin grant process, two-person review for high-risk categories, rejection appeal, suspension standard and reason visibility.

## In Scope

Application queue/detail, evidence access, notes/checklist, requests, decisions, expiry warning and audit.

## Approved Implementation Slice

- Inspect existing admin-role assignment, route protection, review UI, schema, RLS, Storage and tests before editing.
- Create or complete the admin application queue and application-detail view.
- Allow an authorised admin to review private application evidence using time-limited access.
- Support request-information, approve and reject actions with mandatory reasons where required.
- Enforce role checks and valid state transitions in trusted server/database layers, not only in the frontend.
- Record immutable decision events containing the actor, time, action and reason.
- Ensure applicants see only their permitted status, request and decision information.
- Add or update migrations, policies, validation and tests only after verifying what already exists.

## Out of Scope

Automatic approval, customer job matching and advanced BI.

## Do Not Implement Yet

- Automatic approval or AI-only approval decisions.
- Suspend/restore controls until suspension and reason-visibility rules are confirmed.
- Two-person review, assignment/locking, exports or reviewer performance dashboards.
- Rejection appeals until the appeal policy is confirmed.
- Customer job moderation, matching or marketplace administration.
- Any client-controlled mechanism for granting or changing admin roles.

## User Flow

Open queue → filter/search → claim/open application → review sections/documents/history → request information or decide → record reason → notify applicant.

## Screens and Routes

Expected admin queue, application detail tabs, decision dialogue and contractor management view; real routes require code audit.

## Business Rules

Notes are admin-only; reasons are mandatory for rejection/suspension; state transitions are validated; approval must record reviewer/time/checklist version.

## States and Transitions

See [states](../product/states.md); every transition creates an immutable event.

## Database Changes

Proposed review_assignments, admin_notes, checklist_responses and decision_events. See [tables](../database/tables.md).

## Supabase RLS

Only authorised admins read notes/all applications; applicant sees only sanitised request/decision fields. Role checks must be server/database enforced.

## Storage Requirements

Short-lived signed document URLs and no indexing/caching of private files.

## API / Server Actions

Transactional request-information, approve, reject, suspend and restore operations with audit insert.

## Notifications

Applicant status change; admin alerts for submission/resubmission/expiry. Provider open.

## Security

Admin route protection alone is insufficient; verify role per query/action, prevent note leakage and log privileged access.

## Privacy

Show only necessary evidence; avoid copying sensitive file contents into notes or analytics.

## Moderation

Use reason codes plus free-text context; high-impact decisions need documented review.

## Analytics

Queue volume, age, time-to-first-review, requests per application and decisions by category—not reviewer league tables without policy.

## Edge Cases

Two admins decide concurrently, role revoked mid-session, document expires, applicant deletes/replaces evidence, partial outage after decision.

## Acceptance Criteria

- Public, signed-out and non-admin users cannot read admin review data, notes or private evidence.
- An authorised admin can view the queue and the permitted detail for a submitted application.
- An authorised admin can request information, approve or reject through validated server-side actions.
- Frontend route access or modified client requests cannot grant approval or admin permissions.
- Invalid and concurrent conflicting transitions are rejected without creating contradictory outcomes.
- Every privileged action creates the required immutable audit event.
- The applicant receives only the intended request, status or decision information.
- Role/RLS negative tests, transition tests, note-isolation tests and signed-URL expiry tests pass.

## Testing

Role/RLS negative tests, state concurrency, note isolation, signed URL expiry, search/filter states and keyboard/mobile use.

## Dependencies

[Invitation-only contractor access](contractor-invitations.md), onboarding, auth/roles, RLS, storage and audit log.

## Rollout

Single-admin pilot, then add role management and operational checks before additional admins.

## Future Ideas

Dual approval, workload assignment and policy-versioned checklists.

## Decision History

28 July 2026 staged queue; 31 July feature roadmap; 7 August hardening priority.

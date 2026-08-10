# Feature: Job lifecycle

## Status

Future marketplace working proposal.

## Goal

Give both sides and admin a shared, auditable view from approved job to reviewed completion.

## Why It Exists

Clear stages reduce confusion and enable verified reviews, reliability signals and Job Rescue.

## Users

Customer, selected contractor, admin.

## Confirmed Decisions

No detailed lifecycle is confirmed beyond job admin approval and contact protection.

## Working Proposals

Approved → matching → quotes → selected → scheduled → in progress → completed → customer confirmed → reviewed, with cancellation/dispute branches.

## Open Questions

Who can trigger each state, timeouts, evidence, no-response handling, completion confirmation and effect of payment.

## In Scope

State timeline, actor/reason, schedule, completion evidence and admin intervention.

## Out of Scope

Untracked arbitrary status edits and automatic blame/reliability penalties without review.

## User Flow

See proposed sequence in [states](../product/states.md); each action shows its effect and next step.

## Screens and Routes

Customer/contractor job detail, timeline, next-action card and admin oversight.

## Business Rules

Only parties/admin act; transitions are conditional; cancellation/dispute never erases history; completion and review are distinct.

## States and Transitions

Use an explicit transition table during implementation, including authority and side effects.

## Database Changes

Proposed jobs.current_status plus immutable job_events; schedule/completion evidence may have separate resources.

## Supabase RLS

Parties see their job/timeline; unrelated users none; matched-only access ends according to policy; server/admin controls privileged transitions.

## Storage Requirements

Private completion media accessible to parties/admin, with retention policy.

## API / Server Actions

Transition command validates actor, current state, required evidence and idempotency in a transaction.

## Notifications

Action-required, scheduled reminder, status change, completion confirmation and overdue follow-up.

## Security

Prevent forged actor/status, event deletion and media leakage.

## Privacy

Timeline is job-party private; aggregate reliability must avoid unsafe public inference.

## Moderation

Admin overrides require reason and visible audit; disputes pause relevant automatic transitions.

## Analytics

Time in state, cancellation, completion and rescue rates.

## Edge Cases

Reschedule, partial work, contractor replacement, offline agreement, abandonment, duplicate clicks and dispute after completion.

## Acceptance Criteria

Invalid transitions fail; events are immutable; both parties see consistent current state; admin overrides are explained/audited.

## Testing

Transition matrix, concurrency/idempotency, role/RLS, timeouts, cancellation/dispute and notification side effects.

## Dependencies

Jobs, matching, booking decision, messaging, notifications, reviews and disputes.

## Rollout

Manual/admin-assisted lifecycle in pilot before automation.

## Future Ideas

Calendar integration and structured milestones for larger jobs.

## Decision History

1 August 2026 lifecycle infographic; all detailed transition rules remain proposals.

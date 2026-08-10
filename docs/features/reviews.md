# Feature: Verified reviews

## Status

Future marketplace working proposal.

## Goal

Collect trustworthy feedback tied to real completed jobs.

## Why It Exists

Verified reviews build reputation while reducing fake or unrelated ratings.

## Users

Customer reviewer, reviewed contractor, admin; contractor-to-customer review is open.

## Confirmed Decisions

No final review rules are confirmed.

## Working Proposals

Customer reviews after completion confirmation; rating, text and optional photos; moderation and contractor response.

## Open Questions

Who can review, trigger event, edit window, categories, anonymity, public display, appeals and whether review closes the job.

## In Scope

Eligibility, one review per eligible side/job, moderation, response and public-safe projection.

## Out of Scope

Unverified reviews, paid review placement and deletion solely because feedback is negative.

## User Flow

Eligible completion → review prompt → submit → moderation if flagged → publish → response/appeal.

## Screens and Routes

Review form, confirmation, profile list, response and admin moderation.

## Business Rules

Eligibility is server-derived; disclose edits; separate safety reports from public reviews; preserve audit.

## States and Transitions

draft → submitted → published/held/rejected → edited/removed; appeal branch.

## Database Changes

Proposed reviews, review_responses, moderation_events and aggregate view.

## Supabase RLS

Eligible author creates own review; public reads published safe projection; reviewed contractor cannot edit review; admin moderates.

## Storage Requirements

Review media moderated and public only after approval; original/private evidence separate.

## API / Server Actions

Verify job eligibility/uniqueness; calculate aggregates server/database-side.

## Notifications

Review invitation, publication/hold, response and moderation outcome.

## Security

Prevent duplicate/self reviews, retaliation, identity leakage and aggregate manipulation.

## Privacy

Define display name/location granularity; no job address or protected contact in review content.

## Moderation

Content policy, defamation/safety escalation, evidence and appeal path.

## Analytics

Invitation-to-review, rating distribution, moderation and appeal outcomes.

## Edge Cases

Disputed job, cancellation after work, contractor removed, shared household, edited review and legal removal request.

## Acceptance Criteria

Only eligible job parties review once; unauthorised users cannot create/edit; public sees only published safe content; moderation is auditable.

## Testing

Eligibility/RLS, duplicates, moderation, aggregate correctness, XSS and privacy redaction.

## Dependencies

Job lifecycle, profiles, moderation and notifications.

## Rollout

Moderate all pilot reviews manually.

## Future Ideas

Category ratings and balanced two-sided feedback after policy review.

## Decision History

1 August 2026 verified completed-job review proposal; trigger remained debated.

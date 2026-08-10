# Feature: Matching and quotes

## Status

Future marketplace working proposal.

## Goal

Connect each approved job with a small number of suitable approved contractors and let customers compare clear offers.

## Why It Exists

Limited matching avoids bidding wars, wasted leads and overwhelming customers.

## Users

Customer owner, eligible/matched contractor, admin.

## Confirmed Decisions

The preferred product is managed matching rather than an open directory or lead-credit market.

## Working Proposals

Up to three suitable contractors per job; suitability uses service, area, availability and approval; contractors express interest then quote.

## Open Questions

Who chooses matches, ranking/fairness rules, response windows, quote structure, amendments, withdrawal and whether any fee follows success.

## In Scope

Eligibility, admin/system shortlist, invite/interest, quote, customer comparison and selection.

## Out of Scope

Open bidding, selling the same lead widely, unapproved contractors and opaque pay-to-rank.

## User Flow

Approved job → eligible pool → up to three invitations → interest/decline → quote → customer comparison → select contractor.

## Screens and Routes

Contractor opportunities, job detail safe view, quote form, customer quote comparison and admin match oversight.

## Business Rules

Only approved/current contractors qualify; invite count is capped; declines/expiry free capacity; paid placement must not override safety/suitability.

## States and Transitions

match: invited → viewed → interested/declined/expired; quote: draft → submitted → revised/withdrawn/accepted/expired.

## Database Changes

Proposed job_matches, contractor_interests, quotes, quote_items and matching_decisions.

## Supabase RLS

Only job owner sees all their quotes; contractor sees own match/quote; matched contractor sees redacted job; unrelated contractors see none; admin oversees.

## Storage Requirements

Quote attachments private to job parties/admin.

## API / Server Actions

Eligibility and cap enforcement must be transactional server/database logic; acceptance must prevent double selection.

## Notifications

Invite, expiry reminder, interest, quote submitted/revised/withdrawn and selection outcome.

## Security

Prevent enumeration, match-cap races, forged quotes and early contact leakage.

## Privacy

Release only information needed to assess/quote; exact address/contact remains protected until defined event.

## Moderation

Admin can remove unsuitable match/quote with reason and audit.

## Analytics

Eligibility, invitation response, quote conversion, time-to-quote and fairness distribution.

## Edge Cases

Fewer than three eligible contractors, all decline, approval expires, customer edits job, quote changes after selection and contractor conflict of interest.

## Acceptance Criteria

Cap cannot be bypassed; only authorised parties view jobs/quotes; one contractor can be selected; all decisions/transitions are traceable.

## Testing

RLS matrix, cap concurrency, expiry, single-selection race, redaction and notification deduplication.

## Dependencies

Approved jobs, contractor services/areas, profiles, contact protection, lifecycle and notifications.

## Rollout

Admin-curated matches first; automate only after fairness and quality evidence.

## Future Ideas

Reliability signals and explainable recommendations without paid ranking.

## Decision History

1 August 2026 up-to-three and no bidding-war direction.

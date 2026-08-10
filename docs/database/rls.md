# Supabase Row Level Security

Purpose: define minimum policy outcomes. This is a requirements matrix, not executable SQL.

## Principles

- Enable RLS on every client-accessible table.
- Default deny; grant the smallest row/action set.
- Derive ownership/relationship from trusted foreign keys and `auth.uid()`.
- Admin status must be server-controlled, not user-editable metadata.
- Storage uses equivalent object-path/bucket policies.
- Service role stays server-only and operations remain validated/audited.

## Access matrix

Legend: R = read safe fields, C/U = create/update within state rules, A = authorised admin access, — = none.

| Resource | Public/signed-out | Customer owner | Unrelated customer | Contractor owner/applicant | Unrelated contractor | Matched contractor | Selected contractor | Admin | Super admin | Trusted server |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Contractor invitation rows | — | — | — | — | — | — | — | A create/list/revoke | A | validate/consume scoped token |
| Public contractor projection | R published | R | R | R own/published | R | R | R | A | A | scoped |
| Contractor application | — | — | — | R/C/U own allowed states | — | — | — | A | A | scoped |
| Private application docs | — | — | — | R/C/U own allowed | — | — | — | A short-lived | A | scoped |
| Admin notes/checklists | — | — | — | — | — | — | — | A | A | scoped |
| Customer job full/private | — | R/C/U own allowed | — | — | — | redacted R only | party R after selection | A | A | scoped |
| Job media | — | own R/C/U | — | — | — | permitted redacted/signed R | party R | A | A | scoped |
| Match/interest | — | R own job matches | — | R own relationship | — | R/C/U own match | R | A | A | scoped |
| Quote | — | R own job quotes/select | — | R/C/U own quote | — | own quote only | own/accepted | A | A | scoped |
| Booking/payment summary | — | party R/actions | — | — | — | — | party R/actions | A | A | provider/server write |
| Conversation/messages | — | participant only | — | participant only | — | participant if authorised | participant | policy-limited A | A | scoped |
| Review draft | — | eligible own | — | eligible own if enabled | — | — | party as policy | moderation A | A | scoped |
| Published review projection | R | R | R | R | R | R | R | A | A | scoped |
| Dispute/case | — | case-party permitted | — | case-party permitted | — | as case party | case party | A | A | scoped |
| Audit events | — | limited own timeline only if projected | — | limited own timeline if projected | — | — | — | role-scoped A | A | append/scoped |

## Never frontend-only

Role/admin checks, invitation creation/token validation/consumption, contractor-role assignment, application/job state transitions, match cap, single contractor selection, contact release, quote ownership, review eligibility, payment confirmation, audit creation and public-safe field selection must be enforced by database policies/constraints and/or trusted server operations.

Signed-out invitation acceptance must not receive general table access. Use a narrowly scoped trusted operation that validates the supplied token digest and state without exposing recipient data or allowing invitation enumeration.

Test the full matrix with distinct users. A successful UI test is not evidence that direct API access is safe.

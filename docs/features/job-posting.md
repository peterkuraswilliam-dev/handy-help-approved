# Feature: Customer job posting and approval

## Status

Future marketplace working proposal.

## Goal

Collect clear, genuine customer jobs and approve them before contractors see them.

## Why It Exists

Better job detail reduces wasted time, and verification protects contractors from fake or unsafe leads.

## Users

Customer owner, admin, matched contractor.

## Confirmed Decisions

Every job requires admin approval; premature contact information must be protected/flagged.

## Working Proposals

Guided category questions, photos, location, timing, access, materials and optional budget; small jobs welcome.

## Open Questions

Minimum customer verification, exact location visibility, budget requirement, urgent/safety exclusions and moderation SLA.

## In Scope

Draft, submit, information request, admin decision, customer edit/resubmit and safe contractor view.

## Out of Scope

Emergency services, illegal/unsafe work, automatic publishing and guaranteed availability.

## User Flow

Customer account → guided job → upload photos → submit → admin checks → request/approve/reject → matching.

## Screens and Routes

Job wizard, preview, status, request response and admin moderation queue; routes open.

## Business Rules

Only owner edits draft; approved job has a redacted contractor projection; material edits after approval trigger re-review.

## States and Transitions

See [states](../product/states.md).

## Database Changes

Proposed jobs, job_answers, job_media, job_moderation_events and safe job projection.

## Supabase RLS

Owner sees own job; unrelated users see none; matched contractors see only approved, redacted fields; admins moderate.

## Storage Requirements

Private job-media bucket; matched access via policy/signed URLs; remove metadata where appropriate.

## API / Server Actions

Submission/moderation/redaction scan must run server-side; client-only regex is insufficient.

## Notifications

Submission, information request, decision and later match activity.

## Security

Moderate unsafe content, contact data, malware and precise-address exposure.

## Privacy

Show approximate location until selection; define when exact address is released.

## Moderation

Human approval, reason codes, prohibited-work policy and contact-sharing flags.

## Analytics

Completion, moderation time, rejection reasons, matching eligibility and abandonment.

## Edge Cases

Multiple properties, tenants without authority, duplicate jobs, emergency hazards, cancellation during review and edits after matching.

## Acceptance Criteria

No unapproved job reaches contractors; unrelated contractors cannot query jobs; redacted content contains no protected contact details; every decision is auditable.

## Testing

Ownership/RLS, redaction evasion, uploads, state changes, location privacy, mobile and accessibility.

## Dependencies

Customer auth, taxonomy, admin moderation, contact protection, storage and matching.

## Rollout

Small invited pilot with manual review of every job and match.

## Future Ideas

Reusable property details and category-specific smart forms.

## Decision History

25 July admin approval rule; 1 August managed job lifecycle proposal; 5 August contact protection.

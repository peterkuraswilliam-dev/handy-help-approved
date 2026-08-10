# Feature: Approved contractor profiles

## Status

Working proposal/current follow-on; visual mock-ups exist, code unverified.

## Goal

Present a trustworthy, public-safe summary of an approved contractor without leaking application evidence.

## Why It Exists

Customers need transparent services, coverage and verification context; contractors need a credible presence.

## Users

Public, customer, approved contractor, admin.

## Confirmed Decisions

Only approved contractors may receive an approved public profile; approval must include a disclaimer and must not reveal private admin/application material.

## Working Proposals

Business summary, services, areas, gallery, insurance validity, qualifications, approval date, share link and verified badge.

## Open Questions

Whether phone/email can ever be public, which documents may be summarised, update/reapproval workflow and badge wording.

## In Scope

Public-safe projection, contractor edits subject to moderation, gallery and current approval/expiry state.

## Out of Scope

Publishing raw documents, private contact by default, unverified reviews or guaranteed claims.

## User Flow

Approval → contractor reviews profile → admin/policy publishes safe fields → customer views → protected contact/booking path.

## Screens and Routes

Public profile and contractor profile editor; exact routes open.

## Business Rules

Suspended/expired profiles lose approved prominence; only derived verification facts appear; potentially misleading changes may require review.

## States and Transitions

draft → pending_publication → published → hidden/suspended; linked to approval state.

## Database Changes

Proposed contractor_profiles, contractor_services, service_areas, portfolio_items and a public-safe view.

## Supabase RLS

Public reads only published safe projection; contractor edits only own draft/editable fields; admin moderates.

## Storage Requirements

Public portfolio images require moderation and separate paths/bucket from private evidence.

## API / Server Actions

Publish/unpublish and sensitive profile updates require server-authorised policy checks.

## Notifications

Profile published, change rejected, evidence/approval nearing expiry.

## Security

Strip EXIF where appropriate, sanitise text, prevent bucket path guessing and never derive public access from obscurity.

## Privacy

Business/public fields need explicit consent; private addresses, identity and policy numbers remain private.

## Moderation

Moderate images/claims and provide report flow in later marketplace.

## Analytics

Profile views and protected conversion events; do not expose visitor identity to public contractors without lawful basis.

## Edge Cases

Insurance expires, business changes owner, profile edited while suspended, duplicate profiles, contractor leaves platform.

## Acceptance Criteria

Only approved/current public-safe data is readable anonymously; raw evidence and private contact are inaccessible; suspension updates visibility promptly.

## Testing

Public projection, RLS, expiry, image moderation, responsive/accessibility and XSS.

## Dependencies

Onboarding approval, storage, contact protection and service taxonomy.

## Rollout

Publish invited profiles after contractor confirmation and legal copy review.

## Future Ideas

Verified completed-job gallery and reputation signals.

## Decision History

31 July profile proposal; 1 August mock-ups; 5 August contact protection created unresolved conflict with public contacts.

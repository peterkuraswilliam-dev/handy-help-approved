# Feature: Contractor onboarding

## Status

Current build; parts evidenced as built/in progress, but code was unavailable for verification.

## Implementation Status

Ready for the approved implementation slice below, subject to first inspecting the repository and verifying what already exists. This does not approve the complete feature or any working proposal.

## Goal

Collect sufficient business, service-area, work-history, insurance and qualification information for a human admin to make a traceable approval decision.

## Why It Exists

Approved contractors are the trust foundation for both the current launch and later marketplace.

## Users

Contractor applicant, admin, super admin.

## Confirmed Decisions

- Contractors may begin onboarding only through a valid invitation created by the app owner or an authorised admin; there is no public contractor sign-up.
- Contractors must create or use their own authenticated account to apply.
- Every contractor application requires a human admin approval decision.
- Unapproved contractors cannot accept jobs or act as approved contractors.
- Sensitive application documents must never be publicly accessible.
- The current documented stack is React, TypeScript, Tailwind and Supabase, subject to repository verification.
- Applications support admin information requests and applicant resubmission.

## Working Proposals

Multi-step form, completion percentage, saved drafts, category-specific evidence and expiry reminders.

## Open Questions

Required evidence per category, identity checks, company/sole-trader fields, exact statuses, retention and appeal rules.

## In Scope

Own application, business details, services, locations, photos/documents, consent, submit, status, information request and resubmit.

## Approved Implementation Slice

- Inspect the existing authentication, onboarding, admin, database, Storage and test implementation before editing.
- Enforce the invitation-only access gate defined in [contractor invitations](contractor-invitations.md) before allowing a contractor to create/start an application.
- Create or complete the contractor onboarding form for the confirmed application fields.
- Allow a contractor to save, view and submit only their own application.
- Create or complete the admin application-review screen, including request-information, approve and reject actions.
- Add or update the required database migrations, constraints and generated types after verifying the existing schema.
- Add or update private document Storage policies and Supabase RLS policies.
- Add server-side validation, state-transition enforcement, audit events and relevant tests.
- Update this specification and specialist database/security documents with the verified implementation result.

## Out of Scope

Customer jobs, payments, marketplace quotes, reviews and public directory search.

## Do Not Implement Yet

- Customer accounts or customer job posting.
- Contractor payments, subscriptions or marketplace fees.
- Marketplace matching, quotes, booking, reviews or disputes.
- Automatic contractor approval.
- Automatic document-expiry reminders.
- Category-specific mandatory evidence until the required evidence is confirmed.
- Public access to application data or sensitive documents.
- Any public contractor self-registration path or invitation bypass.

## User Flow

Receive owner/admin invitation → open secure link → create/sign in to own account → draft application → add information/files → validate → submit → await review → respond/resubmit if requested → receive decision.

## Screens and Routes

Routes are unverified. Expected screens: invitation acceptance/sign-in, application steps, review/consent, status, request response and decision outcome.

## Business Rules

Only the owner edits a draft; submission freezes reviewed fields or creates a revision; every decision has actor/time/reason; approval is not a workmanship guarantee.

## States and Transitions

See [core states](../product/states.md). Invalid or out-of-order transitions must fail server-side.

## Database Changes

Proposed resources: profiles, contractor_applications, application_services, service_areas, application_documents, information_requests and decision_events. See [schema](../database/schema.md).

## Supabase RLS

Applicant may access only their application/private files; admins may review; public has no application access. See [RLS](../database/rls.md).

## Storage Requirements

Private bucket, owner-scoped paths, MIME/size limits, malware-risk handling, signed URLs and audit of admin access. See [storage](../database/storage.md).

## API / Server Actions

Submit, request information, resubmit and decide must validate identity, role, current state and required fields transactionally.

## Notifications

Submission, information request, resubmission and decision. Email remains deferred until a provider is selected.

## Security

No service-role key in clients; defend against IDOR, file spoofing, XSS in descriptions and role escalation.

## Privacy

Collect the minimum evidence; distinguish public profile fields from private application data.

## Moderation

Human admin decision and suspension; preserve reason/history.

## Analytics

Completion, abandonment, review time, information requests and decision rate; no sensitive document content.

## Edge Cases

Duplicate businesses, expired insurance during review, file replacement, applicant loses email access, resubmission after rejection, concurrent admin review.

## Acceptance Criteria

- An authenticated contractor can create, save, review and submit their own application.
- A contractor cannot create or start onboarding without a valid owner/admin invitation.
- An unrelated user cannot read or modify the application or its documents.
- An authorised admin can request information, approve or reject an application.
- Approval and rejection are authorised and enforced server-side; frontend controls alone cannot grant approval.
- An unapproved contractor cannot access approved-contractor capabilities or accept jobs.
- All material state changes record actor, time and reason in an auditable history.
- Private application files never become public and are accessed only through authorised, time-limited mechanisms.
- Relevant validation, RLS, negative-permission, state-transition and accessibility tests pass.

## Testing

Form validation, ownership/RLS matrix, uploads, concurrent transitions, expiry boundaries, mobile and accessibility.

## Dependencies

[Invitation-only contractor access](contractor-invitations.md), authentication, roles, storage, audit log, notification framework and category taxonomy.

## Rollout

Pilot with invited Aberdeenshire contractors; manually verify outcomes before broad recruitment.

## Future Ideas

Reusable verification renewals, automated reminders and integrations with authoritative registers.

## Decision History

25 July 2026 onboarding-only V1; 28 July admin workflow; 3 August invitation-only contractor access; 7 August security/QA finish line; 10 August invitation gate incorporated into the approved slice.

# Feature: Invitation-only contractor access

## Status

Current confirmed launch requirement; repository audit found no invitation route, table, generated type or application implementation. The existing public contractor sign-up flow conflicts with this requirement.

## Implementation Status

Ready for the approved implementation slice below, subject to first inspecting the repository and verifying what already exists. Invitation delivery automation is not approved until a provider is selected.

## Goal

Ensure that only contractors deliberately invited by the app owner or an authorised admin can create a contractor account and begin onboarding.

## Why It Exists

The first Handy Help launch is a controlled pilot for trusted local contractors. Public contractor registration would bypass that supply-quality gate and increase spam, impersonation and admin workload.

## Users

App owner, admin, invited contractor and super admin.

## Confirmed Decisions

- Contractor access is invitation-only for the current launch.
- There is no public contractor sign-up.
- Only the app owner or an authorised admin may create a contractor invitation.
- An invitation contains a secure sign-up link for the intended contractor.
- The contractor creates their own authenticated account through that link before completing onboarding.
- An invitation permits onboarding only; it does not approve the contractor.
- Every submitted contractor application still requires a separate owner/admin approval or rejection decision.
- Only approved contractors receive the Approved Contractor badge and approved-contractor capabilities.

## Working Proposals

Invite list with pending/accepted/revoked/expired filters, optional personal message, resend, copy-link action and automatic expiry reminders.

## Open Questions

- How long should an invitation remain valid?
- May admins resend an existing invitation, or must they revoke and replace it?
- Should an invitation be restricted to a pre-entered email address?
- What email provider and sender identity will deliver invitations?
- Can the owner override or restore a revoked/expired invitation?
- What rate limits and maximum outstanding invitations apply per admin?

## In Scope

Authorised invitation creation, secure token/link validation, invited contractor account creation, invitation consumption, contractor-role assignment, revocation, audit history and safe invalid-link handling.

## Approved Implementation Slice

- Inspect the existing authentication, role, onboarding, admin, database and test implementation before editing.
- Remove or disable public entry points that create contractor accounts, without blocking future customer registration.
- Add an owner/admin-only invitation action and an admin invitation list.
- Generate invitation tokens with a cryptographically secure server-side mechanism; store only a non-reversible token digest.
- Validate invitation state server-side before contractor account creation and consume it transactionally so it cannot be reused.
- Assign contractor access through trusted server/database logic, never through client-editable metadata.
- Support owner/admin revocation and audit invitation creation, consumption and revocation.
- Add or update migrations, constraints, indexes, RLS, generated types and negative-permission tests after verifying the existing schema.
- Link successful invitation acceptance into the contractor onboarding flow.
- Update this specification and the owning authentication/database/security documents with the verified implementation result.

## Out of Scope

Public contractor self-registration, automatic contractor approval, customer invitations, marketplace/job invitations, payments and general email-notification automation.

## Do Not Implement Yet

- Public contractor sign-up or an open contractor-registration API.
- Automatic contractor approval or automatic Approved Contractor badges.
- A guessed invitation lifetime, resend policy, email provider or sender identity.
- Client-generated or plaintext-stored invitation tokens.
- Client-controlled contractor/admin role assignment.
- Reusing an accepted or revoked invitation.
- Customer account registration changes unless required to preserve an existing customer flow.

## User Flow

Owner/admin creates invitation → secure link is generated → contractor receives link → server validates invitation → contractor creates account → invitation is consumed → contractor begins onboarding → contractor submits application → owner/admin reviews → approve or reject → approved contractor receives badge.

Invalid, consumed, revoked or expired links must show a safe recovery message without revealing whether an account exists.

## Screens and Routes

No invitation-management or invitation-acceptance route exists. `/auth` currently exposes direct contractor sign-up and `/become-approved` links to that mode. Required future surfaces are an owner/admin invitation list and create/revoke control, an invitation acceptance/sign-up screen, and invalid/consumed-link states; reuse the repository's TanStack Start auth conventions.

## Business Rules

- Invitation authority and contractor approval authority are privileged operations.
- Invitation acceptance grants access to apply, not permission to accept work.
- The invitation token must not appear in analytics, logs, support screenshots or long-lived client storage.
- The invited contractor must control the account credentials created through the link.
- Material actions record actor, target, time, result and reason where applicable.

## States and Transitions

See [core states](../product/states.md). At minimum, an invitation may be pending, accepted or revoked. Expiry exists only when a lifetime is confirmed. Consumption/revocation must be atomic and enforced server-side.

## Database Changes

Proposed resource: `contractor_invitations`, linked to the inviting privileged user and, after acceptance, the created contractor account. Store a token digest rather than the raw token. See [tables](../database/tables.md) and [schema](../database/schema.md).

## Supabase RLS

Signed-out users may not list invitations. An invitation-acceptance server operation may validate a supplied token through a narrowly scoped trusted path. Contractors may not create, browse or alter invitations. Owner/admin access must use a server-controlled role and be audited. See [RLS](../database/rls.md).

## Storage Requirements

None for the invitation itself. Contractor files uploaded after acceptance follow the private application-document rules in [storage](../database/storage.md).

## API / Server Actions

Create invitation, validate/accept invitation and revoke invitation. Each action must validate authority/state server-side, avoid account-enumeration responses and apply rate limits. Acceptance should create/link the contractor identity and consume the invitation transactionally.

## Notifications

The invitation must provide a secure sign-up link. Automated email delivery remains deferred until a provider and sender identity are selected; do not silently introduce a provider.

## Security

Use high-entropy tokens, digest-at-rest storage, constant-time comparison where applicable, HTTPS, single-use consumption, revocation, rate limiting and audit events. Prevent open redirects, token leakage, role escalation, replay and account enumeration.

## Privacy

Collect only the contact details needed to address the invitation. Do not expose invitation lists, recipient details, tokens or acceptance history publicly.

## Moderation

Owner/admin may revoke an unused invitation. Invitation acceptance does not bypass human application review, suspension or later contractor-management controls.

## Analytics

Count invitations created, accepted, revoked and invalid attempts without recording raw tokens or unnecessary recipient details. Expiry metrics wait until an expiry rule is confirmed.

## Edge Cases

Already-used link, revoked link, future expired link, contractor already has an account, email mismatch, duplicate outstanding invitations, admin loses role after creating an invite, concurrent acceptance, copied link and user abandoning sign-up.

## Acceptance Criteria

- No signed-out visitor can create a contractor account through a public contractor sign-up flow.
- An authorised owner/admin can create a secure contractor invitation.
- A non-admin, contractor or unrelated user cannot create, list, read or revoke invitations.
- A valid unused invitation permits the intended contractor to create/link an account and enter onboarding.
- Invitation acceptance does not mark the contractor approved or grant approved-contractor capabilities.
- Accepted or revoked invitations cannot be reused.
- Token validation, consumption and contractor-role assignment are enforced server-side, not by frontend controls alone.
- Raw invitation tokens are absent from the database, logs and analytics.
- Invitation and onboarding RLS/negative-permission/state-transition tests pass.

## Testing

Test owner/admin creation, unauthorised creation, direct API access, valid acceptance, replay, revocation, concurrent acceptance, malformed tokens, account enumeration, role assignment, preservation of any existing customer sign-up, mobile/error states and accessibility.

## Dependencies

Supabase authentication, server-controlled roles, audit log, contractor onboarding and a future notification provider.

## Rollout

Use a small invitation-only Aberdeenshire contractor pilot. Manually verify invitations, onboarding and approval outcomes before widening recruitment.

## Future Ideas

Bulk invitations, category/location recruitment campaigns, branded email templates, invite reminders, referral attribution and wait-list conversion.

## Decision History

- 3 August 2026 — CONFIRMED: invitation-only contractors; no public contractor sign-up; owner/admin secure-link flow.
- 10 August 2026 — DOCUMENTATION: promoted into a bounded implementation specification and connected to onboarding, RLS and security requirements.

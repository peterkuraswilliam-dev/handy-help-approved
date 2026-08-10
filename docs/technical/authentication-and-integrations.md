# Authentication and integrations

Purpose: record known auth concerns and future integration boundaries.

## Authentication

Supabase authentication is the confirmed direction. Email login was expected to remain available after migration from Lovable; Google sign-in removal/ownership was discussed elsewhere but no current Handy Help configuration was available.

Contractor registration is invitation-only for the current launch. There must be no public contractor sign-up route or open contractor-account creation API. Only the app owner or an authorised admin may generate a secure invitation link. Valid invitation acceptance may create/link the contractor's own authenticated account and grant applicant access, but must not grant approval. See [contractor invitations](../features/contractor-invitations.md).

Roles must not be trusted from client-editable profile fields. Use server-controlled claims or a protected role-membership table with RLS and audited grants. Session/route checks improve UX but do not replace database policies.

Invitation tokens must be generated and validated server-side, stored only as non-reversible digests, protected from logs/analytics and consumed transactionally. Token lifetime, resend policy and the email-delivery provider remain open.

## Integrations

| Integration | Status |
| --- | --- |
| Supabase Auth/Database/Storage | Confirmed direction; implementation unavailable |
| Email notification provider | Deferred/open |
| Vercel | Discussed; project/config unavailable |
| Payment provider | Future/open |
| Landstack/property data | Future research |
| Maps/geocoding | Future/open |

Secrets belong in environment configuration, never Markdown or client bundles.

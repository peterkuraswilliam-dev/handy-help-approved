# Authentication and integrations

Purpose: record known auth concerns and future integration boundaries.

## Authentication

Supabase email/password authentication is implemented through browser/server clients and authenticated TanStack Start route guards. Google sign-in remains available for existing accounts; first-time auth-user creation without a valid invitation reservation is rejected by the database trigger.

Contractor registration is invitation-only for the current launch. There must be no public contractor sign-up route or open contractor-account creation API. Only the app owner or an authorised admin may generate a secure invitation link. Valid invitation acceptance may create/link the contractor's own authenticated account and grant applicant access, but must not grant approval. See [contractor invitations](../features/contractor-invitations.md).

The approved manual-link slice is implemented in the repository. `/auth` is sign-in-only, `/become-approved` explains the invitation requirement, `/admin/invitations` provides authorised management and `/invite/$token` accepts a matching invitation. New account creation runs in a validated server function using a service-role client; database reservation/completion functions and the auth trigger enforce the boundary. The migration has not been applied or live-tested during this task.

Roles must not be trusted from client-editable profile fields. Use server-controlled claims or a protected role-membership table with RLS and audited grants. Session/route checks improve UX but do not replace database policies.

Invitation tokens are generated and validated server-side, stored only as SHA-256 digests, protected from auth metadata and consumed through a short-lived reservation/completion flow. Tokens expire after seven days and match the invited email. Resend automation and the email-delivery provider remain open/excluded.

## Integrations

| Integration                    | Status                                                                                    |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| Supabase Auth/Database/Storage | Present in repository; live project state unverified                                      |
| Email notification provider    | Deferred/open                                                                             |
| Vercel                         | Discussed; no repository Vercel configuration found and external project state unverified |
| Payment provider               | Future/open                                                                               |
| Landstack/property data        | Future research                                                                           |
| Maps/geocoding                 | Future/open                                                                               |

Secrets belong in environment configuration, never Markdown or client bundles.

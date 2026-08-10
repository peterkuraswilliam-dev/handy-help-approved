# Security model

Purpose: state the minimum trust boundaries.

## Assets

Accounts/roles, contractor invitation tokens and recipient data, applications, identity/insurance documents, contact/address data, admin notes, jobs/media, messages, payment metadata, cases and audit logs.

## Main threats

IDOR/direct API access, public contractor-sign-up bypass, invitation token theft/replay/enumeration, role escalation, weak RLS, service-key exposure, malicious uploads, XSS, contact-filter evasion, spam/fake jobs, scraping, admin-account compromise, forged state/payment events and privacy leakage through notifications/analytics.

## Controls

Default-deny RLS; server-controlled roles; owner/admin-only invitations; high-entropy single-use invite tokens stored as digests; state/constraint validation; rate limits; private storage/signed URLs; content sanitisation; upload limits; secret management; secure session handling; immutable audit; least-privilege admin; dependency monitoring; backup/recovery and incident process.

Security must fail closed. Do not turn off RLS, make buckets public or move privileged logic into the client to fix an integration problem.

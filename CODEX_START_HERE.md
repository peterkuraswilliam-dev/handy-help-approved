# Codex start here

Status: current navigation guide
Last reconciled: 10 August 2026

## What this project is

Handy Help Aberdeenshire is a local platform intended to make finding and completing small and general property-service jobs safer and simpler. It combines approved contractors, verified jobs, limited matching and human local administration. It is not intended to be a passive directory or a pay-per-lead bidding marketplace.

## Current phase

The evidence-backed current build is the invitation-only contractor access, onboarding and admin approval system. There is no public contractor sign-up: only the app owner or an authorised admin may issue a secure sign-up invitation. Customer accounts, job posting, matching, quotes, booking, reviews, payments and live messaging are future marketplace work and remain proposals unless a later confirmed decision promotes them.

## Read order

1. [Agent rules](AGENTS.md)
2. [Project handover](PROJECT_HANDOVER.md)
3. [Current scope](docs/product/current-scope.md)
4. [Confirmed decisions](docs/decisions/confirmed-decisions.md)
5. [Open questions](docs/decisions/open-questions.md)
6. [Roadmap](docs/development/roadmap.md)
7. The relevant [feature specification](docs/features/README.md)
8. [Database status](docs/database/overview.md), [RLS](docs/database/rls.md) and [security model](docs/security/security-model.md)

## Non-negotiable rules

- Contractor access is invitation-only for the current launch; no public contractor sign-up route or API may bypass it.
- Only the app owner or an authorised admin may create a contractor invitation, and acceptance grants applicant access rather than approval.
- Approved contractors and verified jobs are central trust controls.
- The service is managed locally; it is not just a public directory.
- Match a job to no more than approximately three suitable contractors in the proposed marketplace.
- Protect personal contact information until the approved mutual-match/booking point is defined.
- Detect and flag attempts to exchange contact details prematurely; human review is required for enforcement.
- No pay-per-lead credit model in the preferred direction.
- Do not weaken RLS or expose admin notes/documents.
- Do not work directly on `main`.

## Before implementing anything

Inspect the codebase, package manifests, routes, tests, migrations, Supabase types and environment conventions. Record what is actually present as **EXISTING IN CODE/DATABASE**. Do not infer implementation from visual mock-ups or planning documents. Reconcile gaps against the feature spec and ask about any blocking [open question](docs/decisions/open-questions.md).

Use the [manifest](MANIFEST.md) when the exact filename is unknown. Use [source inventory](docs/project/source-inventory.md) to understand evidence and limitations.

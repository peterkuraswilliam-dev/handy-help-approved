# Handy Help project handover

Last reconciled: 10 August 2026

## Executive overview

Handy Help Aberdeenshire serves residents who need property and practical work completed and local contractors seeking genuine work. The differentiator is a managed local service: contractors and jobs are checked, matching is limited, and local admin support remains available.

## Current phase and priorities

The current build slice is invitation-only contractor access, onboarding and approval. There must be no public contractor sign-up: the owner or an authorised admin creates a secure invitation link, the contractor creates their own account through it, and then completes the separate application/review process. Evidence shows an admin application queue, filters, search, sorting, progress/warning cards, application detail, review tools and role-based views are built or in progress. Priorities are the invitation gate, contractor response to information requests, approved profiles/contractor management, security and permission hardening, end-to-end QA and launch preparation. Email notifications are deferred until a provider is configured.

## Confirmed rules

- Launch locally in Aberdeenshire.
- Contractor access is invitation-only; there is no public contractor sign-up.
- Only the app owner or an authorised admin may issue a secure contractor sign-up invitation.
- Accepting an invitation permits onboarding but does not approve the contractor.
- Contractors must apply and be admin-approved.
- Every job in the later marketplace must be admin-approved before circulation.
- The intended service is managed matching, not a directory.
- Contact details must be protected before the authorised match/booking stage.
- Attempts to exchange contact details prematurely should be redacted or blocked and flagged to admin.
- Early contractor recruitment is free while the application is being developed.
- Do not use pay-per-lead credits in the preferred pricing direction.

## Technical status

React, TypeScript, Tailwind and Supabase are confirmed for the onboarding build. One later visual labels Next.js and PWA, but those are not verified in code. No repository, migrations, environment configuration or live database were accessible during this migration. All detailed schemas are therefore proposals pending code audit.

## Business direction

The revenue goal discussed is £500/month. A historical visual proposed £10/£25/£50 monthly tiers and 20 Pro contractors at £25. The newer preferred direction is free launch followed by simple monthly pricing and/or a success fee, without lead credits. The exact model remains open.

## Future modules

Customer accounts, job posting and moderation, limited matching, quotes, booking, protected messaging, job lifecycle, reviews, payments, disputes, contractor opportunity intelligence, Landstack/planning data and new-homeowner/property signals.

## Biggest open questions

Exact V1/MVP boundary, invitation lifetime/resend/email-matching rules, pricing model, legal booking/payment structure, precise contact-release event, verification standard, category/service-area taxonomy, notification provider, dispute responsibility, data retention and whether Next.js/PWA are actually in the repository.

For detail use [MANIFEST.md](MANIFEST.md), [open questions](docs/decisions/open-questions.md) and the [feature index](docs/features/README.md).

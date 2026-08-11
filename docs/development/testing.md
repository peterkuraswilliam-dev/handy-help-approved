# Testing strategy

Purpose: define completion evidence.

## Required layers

- Unit tests for validation, redaction, eligibility and transition rules
- Database tests for constraints, functions and every RLS role/relationship
- Integration tests for auth, uploads, notifications and provider webhooks
- End-to-end journeys for contractor/admin and later customer/contractor/admin
- Accessibility, responsive/mobile, loading/empty/error and keyboard testing
- Security negatives: direct API, IDOR, role escalation, upload abuse, XSS, contact evasion, concurrency and notification leakage

Use isolated test users/data. Never validate permissions solely through hidden buttons. Record commands/results in the implementation handover and do not mark acceptance criteria complete without evidence.

## Invitation-only access matrix

- Admin can create/list/revoke; contractor, unrelated authenticated user and signed-out caller cannot.
- The 21st pending invitation for one admin fails; accepted, revoked and expired rows do not count.
- Correct email plus valid token creates/links the contractor account and grants only the contractor role.
- Wrong email, malformed, expired, revoked, accepted or concurrently reserved token fails without recipient enumeration.
- Direct Supabase sign-up and first-time OAuth account creation without an invitation fail in the database trigger.
- Existing invited user acceptance is atomic; replay fails; invitation acceptance never grants approval.
- Account-creation failure releases the reservation; completion failure removes the newly created auth user and releases the reservation.

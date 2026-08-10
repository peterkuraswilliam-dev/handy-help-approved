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

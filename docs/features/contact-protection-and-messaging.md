# Feature: Contact protection and messaging

## Status

Contact-protection rule confirmed; implementation and release event open. Messaging is future proposal.

## Goal

Let users coordinate safely without bypassing the platform before a legitimate match/booking.

## Why It Exists

Premature contact exchange undermines privacy, moderation, fees, verified reviews and dispute support.

## Users

Customer, contractor, matched/selected parties, admin.

## Confirmed Decisions

Phone numbers, emails and other contact details must be hidden before the authorised point; attempted sharing should be blanked/redacted or blocked and flagged to admin.

## Working Proposals

In-app threads, attachments, read receipts, message notifications and admin-visible moderation flags.

## Open Questions

Exact release event; which identifiers/links are blocked; warning/appeal policy; admin message access; public contractor contact conflict.

## In Scope

Server-side detection, protected rendering, flags/audit and later authorised job-scoped messaging.

## Out of Scope

Client-only filtering, silent permanent punishment, indiscriminate surveillance and exposing public contact by default.

## User Flow

User enters text → server scans/classifies → safe content stored/displayed or protected → warning/flag → admin review if needed → policy-based action.

## Screens and Routes

Job thread, composer warning, protected-content placeholder, moderation queue and appeal/context view.

## Business Rules

Apply policy consistently to both sides; retain original content only if necessary and tightly restricted; release contact only from server-authorised relationship state.

## States and Transitions

message: pending_scan → visible/redacted/blocked → reviewed; flag: open → actioned/dismissed/appealed.

## Database Changes

Proposed conversations, participants, messages, moderation_flags and message_events.

## Supabase RLS

Only conversation participants/admin under policy; unrelated users no access; original blocked content restricted beyond normal admin where feasible.

## Storage Requirements

Private, scanned attachments with participant policies and signed URLs.

## API / Server Actions

Scan/redact/authorise server-side; rate limit; never rely on hidden UI or regex alone.

## Notifications

New safe message, content warning and moderation outcome; never include sensitive message bodies in email/push by default.

## Security

Handle obfuscation, images containing contact details, malicious files, spam and enumeration.

## Privacy

Publish a clear moderation policy; minimise retention/access; avoid unnecessary admin reading.

## Moderation

Human review for ambiguous/repeated attempts; proportional actions and audit.

## Analytics

Aggregate attempt/false-positive rates and appeals; do not store raw contact details in analytics.

## Edge Cases

Numbers required for legitimate quote dimensions, social handles, business names, emergency safety information, OCR, mixed languages and already-public information.

## Acceptance Criteria

Protected data cannot be retrieved through API/RLS before release; attempts are handled consistently; authorised parties gain access only after valid state; admin action is auditable.

## Testing

Evasion corpus, false positives, API bypass, RLS, attachments/OCR, release/revocation and notification leakage.

## Dependencies

Match/booking state, moderation, audit, legal/privacy copy and notifications.

## Rollout

Start with warnings and admin review; measure false positives before stronger automatic penalties.

## Future Ideas

Privacy-preserving phone relay if commercially justified.

## Decision History

5 August 2026 contact protection confirmed; public-profile contact remains unresolved.

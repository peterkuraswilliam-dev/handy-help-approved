# Feature: Disputes and Job Rescue

## Status

Future working proposal.

## Goal

Provide a clear path when a job stalls, is cancelled, becomes unsafe or is disputed.

## Why It Exists

Real local support is a stated differentiator, but responsibilities must be bounded.

## Users

Customer, contractor, admin, super admin for high-risk cases.

## Confirmed Decisions

Admin handles complaints/suspensions in the intended service. No remedy or guarantee is confirmed.

## Working Proposals

Structured issue report, evidence, pause state, admin mediation, rematching/replacement and Job Rescue tracking.

## Open Questions

Legal responsibility, emergencies, refunds, remediation promises, response SLA, evidence retention, appeals and insurance escalation.

## In Scope

Report, triage, safe communication, evidence, actions/reasons, escalation and closure.

## Out of Scope

Legal advice, guaranteed workmanship, emergency response, unilateral fund movement without authority and hidden punitive scores.

## User Flow

Report issue → safety/emergency guidance → admin triage → gather responses/evidence → decide platform action/support → close/appeal.

## Screens and Routes

Issue form, case timeline, evidence, admin queue and outcome.

## Business Rules

Urgent danger routes to emergency/appropriate services; suspension uses separate risk standard; both sides can respond where safe; actions are auditable.

## States and Transitions

open → triaged → awaiting_party/investigating → actioned → resolved/closed → appealed.

## Database Changes

Proposed cases, case_participants, case_messages, case_evidence and case_events.

## Supabase RLS

Case parties see permitted case material; unrelated users none; sensitive internal risk notes restricted to authorised admins.

## Storage Requirements

Private evidence with strict retention/access and no public URLs.

## API / Server Actions

Create case, restrict messaging, apply audited platform actions and prevent evidence deletion.

## Notifications

Acknowledgement, response needed, safety guidance, status and outcome; avoid sensitive detail in email.

## Security

Threat/harassment controls, secure evidence, rate limits and high-risk admin access.

## Privacy

Data minimisation, special-category risk, subject-access/legal-hold processes require policy.

## Moderation

Document standards, proportional actions, conflicts of interest and appeal.

## Analytics

Case type, response/resolution time, repeat risk and rescue outcomes using minimal data.

## Edge Cases

Police/insurer involvement, threats, minors/vulnerable users, off-platform agreement, deleted account, chargeback and parallel complaints.

## Acceptance Criteria

Reports are private and acknowledged; permissions isolate cases; actions/reasons are auditable; emergency limitations are clear.

## Testing

RLS, evidence access, threat scenarios, suspension integration, notification privacy and audit immutability.

## Dependencies

Lifecycle, messaging, payments decision, moderation, legal/privacy policy and audit.

## Rollout

Manual case handling with written policy and legal review before marketing Job Rescue promises.

## Future Ideas

Rematching and partner referral network after operational evidence.

## Decision History

1 August 2026 Job Rescue differentiator; scope and remedies remain open.

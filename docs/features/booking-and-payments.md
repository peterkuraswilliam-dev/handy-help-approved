# Feature: Booking and payments

## Status

Future; fundamental business/legal choices are open.

## Goal

Turn a contractor selection into a clear, auditable commitment and, if approved, handle money safely.

## Why It Exists

The booking point may control contact release, fees, cancellation and job lifecycle.

## Users

Customer, selected contractor, admin, trusted payment webhook/server.

## Confirmed Decisions

Contact remains protected until an authorised match/booking event. No final payment model is confirmed.

## Working Proposals

Booking confirmation with agreed scope/date/quote; optional deposits/platform payment; contractor monthly and/or success fee.

## Open Questions

Does Handy Help take payment, act as agent/marketplace, hold deposits, charge VAT/fees, manage refunds or only record an off-platform booking?

## In Scope

Only after decisions: accept quote, booking record, terms snapshot, payment status, cancellation/refund events and receipts.

## Out of Scope

Unlicensed escrow, unclear custody of funds, hidden charges and frontend-only payment confirmation.

## User Flow

Select quote → review terms/fees → confirm booking → optional provider checkout → verified webhook → booking confirmed → authorised contact release.

## Screens and Routes

Selection confirmation, checkout if used, booking detail, cancellation/refund status and admin support.

## Business Rules

Server/webhook is payment authority; idempotency required; terms/pricing version captured; fees shown before consent.

## States and Transitions

booking: pending → confirmed → cancelled/completed; payment: requires_payment → processing → paid/failed/refunded/part_refunded/disputed.

## Database Changes

Proposed bookings, booking_terms, payments, payment_events and refunds. Do not add until commercial model is confirmed.

## Supabase RLS

Parties see own booking/payment summary; raw provider payload and admin notes are restricted; server writes provider events.

## Storage Requirements

Private invoices/receipts if retained; prefer provider-hosted documents where suitable.

## API / Server Actions

Create checkout, webhook verification, idempotent event processing, cancellation/refund and reconciliation.

## Notifications

Booking/payment confirmation, failure, cancellation, refund and schedule reminders.

## Security

Never handle card data directly; verify signatures; prevent amount tampering and replay.

## Privacy

Minimise payment metadata; define processor and privacy roles before launch.

## Moderation

Admin intervention cannot fabricate provider state; preserve evidence and audit.

## Analytics

Booking conversion, payment failure, refunds and fees; financial reports need reconciliation.

## Edge Cases

Duplicate webhook, payment succeeds after timeout, price changes, partial refund, chargeback, contractor suspension after payment.

## Acceptance Criteria

Blocked until open commercial/legal questions are answered; when built, provider state is authoritative, transitions idempotent and access private.

## Testing

Provider test mode, webhook signatures/replay, concurrency, failed/late events, cancellation and RLS.

## Dependencies

Quotes, terms, legal review, pricing, contact release, lifecycle and payment provider.

## Rollout

Prefer a no-payment booking pilot unless a reviewed payment model is confirmed.

## Future Ideas

Deposits, instalments and contractor subscription billing after evidence of need.

## Decision History

Historical payment-plan discussions; 1 August monthly/success-fee direction; exact model remains open.

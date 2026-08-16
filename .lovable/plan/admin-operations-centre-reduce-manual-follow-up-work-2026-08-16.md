# Admin Operations Centre — reduce manual follow-up work

A single new screen for admins that surfaces everything needing attention and lets them act on it without opening each application individually. This stays inside the current onboarding launch; it does not add customer accounts, job posting, or marketplace features.

## Goal

Cut the time admins spend checking dashboards for stuck applications, overdue information requests, and expiring insurance. Replace manual scanning with a prioritised queue of follow-up actions.

## What we will build

1. **New route `/admin/operations`**
   - A role-protected admin-only page.
   - Opens as the default admin landing when an admin signs in (update the post-sign-in redirect).

2. **Attention cards at the top**
   - Applications stuck in a status for more than a configurable threshold (default: 7 days).
   - Information requests with due dates within the next 3 days or already overdue.
   - Insurance policies expiring within the next 30 days.
   - Pending invitations that have not been accepted and are nearing expiry.
   - Each card shows a count, a short label, and a jump link to the relevant filtered list.

3. **Prioritised follow-up list**
   - One combined list of action items sorted by urgency.
   - Each row shows: item type, related business name, how long it has been waiting, the required action, and a direct link.
   - Actions are grouped by type: application review, info request follow-up, insurance renewal, invitation reminder.

4. **Bulk reminders / quick actions**
   - For each item type, a single button to send an in-app notification to the contractor reminding them what is needed.
   - No email is sent yet (email provider is still an open question); notifications use the existing `public.notifications` table and bell UI.
   - Reminders are recorded in `application_status_history` or `application_info_requests` as appropriate.

5. **Snooze / dismiss**
   - Admins can dismiss an action item for 24 hours; dismissed items are hidden until the next day or until the underlying state changes.
   - Dismissals are stored in `localStorage` only; no new database table is needed.

## Out of scope

- Email sending (wait for notification provider decision).
- Customer-side features, job posting, matching, or payments.
- Automatic status changes or auto-approval.
- New public pages or contractor-facing workflows beyond the notification.

## Technical approach

- Add one new route file: `src/routes/_authenticated/admin.operations.tsx`.
- Create a server function `src/lib/admin-operations.functions.ts` that returns the aggregated attention set using a single efficient query.
- Reuse existing `STATUS_LABEL`, `STATUS_PILL_CLASS`, `ErrorPanel`, and `LoadingCards` from the polish pass.
- Use the existing `notifications` table for reminders; no new tables required.
- Add a `site-config.ts` entry for attention thresholds (stuck days, due-soon days, insurance warning days) so they can be tuned without a code change.

## Verification

- Manual admin pass: cards show correct counts, list sorts by urgency, reminder sends a notification the contractor can see in the bell.
- Typecheck passes.
- Mobile check at 360px: cards stack, list rows remain readable, tap targets comfortable.

# Polish pass — no new features

Focus: make the existing invitation, application, review and profile flows feel finished and reliable. No new modules, no scope beyond the current build slice.

## 1. Consistency and clarity

- Standardise empty, loading and error states across admin queue, application detail, contractor dashboard, notifications and the contractor directory so they all use the same skeleton and message pattern.
- Unify status wording and badge styling (Draft, Submitted, Under review, More information required, Approved, Rejected, Suspended) so the same label appears everywhere it is shown.
- Tidy button hierarchy: one primary gold action per screen, everything else outline or ghost.

## 2. Mobile finish

- Sweep every admin table/card view at 360-411px width for cramped padding, wrapped labels and off-screen actions.
- Check tap targets on tabs, menu drawer, checklist rows and document actions meet a comfortable minimum.
- Confirm sticky header, banner and bottom actions do not overlap content on short screens.

## 3. Accessibility

- Visible focus rings on all interactive elements, correct heading order per page, form labels and error messages tied to fields via `aria-describedby`.
- Status conveyed by text plus colour, never colour alone.
- Respect reduced-motion for animated cards and transitions.

## 4. Copy and trust

- Plain-language review of contractor-facing copy: invitation acceptance, information requests, resubmission, suspension notice, approval disclaimer.
- Make sure the free-while-in-development notice and the approval disclaimer read consistently.

## 5. Reliability tidy-ups

- Consistent error toasts using the shared friendly-message helper; no raw database errors surfaced.
- Confirm every mutation invalidates the right queries so lists refresh without a manual reload.

## Technical notes

Work is presentation-layer only: shared components (`StatusPage`, `MainMenu`, application/admin components), `src/styles.css` tokens and route-level copy. No schema changes, no RLS changes, no new tables or routes. Verification is a manual pass at mobile and desktop widths plus a typecheck.

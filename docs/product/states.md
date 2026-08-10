# Core states

Purpose: give a common state vocabulary. Exact database enums remain proposed until code audit.

## Contractor invitation

```text
pending -> accepted
pending -> revoked
pending -> expired  # only after an expiry rule is confirmed
```

Acceptance and revocation are terminal for a token. Creating a replacement invitation is a separate audited action.

## Contractor application

```text
draft -> submitted -> under_review
under_review -> information_requested -> resubmitted -> under_review
under_review -> approved | rejected
approved -> suspended -> approved
```

## Job proposal

```text
draft -> submitted -> under_review
under_review -> information_requested | approved | rejected
approved -> matching -> quoted -> contractor_selected
contractor_selected -> scheduled -> in_progress -> completed
completed -> confirmed -> reviewed
any active state -> cancelled | disputed
```

Transition authority and allowed reversals must be enforced in the database/server layer and audited. See [job lifecycle](../features/job-lifecycle.md).

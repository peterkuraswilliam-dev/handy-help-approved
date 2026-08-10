# Proposed database schema

Status: PROPOSED; none of these objects is claimed to exist.

Purpose: establish domains and relationships for later code audit/design.

```text
auth.users 1--1 profiles
profiles 1--* user_roles
privileged profile 1--* contractor_invitations
contractor_invitations 0..1--1 accepted contractor auth.user
profiles 1--* contractor_applications
contractor_applications 1--* application_documents
contractor_applications 1--* information_requests
contractor_applications 1--* application_events
approved contractor profile 1--* contractor_services/service_areas/portfolio_items

customer profile 1--* jobs
jobs 1--* job_media/job_events/job_matches
job_matches 1--0..1 quotes
jobs 1--0..1 bookings
jobs 1--* conversations/messages
jobs 1--* reviews/cases
```

Prefer UUID primary keys; `created_at`/`updated_at` with timezone; explicit ownership FKs; CHECK constraints or controlled enums for status; unique partial constraints for one active selection/review; immutable event tables; and indexes supporting owner/status/queue/match queries.

Sensitive fields must be separated from public-safe projections. Avoid putting private notes or document paths in public profile rows.

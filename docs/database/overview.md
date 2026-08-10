# Database overview

Purpose: prevent proposed schema from being mistaken for existing implementation.

## EXISTING IN CODE/DATABASE

Repository evidence reviewed on 10 August 2026 includes 31 SQL migrations, `supabase/config.toml` and generated types in `src/integrations/supabase/types.ts`. The generated schema contains `profiles`, `user_roles`, `contractor_applications`, `contractor_services`, `contractor_areas`, `contractor_documents`, `contractor_gallery`, `admin_notes`, `application_status_history`, `application_info_requests`, `application_info_request_items`, `application_review_checks`, `contractor_profiles`, `contractor_status_events` and `notifications`, plus related functions. Migrations define RLS policies and Storage object policies for the current onboarding/review/profile slice.

No `contractor_invitations`, customer, job, match, quote, booking, message, review, case or payment resource was found. Repository files prove intended migration history, not the current state of the live Supabase project; live schema, policies, functions, buckets and data remain unverified.

## PROPOSED domains

Identity/roles; contractor applications; services/areas; private documents; review requests/decisions; approved profiles; audit events; future customers/jobs/matches/quotes/bookings/messages/reviews/cases.

## FUTURE

Payments, rich analytics, opportunity intelligence and external-data provenance.

Before any migration, introspect existing tables/policies/indexes/functions/triggers/buckets and reconcile with [schema proposal](schema.md), [tables](tables.md) and [RLS](rls.md).

# Database overview

Purpose: prevent proposed schema from being mistaken for existing implementation.

## EXISTING IN CODE/DATABASE

Unknown. No repository, migrations, Supabase schema or generated types were accessible. Visuals imply application data exists, but visuals are not database evidence.

## PROPOSED domains

Identity/roles; contractor applications; services/areas; private documents; review requests/decisions; approved profiles; audit events; future customers/jobs/matches/quotes/bookings/messages/reviews/cases.

## FUTURE

Payments, rich analytics, opportunity intelligence and external-data provenance.

Before any migration, introspect existing tables/policies/indexes/functions/triggers/buckets and reconcile with [schema proposal](schema.md), [tables](tables.md) and [RLS](rls.md).

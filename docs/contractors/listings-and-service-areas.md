# Contractor listings and service areas

Purpose: distinguish contractor profiles/listings from customer job listings.

## Terminology

A **contractor listing/profile** describes an approved business and its services. A **job listing** describes work requested by a customer. They must not share ambiguous labels in UI or data models.

## Proposed contractor fields

Display name, business summary, approved status/date, services, main operating area, coverage, gallery, current insurance summary, relevant qualification summaries, website/social links subject to contact policy and disclaimer.

## Service-area choices — OPEN

1. Named towns/settlements
2. Base postcode plus radius
3. Council wards/polygons
4. Hybrid named areas plus maximum travel distance

Store a canonical location model; do not rely only on free text. Public views should avoid exposing a home address. See [matching](../features/matching-and-quotes.md).

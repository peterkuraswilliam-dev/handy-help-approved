# Contact protection policy

Purpose: own the cross-cutting privacy and anti-bypass rule.

## Confirmed

Personal contact details are unavailable until the authorised booking/match event. Early attempts must be protected and flagged.

## Protected categories — proposed

Phone numbers, email, exact address, social handles, external messaging links, QR codes and obfuscated variants. Websites/business contact shown on public profiles conflict with this rule and need a product decision.

## Enforcement layers

1. Do not send protected fields in API responses.
2. RLS/authorisation checks relationship state.
3. Server scans user-generated text and attachment metadata/content as feasible.
4. UI warns and renders protected placeholders.
5. Admin reviews uncertain/repeated cases.
6. Audit outcomes and provide an appeal/context process.

Frontend masking alone is never sufficient.

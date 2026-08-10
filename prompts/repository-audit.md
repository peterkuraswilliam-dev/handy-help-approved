# Prompt: Repository audit

```text
Audit the Handy Help repository without changing application code or production services. Read AGENTS.md and CODEX_START_HERE.md. Inventory framework/version, routes, auth, environment names, Supabase clients, tables/types, migrations, functions/triggers, RLS policies, Storage buckets/policies, admin-role mechanism, tests, CI, Vercel configuration and documentation.

Compare implementation with docs. Report: EXISTING IN CODE/DATABASE, documented but missing, implemented but undocumented, contradictions, security risks, broken setup, open questions and a prioritised reconciliation plan. Do not infer deployed state from local code and do not expose secret values.
```

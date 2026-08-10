# Environments and configuration

Purpose: set safe expectations pending repository audit.

At minimum use separate local/development, preview/staging and production Supabase/configuration where feasible. Never point routine tests or preview branches at production data.

Document required variable names without values. Classify each as public client configuration or server secret. Supabase anon keys are client configuration but still rely on correct RLS; service-role and provider secrets are server-only.

Current environment names, Vercel linkage, branch deployment rules and secret ownership are **unavailable — requires future review**.

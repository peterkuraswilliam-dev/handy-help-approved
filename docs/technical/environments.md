# Environments and configuration

Purpose: record repository-visible configuration while protecting external environment details.

At minimum use separate local/development, preview/staging and production Supabase/configuration where feasible. Never point routine tests or preview branches at production data.

Document required variable names without values. Classify each as public client configuration or server secret. Supabase anon keys are client configuration but still rely on correct RLS; service-role and provider secrets are server-only.

`.env.example` documents `SUPABASE_PROJECT_ID`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL` and their `VITE_` equivalents without values. `supabase/config.toml` identifies the linked project ID. No service-role variable is documented in the example.

Vercel linkage, actual environment values, branch deployment rules, deployment history and secret ownership remain externally unverified. Do not infer them from local examples or commit secrets to documentation.

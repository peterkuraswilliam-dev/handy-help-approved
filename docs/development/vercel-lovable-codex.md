# Vercel, Lovable migration and Codex workflow

Purpose: preserve platform workflow context while acknowledging missing configuration.

The onboarding app originated in/was planned through Lovable stages and later intended for GitHub/Codex development. React/TypeScript/Tailwind/Supabase are confirmed; ownership of auth redirect URLs, environment variables and provider configuration must be moved away from any Lovable-managed assumptions during audit.

Vercel deployment was discussed, but no project or config was accessible. Verify framework, build/output settings, environment separation, Supabase URLs/redirects and preview behaviour before changes.

Codex workflow: receive “Make this Codex-ready” handover → reconcile/update docs → resolve blockers → inspect code/database → implement on non-main branch → test → update docs and handover.

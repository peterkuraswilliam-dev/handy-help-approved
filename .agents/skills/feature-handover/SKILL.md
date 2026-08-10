---
name: handy-help-feature-handover
description: Reconcile a Handy Help feature handover into the repository when the user says “Make this Codex-ready”, provides a feature handover, or asks Codex to document a planned Handy Help feature before implementation. Classifies decisions, updates existing feature/decision/database/security/testing docs, identifies blocking questions and prepares safe implementation slices without creating duplicate v2/new/final files.
---

# Handy Help feature handover

## Workflow

1. Read `/AGENTS.md`, `/CODEX_START_HERE.md`, the feature index and decision registers.
2. Inspect existing related documentation and enough of the actual code, migrations and policies to understand implementation status without changing them.
3. Extract goal, users, scope, flows, screens, rules, states, data, RLS, Storage, server actions, notifications, security, privacy, moderation, analytics, edge cases, acceptance criteria, tests, dependencies, rollout and history.
4. Classify every material statement as CONFIRMED, WORKING PROPOSAL, OPEN QUESTION, HISTORICAL or SUPERSEDED. Do not infer confirmation from enthusiasm or a mock-up.
5. Reconcile conflicts by keeping the newest explicit confirmed decision. Record unresolved conflicts in `docs/decisions/open-questions.md`.
6. Update the existing owning feature file and linked specialist documents. Do not create `v2`, `new`, `final`, dated duplicates or parallel truth sources.
7. Move replaced decisions into historical/superseded records with a link to the current decision.
8. Mark database objects as EXISTING IN CODE/DATABASE only after verification; otherwise PROPOSED or FUTURE.
9. Specify RLS by owner/relationship/admin/service role and identify rules that cannot be frontend-only.
10. Set `Implementation Status` to **Not ready**, **Ready for approved implementation slice**, or **Fully approved**. Add an `Approved Implementation Slice` and `Do Not Implement Yet`; never treat `In Scope` alone as coding permission.
11. Identify blocking questions. If implementation depends on one, stop and ask rather than inventing an answer. A non-blocking open question may remain only when it is explicitly excluded from the approved slice.
12. Unless the user's current request already answers it explicitly, ask: **“Do you want me to update the Markdown only, or update the Markdown first and then write the code?”** Do not start code changes until the user chooses.
13. If the user chooses **Markdown only**, update the source-of-truth documentation and finish with files updated, remaining questions, test/security requirements and the recommended implementation slice. Do not modify application code, migrations, Supabase, Vercel or production services.
14. If the user chooses **Markdown first, then code**, update the documentation before implementation, inspect the existing code, and implement only the `Approved Implementation Slice`. Do not implement anything under proposals, open questions, future ideas or `Do Not Implement Yet`.
15. Finish with files updated, code/database changes if authorised, remaining questions, tests performed, security implications and the next implementation slice.

Use `/prompts/feature-handover.md` for the normal-ChatGPT handover shape and `/templates/feature-spec.md` when no owning feature specification exists.

Never modify production, deploy, work on `main`, expose secrets or weaken RLS unless separate explicit authority covers the safe action—and RLS must never be weakened merely to make a feature work.

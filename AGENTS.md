# Handy Help agent instructions

Purpose: govern all AI-assisted work in this repository. Read this file before changing code, database objects or documentation.

## Read first

1. `CODEX_START_HERE.md`
2. `docs/decisions/confirmed-decisions.md`
3. `docs/decisions/open-questions.md`
4. The relevant feature specification under `docs/features/`
5. Relevant technical, database, security and testing documents
6. Inspect the actual code, migrations and deployed configuration available to the task

## Project

Handy Help Aberdeenshire is intended to become a managed local matching service connecting customers with approved local contractors. The current build slice is narrower: owner/admin invitation-only contractor access, contractor application, admin review, approval and contractor management. There is no public contractor sign-up. Accepting an invitation allows onboarding but does not confer approval. Broader customer/job/booking features remain proposed until explicitly promoted.

## Decision labels

- **CONFIRMED**: follow unless newer evidence explicitly supersedes it.
- **WORKING PROPOSAL**: design direction; do not implement as settled scope without approval.
- **OPEN QUESTION**: stop and ask if implementation depends on it.
- **HISTORICAL**: context only.
- **SUPERSEDED**: do not implement; retain for traceability.

## Source-of-truth hierarchy

When sources conflict, use this order:

1. A newer, explicit confirmed decision recorded in the decision log
2. The current feature specification
3. The confirmed-decision register
4. Current technical/database/security documentation
5. Verified code, migrations and environment configuration (evidence of implementation, not automatically product intent)
6. Working proposals
7. Historical discussions and visual concepts

If product intent and implementation differ, report the drift. Do not silently choose either side.

## Working rules

- Never work directly on `main`. Use a task branch such as `codex/<short-name>` or the repository's established development branch.
- Inspect the repository and existing behaviour before editing. Do not remove or replace working features without evidence and a scoped reason.
- Do not invent routes, tables, fields, pricing, permissions or product decisions.
- Do not introduce a public contractor sign-up path or permit invitation acceptance to bypass human contractor approval.
- Update the existing owning document; do not create `v2`, `new`, `final` or duplicate specifications.
- Preserve superseded decisions in the history files and link to the replacement.
- Keep UK English, relative Markdown links and decision labels.
- Do not expose secrets, tokens, service-role keys, private notes, identity documents or private contact details.
- Never weaken Supabase RLS to make a feature work. Privileged actions must be authorised server-side and audited.
- Frontend hiding is not access control. Treat all client input as untrusted.
- Database changes require a migration, rollback consideration, constraints/index review, RLS review, generated type update where applicable, and tests.
- Storage buckets require ownership rules, private/public classification, path policy, MIME/size limits and signed URL strategy.
- Test happy paths, permission boundaries, negative cases, state transitions, mobile layouts and regressions.
- Do not deploy, modify production data, Supabase or Vercel unless the user explicitly authorises it.

## Feature workflow

Before implementation:

1. Reconcile the handover with existing docs and code.
2. Classify every statement.
3. Update the owning feature spec and decision registers.
4. Set an explicit implementation status and record both `Approved Implementation Slice` and `Do Not Implement Yet`.
5. Resolve blocking open questions; exclude non-blocking unresolved items from the approved slice.
6. Plan small implementation slices, migrations and tests.
7. Implement only the approved slice on a non-`main` branch.
8. Verify behaviour and documentation together.

When a normal ChatGPT conversation ends with **“Make this Codex-ready”**, follow `.agents/skills/feature-handover/SKILL.md` and `prompts/feature-handover.md`. Unless the current request already makes the choice explicit, ask whether the user wants **Markdown only** or **Markdown first, then code**. Never begin code changes before that choice. In both cases, update existing documents first.

`In Scope` describes the feature boundary but is not implementation authority. Code may be changed only when the feature is marked **Ready for approved implementation slice** or **Fully approved**, and only within its `Approved Implementation Slice`. Never implement items under working proposals, open questions, future ideas or `Do Not Implement Yet`.

## Lovable integration

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history—force pushing, or rebasing/amending/squashing commits
> that are already pushed—as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits pushed to the connected branch sync back to Lovable and appear in
> the editor, so keep the branch in a working state.

## Completion handover

Report changed files, migrations, RLS/storage implications, tests run, known limitations, remaining questions and documents updated. Never claim a feature is complete when tests or security checks were skipped.

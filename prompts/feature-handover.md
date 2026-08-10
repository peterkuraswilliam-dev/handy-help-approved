# Prompt: Make this Codex-ready

Use after a normal ChatGPT feature-planning conversation.

```text
Make this Codex-ready.

Convert the current feature conversation into a repository handover. Do not invent missing decisions. Classify each material statement as CONFIRMED, WORKING PROPOSAL, OPEN QUESTION, HISTORICAL or SUPERSEDED.

Before making changes, ask me: “Do you want me to update the Markdown only, or update the Markdown first and then write the code?” Do not write application code unless I explicitly choose the second option. If I have already clearly chosen in my current request, do not ask again.

Include: feature goal and reason; users/roles; in/out scope; workflow; screens/routes; business rules; states/transitions; database existing/proposed/future; Supabase RLS by role/relationship; Storage; API/server actions; notifications; security; privacy; moderation; analytics; edge cases; acceptance criteria; testing; dependencies; rollout; future ideas; decision history; and exact existing documentation files to update.

Set an explicit Implementation Status: Not ready, Ready for approved implementation slice, or Fully approved. Add an Approved Implementation Slice containing only work authorised now, plus Do Not Implement Yet for proposals, unresolved decisions and adjacent features. In Scope does not by itself authorise coding.

If the feature already exists, update its owning Markdown and related decision/database/security/testing docs. Do not create v2/new/final duplicates. Move replaced decisions to history with links. Identify blocking questions before code work.

If I choose code, update the Markdown source of truth first, then inspect the implementation, implement only the Approved Implementation Slice and test the change. Do not code proposals, open questions, future ideas or anything under Do Not Implement Yet. If I choose Markdown only, do not modify code, migrations, Supabase, Vercel or production services.
```

Codex should follow the repository-local [feature handover skill](../.agents/skills/feature-handover/SKILL.md).

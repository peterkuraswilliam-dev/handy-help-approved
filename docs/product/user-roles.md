# User roles

Purpose: define roles without assuming an implemented authorisation model.

| Role | Status | Core responsibilities/access |
| --- | --- | --- |
| Public/signed-out | Confirmed concept | View public information and approved public profiles only. |
| Contractor applicant | Current build | Create and manage own application; respond to admin requests; access own private documents. |
| Approved contractor | Current/future | Maintain approved profile; future access to matched jobs, quotes and lifecycle. |
| Customer | Future proposal | Own account, jobs, quotes, booking, messages and reviews. |
| Admin | Current build | Review applications, private notes, decisions, suspensions and future job moderation. |
| Super admin | Proposed | Manage admins, roles, sensitive configuration and high-risk audit actions. |
| Trusted server/service role | Technical | Perform narrowly scoped privileged operations; never a human UI role. |

“Matched contractor” and “selected contractor” are relationship states, not global roles. See [RLS matrix](../database/rls.md).

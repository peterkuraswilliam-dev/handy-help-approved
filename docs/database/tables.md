# Proposed table catalogue

Status: PROPOSED pending code audit.

| Resource | Ownership/sensitivity | Key constraints/indexes |
| --- | --- | --- |
| profiles | User-owned; private contact | PK = auth user; unique normalised contact where needed |
| user_roles | Server/admin-controlled; sensitive | unique(user, role); audit grants |
| contractor_invitations | Owner/admin-controlled; recipient/token metadata sensitive | unique token digest; inviter/status/created indexes; accepted account link; raw token never stored |
| contractor_applications | Applicant-owned; sensitive | index owner/status/submitted_at; controlled status |
| application_documents | Applicant-owned; highly sensitive | unique logical current document; expiry index |
| information_requests | Application parties; private | status/deadline; responder/closer |
| application_events | Immutable audit | index application/time/type |
| contractor_profiles | Contractor-owned/admin-published | unique contractor; publication/approval status |
| contractor_services | Contractor profile relation | unique(profile, service) |
| service_areas | Contractor profile relation | canonical geography; spatial/radius index if used |
| portfolio_items | Contractor-owned/moderated | ordering/status; safe storage ref |
| jobs | Customer-owned; precise location/contact sensitive | owner/status/category/time indexes |
| job_media | Job-owned; private | media status/path uniqueness |
| job_matches | Job + contractor relationship | unique(job, contractor); cap enforced transactionally |
| quotes | Contractor-owned within match | one current/version chain; expiry/status |
| bookings | Job parties; private/financial-adjacent | at most one active confirmed booking per job |
| messages | Conversation participant; private | conversation/time; moderation state |
| reviews | Job party/public-safe after publish | unique eligible author/job/role |
| cases | Job parties/admin; highly sensitive | case status/priority/time |
| audit_events | Restricted/immutable | actor/target/action/time indexes; retention policy |

Every table requires explicit `NOT NULL`, FK deletion behaviour, timestamps, status constraints and RLS before deployment.

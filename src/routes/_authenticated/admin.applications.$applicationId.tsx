import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Building2,
  ClipboardCheck,
  FileText,
  Images,
  LayoutGrid,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import {
  STATUS_LABEL,
  completionPercent,
  missingDocuments,
  missingFields,
  type AppStatus,
} from "@/lib/application-helpers";
import { ApplicationDocuments } from "@/components/admin/ApplicationDocuments";
import { ReviewChecklist } from "@/components/admin/ReviewChecklist";
import { AdminNotes } from "@/components/admin/AdminNotes";

import { ActivityTimeline } from "@/components/application/ActivityTimeline";
import { PhotosPanel, SafeImage, useGallery } from "@/components/application/PhotosPanel";
import {
  ApplicationHeader,
  
  InsuranceCard,
  MissingDocsCard,
  MissingInfoCard,
  ProgressCard,
  StatusBadge,
  TabNav,
  type TabDef,
} from "@/components/application/shared";

export const Route = createFileRoute("/_authenticated/admin/applications/$applicationId")({
  head: () => ({
    meta: [
      { title: "Contractor Application — Handy Help Aberdeenshire" },
      {
        name: "description",
        content: "Read-only view of a contractor application submitted to Handy Help Aberdeenshire.",
      },
      { property: "og:title", content: "Contractor Application — Handy Help Aberdeenshire" },
      {
        property: "og:description",
        content: "Admin review of a Handy Help Aberdeenshire contractor application.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { tab?: string } =>
    typeof search.tab === "string" ? { tab: search.tab } : {},
  beforeLoad: async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) throw redirect({ to: "/auth", search: { mode: "signin" } });

    const { data, error } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
    if (error || !data) throw redirect({ to: "/dashboard" });
  },
  component: ApplicationDetail,
});

type ApplicationRow = {
  id: string;
  user_id: string;
  business_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  main_area: string | null;
  description: string | null;
  website: string | null;
  facebook: string | null;
  insurance_status: string | null;
  qualifications: string | null;
  references_text: string | null;
  agreed_rules: boolean | null;
  confirmed_accurate: boolean | null;
  status: AppStatus;
  created_at: string;
  updated_at: string;
  logo_path: string | null;
  insurance_evidence_path: string | null;
};

type HistoryRow = { id: string; status: AppStatus; reason: string | null; created_at: string };

const NOT_PROVIDED = "Not provided";

const TABS: TabDef[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "business", label: "Business Details", icon: Building2 },
  { id: "photos", label: "Logo & Photos", icon: Images },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "review", label: "Review", icon: ClipboardCheck },
  { id: "activity", label: "Activity", icon: Activity },
];

function BackLink() {
  return (
    <Link to="/admin" className="btn-ghost -ml-2 inline-flex w-fit items-center gap-1.5 text-sm">
      <ArrowLeft className="h-4 w-4" /> Back to Applications
    </Link>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  const text = value && value.trim().length > 0 ? value : NOT_PROVIDED;
  const missing = text === NOT_PROVIDED;
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`break-words whitespace-pre-wrap ${missing ? "text-muted-foreground italic" : ""}`}>{text}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-panel space-y-3">
      <h2 className="font-semibold">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function ApplicationDetail() {
  const { applicationId } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const activeTab = TABS.some((t) => t.id === tab) ? (tab as string) : "overview";

  const [app, setApp] = useState<ApplicationRow | null>(null);
  const [services, setServices] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [docCounts, setDocCounts] = useState({ insurance: 0, qualification: 0 });
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    setNotFound(false);
    try {
      const [appRes, svcRes, areaRes, histRes, docRes] = await Promise.all([
        db
          .from("contractor_applications")
          .select(
            "id,user_id,business_name,contact_name,email,phone,main_area,description,website,facebook,insurance_status,qualifications,references_text,agreed_rules,confirmed_accurate,status,created_at,updated_at,logo_path,insurance_evidence_path",
          )
          .eq("id", applicationId)
          .maybeSingle(),
        db.from("contractor_services").select("service").eq("application_id", applicationId),
        db.from("contractor_areas").select("area").eq("application_id", applicationId),
        db
          .from("application_status_history")
          .select("id,status,reason,created_at")
          .eq("application_id", applicationId)
          .order("created_at", { ascending: false }),
        db.from("contractor_documents").select("kind").eq("application_id", applicationId),
      ]);

      if (appRes.error || svcRes.error || areaRes.error) {
        setFailed(true);
        return;
      }
      if (!appRes.data) {
        setNotFound(true);
        return;
      }
      setApp(appRes.data as ApplicationRow);
      setServices(((svcRes.data as { service: string }[]) ?? []).map((s) => s.service));
      setAreas(((areaRes.data as { area: string }[]) ?? []).map((a) => a.area));
      setHistory((histRes.data as HistoryRow[]) ?? []);
      const docs = (docRes.data as { kind: string }[]) ?? [];
      setDocCounts({
        insurance: docs.filter((d) => d.kind === "insurance").length,
        qualification: docs.filter((d) => d.kind === "qualification").length,
      });
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const { logoUrl, gallery, loading: mediaLoading } = useGallery(applicationId, app?.logo_path ?? null);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <div className="h-5 w-40 animate-pulse rounded bg-white/10" />
        <div className="card-panel space-y-3">
          <div className="h-7 w-2/3 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-white/10" />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="card-panel space-y-3">
            <div className="h-5 w-1/3 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-full animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  if (failed) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <BackLink />
        <div className="card-panel space-y-3">
          <h1 className="text-2xl font-bold">Application could not be loaded</h1>
          <p className="text-sm text-muted-foreground">Please try again.</p>
          <button className="btn-gold" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (notFound || !app) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <BackLink />
        <div className="card-panel space-y-3">
          <h1 className="text-2xl font-bold">Application not found</h1>
          <p className="text-sm text-muted-foreground">This contractor application could not be found.</p>
          <Link to="/admin" className="btn-gold inline-flex w-fit">
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  const heading = app.business_name?.trim() || app.contact_name?.trim() || "Contractor application";
  const record = app as unknown as Record<string, unknown>;
  const percent = completionPercent(record, services.length, areas.length, docCounts.insurance + docCounts.qualification);
  const missingInfo = missingFields(record, services.length, areas.length);
  const missingDocs = missingDocuments({
    insuranceStatus: app.insurance_status,
    insuranceDocs: docCounts.insurance,
    insuranceEvidencePath: app.insurance_evidence_path,
    qualifications: app.qualifications,
    qualificationDocs: docCounts.qualification,
    photos: gallery.length,
  });
  const submittedAt = [...history].reverse().find((h) => h.status === "submitted")?.created_at ?? null;
  const needsAttention =
    app.status === "submitted" || missingInfo.length > 0 || missingDocs.length > 0;

  const setTab = (id: string) =>
    void navigate({ to: ".", search: { tab: id }, replace: true });

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 overflow-x-hidden">
      <ApplicationHeader
        back={<BackLink />}
        logo={
          app.logo_path ? (
            <SafeImage url={logoUrl} alt={`${heading} logo`} className="h-full w-full object-contain" />
          ) : (
            <Building2 className="h-6 w-6 text-muted-foreground" />
          )
        }
        businessName={heading}
        contactName={app.contact_name}
        applicationId={app.id}
        status={app.status}
        submittedAt={submittedAt}
        updatedAt={app.updated_at}
        percent={percent}
        needsAttention={needsAttention}
      />

      <TabNav tabs={TABS} active={activeTab} onSelect={setTab} />

      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <ProgressCard percent={percent} />
            <MissingInfoCard items={missingInfo} />
            <MissingDocsCard items={missingDocs} />
            <InsuranceCard status={app.insurance_status} />
          </div>

          <section className="card-panel space-y-3">
            <h2 className="font-semibold">Application Summary</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Application ID" value={app.id} />
              <Field label="Status" value={STATUS_LABEL[app.status]} />
              <Field label="Submitted date" value={submittedAt ? new Date(submittedAt).toLocaleDateString() : null} />
              <Field label="Last updated" value={new Date(app.updated_at).toLocaleString()} />
              <Field label="Community rules" value={app.agreed_rules ? "Accepted" : "Not accepted"} />
              <Field label="Information accurate" value={app.confirmed_accurate ? "Confirmed" : "Not confirmed"} />
            </div>
          </section>

          <section className="card-panel space-y-2">
            <h2 className="font-semibold">Section Completion</h2>
            <SectionRow label="Business details" done={!!app.business_name && !!app.description} />
            <SectionRow label="Contact details" done={!!app.email && !!app.phone} />
            <SectionRow label="Services and areas" done={services.length > 0 && areas.length > 0} />
            <SectionRow label="Logo and photos" done={gallery.length > 0} />
            <SectionRow label="Documents" done={missingDocs.length === 0} />
          </section>

          <section className="card-panel space-y-3">
            <h2 className="font-semibold">Latest Activity</h2>
            {history.length === 0 ? (
              <p className="text-sm italic text-muted-foreground">No activity recorded yet</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {history.slice(0, 3).map((h) => (
                  <li key={h.id} className="rounded-lg border border-white/10 bg-white/5 p-2">
                    <p className="font-medium">{STATUS_LABEL[h.status]}</p>
                    <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {activeTab === "business" && (
        <div className="space-y-4">
          <Section title="Business Details">
            <Field label="Business or trading name" value={app.business_name} />
            <Field label="Main operating area" value={app.main_area} />
            <Field label="Website" value={app.website} />
            <Field label="Facebook page" value={app.facebook} />
            <div className="sm:col-span-2">
              <Field label="Short business description" value={app.description} />
            </div>
          </Section>

          <Section title="Contact Details">
            <Field label="Contact name" value={app.contact_name} />
            <Field label="Email address" value={app.email} />
            <Field label="Phone number" value={app.phone} />
          </Section>

          <Section title="Services and Coverage">
            <Field label="Services offered" value={services.join(", ")} />
            <Field label="Areas covered" value={areas.join(", ")} />
          </Section>

          <Section title="Insurance and Qualifications">
            <Field label="Public liability insurance status" value={app.insurance_status} />
            <div className="sm:col-span-2">
              <Field label="Qualifications or certifications" value={app.qualifications} />
            </div>
          </Section>

          <Section title="References and Agreements">
            <div className="sm:col-span-2">
              <Field label="Customer references or review links" value={app.references_text} />
            </div>
            <Field label="Community rules agreement" value={app.agreed_rules ? "Agreed" : "Not agreed"} />
            <Field
              label="Confirmation that all information is accurate"
              value={app.confirmed_accurate ? "Confirmed" : "Not confirmed"}
            />
          </Section>
        </div>
      )}

      {activeTab === "photos" && (
        <PhotosPanel
          heading={heading}
          logoPath={app.logo_path}
          logoUrl={logoUrl}
          gallery={gallery}
          loading={mediaLoading}
        />
      )}

      {activeTab === "documents" && (
        <ApplicationDocuments
          applicationId={app.id}
          insuranceStatus={app.insurance_status}
          insuranceEvidencePath={app.insurance_evidence_path}
          qualifications={app.qualifications}
        />
      )}

      {activeTab === "review" && (
        <div className="space-y-4">
          <ReviewChecklist applicationId={app.id} qualifications={app.qualifications} />
          <RequestMoreInfo
            applicationId={app.id}
            onRequested={() => {
              setRequestsKey((k) => k + 1);
              void load();
            }}
          />
          <InfoRequestList applicationId={app.id} role="admin" refreshKey={requestsKey} />
          <AdminNotes applicationId={app.id} />
        </div>
      )}


      {activeTab === "activity" && (
        <ActivityTimeline
          applicationId={app.id}
          role="admin"
          createdAt={app.created_at}
          ownerUserId={app.user_id}
        />
      )}

    </div>
  );
}

function SectionRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="min-w-0 truncate">{label}</span>
      <span className={done ? "text-emerald-400" : "text-orange-400"}>{done ? "Complete" : "Incomplete"}</span>
    </div>
  );
}

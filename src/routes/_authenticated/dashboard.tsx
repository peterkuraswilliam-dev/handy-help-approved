import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import {
  STATUS_LABEL,
  completionPercent,
  missingDocuments,
  missingFields,
  type AppStatus,
} from "@/lib/application-helpers";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  History,
  Images,
  LayoutGrid,
  MessageSquare,
  Pencil,
  Send,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { ContractorInsurancePanel } from "@/components/insurance/ContractorInsurancePanel";
import { InsuranceBadge } from "@/components/insurance/InsuranceBadge";
import { insuranceSummary } from "@/lib/insurance";
import { ApplicationDocuments } from "@/components/admin/ApplicationDocuments";
import { ActivityTimeline } from "@/components/application/ActivityTimeline";
import { InfoRequestList } from "@/components/application/InfoRequestList";
import { RespondToRequest } from "@/components/application/RespondToRequest";
import { InfoRequestBanner } from "@/components/application/InfoRequestBanner";
import { ApprovedProfilePanel } from "@/components/application/ApprovedProfilePanel";
import { SuspendedNotice } from "@/components/application/SuspendedNotice";

import { PhotosPanel, SafeImage, useGallery } from "@/components/application/PhotosPanel";
import {
  ApplicationHeader,
  MetricCard,
  MissingDocsCard,
  MissingInfoCard,
  ProgressCard,
  StatusBadge,
  TabNav,
  type TabDef,
} from "@/components/application/shared";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My Application — Handy Help Aberdeenshire" },
      {
        name: "description",
        content: "Track your Handy Help Aberdeenshire contractor application progress, photos and documents.",
      },
      { property: "og:title", content: "My Application — Handy Help Aberdeenshire" },
      {
        property: "og:description",
        content: "Track your contractor application progress with Handy Help Aberdeenshire.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { tab?: string } =>
    typeof search.tab === "string" ? { tab: search.tab } : {},
  component: Dashboard,
});

type Application = {
  id: string;
  user_id: string;
  status: AppStatus;
  business_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  main_area: string | null;
  description: string | null;
  website: string | null;
  facebook: string | null;
  insurance_status: string | null;
  insurance_evidence_path: string | null;
  insurance_provider: string | null;
  insurance_policy_type: string | null;
  insurance_expiry_date: string | null;
  insurance_verification_state: string | null;
  qualifications: string | null;
  agreed_rules: boolean;
  confirmed_accurate: boolean;
  approved_at: string | null;
  decision_reason: string | null;
  rejected_at: string | null;
  contractor_decision_message: string | null;
  logo_path: string | null;
  created_at: string;
  updated_at: string;
};

type HistoryRow = { id: string; status: AppStatus; reason: string | null; created_at: string };

function Dashboard() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();

  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState<Application | null>(null);
  const [services, setServices] = useState<{ id: string; service: string }[]>([]);
  const [areas, setAreas] = useState<{ id: string; area: string }[]>([]);
  const [docs, setDocs] = useState<{ id: string; kind: string; path: string }[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [requestsKey, setRequestsKey] = useState(0);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const { data: user } = await supabase.auth.getUser();
    const uid = user.user?.id;
    if (!uid) return;
    const { data: application } = await db
      .from("contractor_applications")
      .select("*")
      .eq("user_id", uid)
      .maybeSingle();
    const a = application as Application | null;
    setApp(a);
    if (a) {
      const [{ data: s }, { data: ar }, { data: d }, { data: h }] = await Promise.all([
        db.from("contractor_services").select("id,service").eq("application_id", a.id),
        db.from("contractor_areas").select("id,area").eq("application_id", a.id),
        db.from("contractor_documents").select("id,kind,path").eq("application_id", a.id),
        db
          .from("application_status_history")
          .select("id,status,reason,created_at")
          .eq("application_id", a.id)
          .order("created_at", { ascending: false }),
      ]);
      setServices((s as { id: string; service: string }[]) ?? []);
      setAreas((ar as { id: string; area: string }[]) ?? []);
      setDocs((d as { id: string; kind: string; path: string }[]) ?? []);
      setHistory((h as HistoryRow[]) ?? []);
    }
    setLoading(false);
  }

  const { logoUrl, gallery, loading: mediaLoading } = useGallery(app?.id ?? "", app?.logo_path ?? null);

  async function submitApp() {
    if (!app) return;
    const missing = missingFields(app as unknown as Record<string, unknown>, services.length, areas.length);
    if (missing.length) return toast.error("Complete: " + missing.join(", "));
    setBusy(true);
    const { error } = await supabase
      .from("contractor_applications")
      .update({ status: "submitted" })
      .eq("id", app.id);
    if (!error) {
      await db.from("application_status_history").insert({
        application_id: app.id,
        status: "submitted",
        changed_by: (await supabase.auth.getUser()).data.user?.id,
      });
      toast.success("Application submitted for review");
      await load();
    } else toast.error(error.message);
    setBusy(false);
  }

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  if (!app) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <div className="card-panel space-y-3">
          <h1 className="text-2xl font-bold">Start your application</h1>
          <p className="text-sm text-muted-foreground">
            You haven't started an Approved Contractor application yet.
          </p>
          <Link to="/application" className="btn-gold w-fit">
            <Pencil className="h-4 w-4" /> Start application
          </Link>
        </div>
      </div>
    );
  }

  const record = app as unknown as Record<string, unknown>;
  const percent = completionPercent(record, services.length, areas.length, docs.length);
  const missingInfo = missingFields(record, services.length, areas.length);
  const missingDocs = missingDocuments({
    insuranceStatus: app.insurance_status,
    insuranceDocs: docs.filter((d) => d.kind === "insurance").length,
    insuranceEvidencePath: app.insurance_evidence_path,
    qualifications: app.qualifications,
    qualificationDocs: docs.filter((d) => d.kind === "qualification").length,
    photos: gallery.length,
  });
  const submittedAt = [...history].reverse().find((h) => h.status === "submitted")?.created_at ?? null;
  const heading = app.business_name?.trim() || app.contact_name?.trim() || "My application";
  const approved = app.status === "approved";
  const suspended = app.status === "suspended";
  const canEdit = ["draft", "submitted", "more_info_required"].includes(app.status);
  const canResubmit =
    (app.status === "draft" || app.status === "more_info_required") && missingInfo.length === 0;

  const TABS: TabDef[] = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    { id: "application", label: "Application", icon: ClipboardList },
    { id: "photos", label: "Photos", icon: Images },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "activity", label: "Activity", icon: History },
    { id: "profile", label: "Approved Profile", icon: CheckCircle2, disabled: !approved && !suspended },
  ];

  const activeTab = TABS.some((t) => t.id === tab && !t.disabled) ? (tab as string) : "overview";
  const setTab = (id: string) => void navigate({ to: ".", search: { tab: id }, replace: true });

  const nextSteps: Record<AppStatus, string> = {
    draft: "Finish your application and submit it when you're ready.",
    submitted: "We have received your application and it is waiting to be reviewed.",
    under_review: "We are reviewing your application. We will contact you if we need anything else.",
    more_info_required: "We need a little more information. Please update your application and resubmit.",
    approved: "You are an Approved Contractor. Your public profile is now live.",
    rejected: "Your application was not approved at this time.",
    suspended: "Your listing is currently suspended.",
  };

  const latestUpdate = history[0] ?? null;

  const insuranceInput = {
    status: app.insurance_status,
    expiryDate: app.insurance_expiry_date,
    verificationState: app.insurance_verification_state,
  };
  const insuranceView = insuranceSummary(insuranceInput);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 overflow-x-hidden">
      <ApplicationHeader
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
      />

      <InfoRequestBanner
        applicationId={app.id}
        refreshKey={requestsKey}
        onGoToMessages={() => setTab("messages")}
      />

      {(insuranceView.state === "expired" ||
        insuranceView.state === "expiring_soon" ||
        insuranceView.state === "missing_expiry") && (
        <div
          className={`rounded-xl border p-4 ${
            insuranceView.state === "expired"
              ? "border-destructive/50 bg-destructive/10"
              : "border-[color:var(--color-gold)]/50 bg-[color:var(--color-gold)]/10"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">{insuranceView.label}</p>
            <InsuranceBadge input={insuranceInput} compact />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {insuranceView.detail} Please upload up-to-date insurance evidence.
          </p>
          <button className="btn-gold mt-3" onClick={() => setTab("documents")}>
            Update insurance
          </button>
        </div>
      )}

      <TabNav tabs={TABS} active={activeTab} onSelect={setTab} />


      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <ProgressCard percent={percent} />
            <MissingInfoCard items={missingInfo} />
            <MissingDocsCard items={missingDocs} />
            <MetricCard
              icon={ShieldCheck}
              tone={
                insuranceView.state === "valid"
                  ? "success"
                  : insuranceView.state === "expiring_soon" || insuranceView.state === "awaiting_review"
                    ? "gold"
                    : "warning"
              }
              value={insuranceView.shortLabel}
              label={`Insurance — expiry ${insuranceView.expiryText}`}
            />
          </div>

          {app.status === "more_info_required" && (
            <RespondToRequest
              applicationId={app.id}
              missingInfo={missingInfo}
              missingDocs={missingDocs}
              onOpenTab={setTab}
              onResubmitted={() => {
                setRequestsKey((k) => k + 1);
                void load();
              }}
            />
          )}

          {app.status === "approved" && (
            <section className="card-panel space-y-2 border-emerald-500/40 bg-emerald-500/10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge-approved">Approved Contractor</span>
                {app.approved_at && (
                  <span className="text-xs text-muted-foreground">
                    Approved on {new Date(app.approved_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="text-sm">Your public profile is live and shows the Approved Contractor badge.</p>
              {app.contractor_decision_message && <p className="text-sm">{app.contractor_decision_message}</p>}
            </section>
          )}

          {suspended && (
            <SuspendedNotice applicationId={app.id} contractorMessage={app.contractor_decision_message} />
          )}

          {app.status === "rejected" && (
            <section className="card-panel space-y-2 border-red-500/40 bg-red-500/10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-red-500/40 bg-red-500/15 px-3 py-1 text-xs font-medium text-red-300">
                  Application not approved
                </span>
                {app.rejected_at && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(app.rejected_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              {app.contractor_decision_message && <p className="text-sm">{app.contractor_decision_message}</p>}
            </section>
          )}

          <section className="card-panel space-y-2">
            <h2 className="font-semibold">What happens next</h2>
            <p className="text-sm text-muted-foreground">{nextSteps[app.status]}</p>
          </section>

          <section className="card-panel space-y-2">
            <h2 className="font-semibold">Latest update</h2>
            {latestUpdate ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={latestUpdate.status} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(latestUpdate.created_at).toLocaleString()}
                  </span>
                </div>
                {latestUpdate.reason && <p className="text-sm">{latestUpdate.reason}</p>}
              </>
            ) : (
              <p className="text-sm italic text-muted-foreground">No updates yet</p>
            )}
            {app.contractor_decision_message && (
              <p className="rounded-md border border-border bg-secondary/50 p-2 text-sm">
                <span className="font-medium">Message from the team:</span> {app.contractor_decision_message}
              </p>
            )}
          </section>

          <section className="card-panel space-y-3">
            <h2 className="font-semibold">Your actions</h2>
            <div className="flex flex-wrap gap-2">
              {canEdit && (
                <Link to="/application" className="btn-outline">
                  <Pencil className="h-4 w-4" /> Edit application
                </Link>
              )}
              {canEdit && (
                <Link to="/application" className="btn-outline">
                  <Upload className="h-4 w-4" /> Upload documents
                </Link>
              )}
              {canResubmit && (
                <button onClick={submitApp} disabled={busy} className="btn-gold">
                  <Send className="h-4 w-4" />
                  {app.status === "draft" ? "Submit application" : "Resubmit application"}
                </button>
              )}
              {approved && (
                <button type="button" onClick={() => setTab("profile")} className="btn-gold">
                  <ShieldCheck className="h-4 w-4" /> Manage public profile
                </button>
              )}
            </div>
          </section>
        </div>
      )}

      {activeTab === "application" && (
        <div className="space-y-4">
          <section className="card-panel space-y-3">
            <h2 className="font-semibold">Your application information</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Business or trading name" value={app.business_name} />
              <Field label="Main operating area" value={app.main_area} />
              <Field label="Contact name" value={app.contact_name} />
              <Field label="Email address" value={app.email} />
              <Field label="Phone number" value={app.phone} />
              <Field label="Insurance status" value={app.insurance_status} />
              <Field label="Website" value={app.website} />
              <Field label="Facebook page" value={app.facebook} />
              <Field label="Services" value={services.map((s) => s.service).join(", ")} />
              <Field label="Areas covered" value={areas.map((a) => a.area).join(", ")} />
              <div className="sm:col-span-2">
                <Field label="Business description" value={app.description} />
              </div>
              <div className="sm:col-span-2">
                <Field label="Qualifications" value={app.qualifications} />
              </div>
            </div>
            {canEdit && (
              <Link to="/application" className="btn-gold w-fit">
                <Pencil className="h-4 w-4" /> Edit application
              </Link>
            )}
          </section>
        </div>
      )}

      {activeTab === "photos" && (
        <PhotosPanel
          heading={heading}
          logoPath={app.logo_path}
          logoUrl={logoUrl}
          gallery={gallery}
          loading={mediaLoading}
          footer={
            canEdit ? (
              <Link to="/application" className="btn-outline w-fit">
                <Upload className="h-4 w-4" /> Upload or replace photos
              </Link>
            ) : undefined
          }
        />
      )}

      {activeTab === "documents" && (
        <div className="space-y-4">
          <ContractorInsurancePanel
            applicationId={app.id}
            userId={app.user_id}
            insuranceStatus={app.insurance_status}
            provider={app.insurance_provider}
            policyType={app.insurance_policy_type}
            expiryDate={app.insurance_expiry_date}
            verificationState={app.insurance_verification_state}
            onSaved={() => void load()}
          />
          <ApplicationDocuments
            applicationId={app.id}
            insuranceStatus={app.insurance_status}
            insuranceEvidencePath={app.insurance_evidence_path}
            qualifications={app.qualifications}
          />
          {canEdit && (
            <Link to="/application" className="btn-outline w-fit">
              <Upload className="h-4 w-4" /> Upload or replace documents
            </Link>
          )}
        </div>
      )}

      {activeTab === "messages" && (
        <div className="space-y-4">
          {app.status === "more_info_required" && (
            <RespondToRequest
              applicationId={app.id}
              missingInfo={missingInfo}
              missingDocs={missingDocs}
              onOpenTab={setTab}
              onResubmitted={() => {
                setRequestsKey((k) => k + 1);
                void load();
              }}
            />
          )}
          <InfoRequestList applicationId={app.id} role="contractor" refreshKey={requestsKey} />
        </div>
      )}

      {activeTab === "activity" && (
        <ActivityTimeline applicationId={app.id} role="contractor" createdAt={app.created_at} />
      )}

      {activeTab === "profile" && (
        suspended ? (
          <SuspendedNotice applicationId={app.id} contractorMessage={app.contractor_decision_message} />
        ) : (
          <ApprovedProfilePanel applicationId={app.id} approved={approved} gallery={gallery} />
        )
      )}


      <p className="text-center text-xs text-muted-foreground">
        Current status: {STATUS_LABEL[app.status]}
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  const text = value && value.trim().length > 0 ? value : "Not provided";
  const missing = text === "Not provided";
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`break-words whitespace-pre-wrap ${missing ? "italic text-muted-foreground" : ""}`}>
        {text}
      </p>
    </div>
  );
}

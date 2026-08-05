import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Sparkles, CircleAlert, CircleCheck, ChevronDown, FileWarning, LayoutGrid, Send, Eye, MessageCircleQuestion, BadgeCheck, type LucideIcon } from "lucide-react";
import { db } from "@/lib/db";
import { STATUS_LABEL, missingFields, type AppStatus } from "@/lib/application-helpers";
import { insuranceSummary, type InsuranceState } from "@/lib/insurance";
import { InsuranceBadge } from "@/components/insurance/InsuranceBadge";

type InsuranceFilter = "all" | InsuranceState;

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Handy Help Aberdeenshire" },
      {
        name: "description",
        content: "Admin dashboard for reviewing contractor applications.",
      },
    ],
  }),
  component: AdminApplicationList,
});

type ApplicationRow = {
  id: string;
  business_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  main_area: string | null;
  description: string | null;
  insurance_status: string | null;
  insurance_evidence_path: string | null;
  insurance_expiry_date: string | null;
  insurance_verification_state: string | null;
  logo_path: string | null;
  qualifications: string | null;
  references_text: string | null;
  agreed_rules: boolean;
  confirmed_accurate: boolean;
  status: AppStatus;
  created_at: string | null;
  updated_at: string | null;
};

type DocumentSummary = {
  required: string[];
  optional: string[];
};

function hasInsurance(value: string | null): boolean {
  const v = (value ?? "").trim().toLocaleLowerCase();
  if (!v) return false;
  return !["no", "none", "not held", "no insurance", "false"].includes(v);
}

function documentSummary(
  application: ApplicationRow,
  kinds: Set<string>,
  galleryCount: number,
): DocumentSummary {
  const required: string[] = [];
  const optional: string[] = [];

  if (hasInsurance(application.insurance_status)) {
    if (!kinds.has("insurance") && !application.insurance_evidence_path) {
      required.push("Insurance document missing");
    }
  }
  if (galleryCount === 0) required.push("No work photos uploaded");

  if (application.qualifications?.trim() && !kinds.has("qualification")) {
    required.push("Qualification document missing");
  }

  if (!kinds.has("logo") && !application.logo_path) {
    optional.push("Business logo missing");
  }

  return { required, optional };
}

// Insurance details are incomplete when no status was recorded, or the
// contractor says they are insured but no evidence exists.
function insuranceIncomplete(application: ApplicationRow, kinds: Set<string>): boolean {
  if (!application.insurance_status?.trim()) return true;
  if (!hasInsurance(application.insurance_status)) return false;
  return !kinds.has("insurance") && !application.insurance_evidence_path;
}




type StatusFilter = "all" | AppStatus;
type SortOption =
  | "recently_updated"
  | "oldest_updated"
  | "newest_submitted"
  | "oldest_submitted"
  | "business_name_asc"
  | "business_name_desc"
  | "status";

const STATUS_FILTERS: Array<{ label: string; value: StatusFilter }> = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Submitted", value: "submitted" },
  { label: "Under Review", value: "under_review" },
  { label: "More Information Required", value: "more_info_required" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Suspended", value: "suspended" },
];

const STATUS_BADGE_CLASS: Record<AppStatus, string> = {
  draft: "border-slate-500 bg-slate-600 text-white",
  submitted: "border-blue-500 bg-blue-600 text-white",
  under_review: "border-yellow-300 bg-yellow-400 text-slate-950",
  more_info_required: "border-orange-400 bg-orange-500 text-slate-950",
  approved: "border-green-500 bg-green-600 text-white",
  rejected: "border-red-500 bg-red-600 text-white",
  suspended: "border-red-950 bg-red-900 text-white",
};

const STATUS_ORDER: Record<AppStatus, number> = {
  submitted: 1,
  under_review: 2,
  more_info_required: 3,
  draft: 4,
  approved: 5,
  rejected: 6,
  suspended: 7,
};

const SORT_OPTIONS: Array<{ label: string; value: SortOption }> = [
  { label: "Recently Updated", value: "recently_updated" },
  { label: "Oldest Updated", value: "oldest_updated" },
  { label: "Newest Submitted", value: "newest_submitted" },
  { label: "Oldest Submitted", value: "oldest_submitted" },
  { label: "Business Name A–Z", value: "business_name_asc" },
  { label: "Business Name Z–A", value: "business_name_desc" },
  { label: "Application Status", value: "status" },
];

function AdminApplicationList() {
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("recently_updated");
  const [insuranceFilter, setInsuranceFilter] = useState<InsuranceFilter>("all");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [serviceCounts, setServiceCounts] = useState<Map<string, number>>(new Map());
  const [areaCounts, setAreaCounts] = useState<Map<string, number>>(new Map());
  const [expandedWarnings, setExpandedWarnings] = useState<Set<string>>(new Set());
  const [auxError, setAuxError] = useState(false);
  const [docKinds, setDocKinds] = useState<Map<string, Set<string>>>(new Map());
  const [galleryCounts, setGalleryCounts] = useState<Map<string, number>>(new Map());
  const [docError, setDocError] = useState(false);
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());
  const [moreInfoAt, setMoreInfoAt] = useState<Map<string, number>>(new Map());


  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(false);
    setAuxError(false);
    setDocError(false);

    let results;
    try {
      results = await Promise.all([
        db
          .from("contractor_applications")
          .select(
            "id,business_name,contact_name,email,phone,main_area,description,insurance_status,insurance_evidence_path,insurance_expiry_date,insurance_verification_state,logo_path,qualifications,references_text,agreed_rules,confirmed_accurate,status,created_at,updated_at",
          )
          .order("updated_at", { ascending: false }),
        db.from("contractor_services").select("application_id,service"),
        db.from("contractor_areas").select("application_id,area"),
        db.from("contractor_documents").select("application_id,kind"),
        db.from("contractor_gallery").select("application_id"),
        db
          .from("application_status_history")
          .select("application_id,status,created_at")
          .eq("status", "more_info_required"),
      ]);
    } catch {
      // Network failure — surface the retryable error state, never stale totals.
      setApplications([]);
      setError(true);
      setLoading(false);
      return;
    }

    const [
      { data, error: loadError },
      { data: servicesData, error: servicesError },
      { data: areasData, error: areasError },
      { data: documentsData, error: documentsError },
      { data: galleryData, error: galleryError },
      { data: historyData },
    ] = results;




    if (loadError) {
      setApplications([]);
      setError(true);
    } else {
      setApplications((data as ApplicationRow[]) ?? []);
    }

    if (servicesError || areasError) {
      setAuxError(true);
    }
    if (documentsError || galleryError) {
      setDocError(true);
    }

    const nextServiceCounts = new Map<string, number>();
    const nextAreaCounts = new Map<string, number>();
    for (const s of (servicesData as { application_id: string }[]) ?? []) {
      nextServiceCounts.set(s.application_id, (nextServiceCounts.get(s.application_id) ?? 0) + 1);
    }
    for (const a of (areasData as { application_id: string }[]) ?? []) {
      nextAreaCounts.set(a.application_id, (nextAreaCounts.get(a.application_id) ?? 0) + 1);
    }

    const nextDocKinds = new Map<string, Set<string>>();
    for (const d of (documentsData as { application_id: string; kind: string }[]) ?? []) {
      const set = nextDocKinds.get(d.application_id) ?? new Set<string>();
      set.add(d.kind);
      nextDocKinds.set(d.application_id, set);
    }
    const nextGalleryCounts = new Map<string, number>();
    for (const g of (galleryData as { application_id: string }[]) ?? []) {
      nextGalleryCounts.set(g.application_id, (nextGalleryCounts.get(g.application_id) ?? 0) + 1);
    }
    const nextMoreInfoAt = new Map<string, number>();
    for (const h of (historyData as { application_id: string; created_at: string }[]) ?? []) {
      const at = new Date(h.created_at).getTime();
      const prev = nextMoreInfoAt.get(h.application_id) ?? 0;
      if (at > prev) nextMoreInfoAt.set(h.application_id, at);
    }
    setMoreInfoAt(nextMoreInfoAt);
    setDocKinds(nextDocKinds);

    setGalleryCounts(nextGalleryCounts);
    setServiceCounts(nextServiceCounts);

    setAreaCounts(nextAreaCounts);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  function toggleWarning(id: string) {
    setExpandedWarnings((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleDocs(id: string) {
    setExpandedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }


  const insuranceOf = (application: ApplicationRow) =>
    insuranceSummary({
      status: application.insurance_status,
      expiryDate: application.insurance_expiry_date,
      verificationState: application.insurance_verification_state,
    });

  const statusFilteredApplications =
    selectedStatus === "all"
      ? applications
      : applications.filter((application) => application.status === selectedStatus);
  const insuranceFilteredApplications =
    insuranceFilter === "all"
      ? statusFilteredApplications
      : statusFilteredApplications.filter((application) => insuranceOf(application).state === insuranceFilter);
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
  const filteredApplications = normalizedSearch
    ? insuranceFilteredApplications.filter((application) =>
        [application.business_name, application.contact_name, application.email].some((value) =>
          value?.toLocaleLowerCase().includes(normalizedSearch),
        ),
      )
    : statusFilteredApplications;

  // Calculated from existing application, progress and document data.
  function needsAttention(application: ApplicationRow): boolean {
    if (application.status === "submitted") return true;
    const kinds = docKinds.get(application.id) ?? new Set<string>();
    if (!auxError) {
      const missing = missingFields(
        application as unknown as Record<string, unknown>,
        serviceCounts.get(application.id) ?? 0,
        areaCounts.get(application.id) ?? 0,
      );
      if (missing.length > 0) return true;
    }
    if (!docError) {
      const docs = documentSummary(application, kinds, galleryCounts.get(application.id) ?? 0);
      if (docs.required.length > 0) return true;
      if (insuranceIncomplete(application, kinds)) return true;
    }
    const ins = insuranceOf(application).state;
    if (ins === "expired" || ins === "expiring_soon" || ins === "missing_expiry") return true;
    if (application.status === "more_info_required") {
      const requestedAt = moreInfoAt.get(application.id);
      const updated = application.updated_at ? new Date(application.updated_at).getTime() : 0;
      if (requestedAt && updated > requestedAt) return true;
    }
    return false;
  }

  const visibleApplications = [...filteredApplications].sort((a, b) => {
    const aUpdated = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const bUpdated = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    const aSubmitted = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bSubmitted = b.created_at ? new Date(b.created_at).getTime() : 0;

    switch (sortOption) {
      case "recently_updated": {
        // Default order: applications needing attention first, then most recent.
        const priority = Number(needsAttention(b)) - Number(needsAttention(a));
        if (priority !== 0) return priority;
        return bUpdated - aUpdated;
      }
      case "oldest_updated":

        return (
          (a.updated_at ? aUpdated : Number.POSITIVE_INFINITY) -
          (b.updated_at ? bUpdated : Number.POSITIVE_INFINITY)
        );
      case "newest_submitted":
        return bSubmitted - aSubmitted;
      case "oldest_submitted":
        return (
          (a.created_at ? aSubmitted : Number.POSITIVE_INFINITY) -
          (b.created_at ? bSubmitted : Number.POSITIVE_INFINITY)
        );
      case "business_name_asc": {
        const aName = (a.business_name ?? a.contact_name ?? "").toLocaleLowerCase();
        const bName = (b.business_name ?? b.contact_name ?? "").toLocaleLowerCase();
        return aName.localeCompare(bName);
      }
      case "business_name_desc": {
        const aName = (a.business_name ?? a.contact_name ?? "").toLocaleLowerCase();
        const bName = (b.business_name ?? b.contact_name ?? "").toLocaleLowerCase();
        return bName.localeCompare(aName);
      }
      case "status":
        return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      default:
        return 0;
    }
  });

  const statusCounts = applications.reduce<Record<AppStatus, number>>((counts, application) => {
    counts[application.status] += 1;
    return counts;
  }, { draft: 0, submitted: 0, under_review: 0, more_info_required: 0, approved: 0, rejected: 0, suspended: 0 });

  return (
    <div className="cinematic-admin mx-auto max-w-5xl space-y-6">
      <Link to="/" className="btn-ghost -ml-2 inline-flex w-fit items-center gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to main app
      </Link>

      <header className="cinematic-admin-hero relative overflow-hidden rounded-2xl border border-[color:color-mix(in_oklch,var(--color-gold)_35%,var(--color-border))] px-6 py-8 sm:px-8">
        <div className="relative z-10 space-y-2">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-gold)]"><Sparkles className="h-4 w-4" /> Admin command centre</p>
        <h1 className="text-4xl font-bold sm:text-5xl">Contractor Applications</h1>
        <p className="text-muted-foreground">
          Review, prioritise and manage contractor applications for Handy Help Aberdeenshire.
        </p>
        </div>
        <div className="cinematic-admin-orb cinematic-admin-orb-one" aria-hidden="true" />
        <div className="cinematic-admin-orb cinematic-admin-orb-two" aria-hidden="true" />
      </header>

      {loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="card-panel min-h-[5.5rem] animate-pulse p-4">
              <div className="h-3 w-2/3 rounded bg-secondary/70" />
              <div className="mt-3 h-7 w-10 rounded bg-secondary/70" />
            </div>
          ))}
        </div>
      )}

      {!loading && !error && applications.length > 0 && (
        <>
          <div className="cinematic-summary grid grid-cols-2 gap-3 sm:grid-cols-5">
            <SummaryCard
              label="Total"
              value={applications.length}
              icon={LayoutGrid}
              selected={selectedStatus === "all"}
              onSelect={() => setSelectedStatus("all")}
            />
            <SummaryCard
              label="Submitted"
              value={statusCounts.submitted}
              icon={Send}
              selected={selectedStatus === "submitted"}
              onSelect={() => setSelectedStatus("submitted")}
            />
            <SummaryCard
              label="Under review"
              value={statusCounts.under_review}
              icon={Eye}
              selected={selectedStatus === "under_review"}
              onSelect={() => setSelectedStatus("under_review")}
            />
            <SummaryCard
              label="More info"
              value={statusCounts.more_info_required}
              icon={MessageCircleQuestion}
              selected={selectedStatus === "more_info_required"}
              onSelect={() => setSelectedStatus("more_info_required")}
            />
            <SummaryCard
              label="Approved"
              value={statusCounts.approved}
              icon={BadgeCheck}
              approved
              selected={selectedStatus === "approved"}
              onSelect={() => setSelectedStatus("approved")}
            />
          </div>

          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter applications by status"
          >
            {STATUS_FILTERS.map((filter) => {
              const selected = selectedStatus === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedStatus(filter.value)}
                  className={`min-h-11 rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
                    selected
                      ? "border-[color:var(--color-gold)] bg-[color:var(--color-gold)] text-[color:var(--color-primary-foreground)]"
                      : "border-border bg-secondary/40 text-foreground hover:border-[color:var(--color-gold)] hover:text-[color:var(--color-gold)]"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="application-search">
              Search contractor applications
            </label>
            <input
              id="application-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search contractor applications"
              className="min-h-11 w-full rounded-md border border-border bg-secondary/40 px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-[color:var(--color-gold)]"
            />
            {searchTerm && (
              <button
                type="button"
                className="btn-outline min-h-11 whitespace-nowrap"
                onClick={() => setSearchTerm("")}
              >
                Clear Search
              </button>
            )}
            <div className="flex w-full flex-col gap-1 sm:w-auto">
              <label htmlFor="insurance-filter" className="text-xs font-medium text-muted-foreground sm:sr-only">
                Filter by insurance
              </label>
              <select
                id="insurance-filter"
                aria-label="Filter by insurance"
                value={insuranceFilter}
                onChange={(event) => setInsuranceFilter(event.target.value as InsuranceFilter)}
                className="min-h-11 w-full rounded-md border border-border bg-secondary/40 px-3 text-sm text-foreground sm:w-[14rem]"
              >
                <option value="all">All insurance</option>
                <option value="valid">Insurance valid</option>
                <option value="expiring_soon">Expiring soon</option>
                <option value="expired">Expired</option>
                <option value="awaiting_review">Awaiting review</option>
                <option value="missing_expiry">Expiry missing</option>
                <option value="not_provided">Not provided</option>
              </select>
            </div>
            <div className="flex w-full flex-col gap-1 sm:w-auto">
              <label htmlFor="application-sort" className="text-xs font-medium text-muted-foreground sm:sr-only">
                Sort applications
              </label>
              <select
                id="application-sort"
                aria-label="Sort applications"
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value as SortOption)}
                className="min-h-11 w-full rounded-md border border-border bg-secondary/40 px-3 text-sm text-foreground sm:w-[14rem]"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}

      {loading && (
        <div className="space-y-3" aria-live="polite" aria-busy="true">
          <span className="sr-only">Loading contractor applications…</span>
          {[0, 1, 2].map((i) => (
            <div key={i} className="card-panel animate-pulse space-y-3 p-4" aria-hidden="true">
              <div className="h-4 w-1/2 rounded bg-secondary/70" />
              <div className="h-3 w-1/3 rounded bg-secondary/70" />
              <div className="flex gap-2">
                <div className="h-5 w-20 rounded-full bg-secondary/70" />
                <div className="h-5 w-28 rounded-full bg-secondary/70" />
              </div>
              <div className="h-2 w-full rounded bg-secondary/70" />
              <div className="h-9 w-full rounded bg-secondary/70" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <section className="card-panel space-y-3 py-10 text-center" role="alert">
          <h2 className="text-lg font-semibold">Applications could not be loaded</h2>
          <p className="text-sm text-muted-foreground">
            Please check your connection and try again.
          </p>
          <button className="btn-outline min-h-11" onClick={() => void loadApplications()}>
            Retry
          </button>
        </section>
      )}

      {!loading && !error && applications.length === 0 && (
        <section className="card-panel space-y-2 py-12 text-center">
          <h2 className="text-lg font-semibold">No contractor applications yet</h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            New contractor applications will appear here once they have been started.
          </p>
        </section>
      )}


      {!loading &&
        !error &&
        applications.length > 0 &&
        visibleApplications.length === 0 && (
          <section className="card-panel space-y-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {normalizedSearch
                ? "No contractor applications match your search."
                : "No applications match this status."}
            </p>
            <button
              type="button"
              className="btn-outline min-h-11"
              onClick={() =>

                normalizedSearch ? setSearchTerm("") : setSelectedStatus("all")
              }
            >
              {normalizedSearch ? "Clear Search" : "View All Applications"}
            </button>
          </section>
        )}

      {!loading && !error && visibleApplications.length > 0 && (
        <ul className="space-y-3">
          {visibleApplications.map((application) => {
            const contactName = application.contact_name?.trim() || "Not available";
            const title =
              application.business_name?.trim() ||
              application.contact_name?.trim() ||
              "Not available";
            const updatedDate = application.updated_at
              ? new Date(application.updated_at).toLocaleString()
              : "Not available";
            const services = serviceCounts.get(application.id) ?? 0;
            const areas = areaCounts.get(application.id) ?? 0;
            const missing = missingFields(application as unknown as Record<string, unknown>, services, areas);
            const completed = 10 - missing.length;
            const pct = Math.round((completed / 10) * 100);
            const expanded = expandedWarnings.has(application.id);
            const docs = documentSummary(
              application,
              docKinds.get(application.id) ?? new Set<string>(),
              galleryCounts.get(application.id) ?? 0,
            );
            const docsExpanded = expandedDocs.has(application.id);
            const docLabel =
              docs.required.length === 0
                ? "Documents complete"
                : docs.required.length === 1
                  ? docs.required[0]
                  : `${docs.required.length} documents or uploads missing`;
            const attention = needsAttention(application);



            return (
              <li
                key={application.id}
                className="cinematic-application-card card-panel flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <h2 className="truncate font-semibold">{title}</h2>
                  <p className="truncate text-sm text-muted-foreground">
                    Contact: {contactName}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 font-semibold ${STATUS_BADGE_CLASS[application.status]}`}
                    >
                      {STATUS_LABEL[application.status]}
                    </span>
                    {attention && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--color-gold)] bg-[color:var(--color-gold)] px-2 py-0.5 font-semibold text-[color:var(--color-primary-foreground)]">
                        <CircleAlert className="h-3.5 w-3.5" /> Needs Attention
                      </span>
                    )}
                    <InsuranceBadge
                      input={{
                        status: application.insurance_status,
                        expiryDate: application.insurance_expiry_date,
                        verificationState: application.insurance_verification_state,
                      }}
                      compact
                    />
                    <span>Last updated: {updatedDate}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground"><span>Application details</span><span>{completed}/10 completed</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-[color:var(--color-gold)]" style={{ width: `${pct}%` }} /></div>
                  </div>
                  <div className="space-y-1">
                    {auxError ? (
                      <p className="text-xs text-muted-foreground">Required information status unavailable</p>
                    ) : missing.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => toggleWarning(application.id)}
                        className="flex w-full items-center justify-between gap-2 rounded-md border border-orange-500/30 bg-orange-500/10 px-2.5 py-2 text-left text-xs font-semibold text-orange-400 transition-colors hover:bg-orange-500/20"
                        aria-expanded={expanded}
                      >
                        <span className="flex items-center gap-1.5">
                          <CircleAlert className="h-3.5 w-3.5" />
                          {missing.length} required field{missing.length === 1 ? "" : "s"} missing
                        </span>
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
                      </button>
                    ) : (
                      <p className="flex items-center gap-1.5 rounded-md border border-green-500/30 bg-green-500/10 px-2.5 py-2 text-xs font-semibold text-green-400">
                        <CircleCheck className="h-3.5 w-3.5" /> Required information complete
                      </p>
                    )}
                    {expanded && !auxError && missing.length > 0 && (
                      <ul className="list-disc space-y-1 pl-6 text-xs text-orange-300">
                        {missing.map((field) => <li key={field}>{field}</li>)}
                      </ul>
                    )}
                  </div>
                  <div className="space-y-1">
                    {docError ? (
                      <p className="text-xs text-muted-foreground">Document status unavailable</p>
                    ) : docs.required.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => toggleDocs(application.id)}
                        className="flex w-full items-center justify-between gap-2 rounded-md border border-orange-500/30 bg-orange-500/10 px-2.5 py-2 text-left text-xs font-semibold text-orange-400 transition-colors hover:bg-orange-500/20"
                        aria-expanded={docsExpanded}
                      >
                        <span className="flex items-center gap-1.5">
                          <FileWarning className="h-3.5 w-3.5" />
                          {docLabel}
                        </span>
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${docsExpanded ? "rotate-180" : ""}`} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleDocs(application.id)}
                        className="flex w-full items-center justify-between gap-2 rounded-md border border-green-500/30 bg-green-500/10 px-2.5 py-2 text-left text-xs font-semibold text-green-400"
                        aria-expanded={docsExpanded}
                      >
                        <span className="flex items-center gap-1.5">
                          <CircleCheck className="h-3.5 w-3.5" /> Documents complete
                        </span>
                        {docs.optional.length > 0 && (
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${docsExpanded ? "rotate-180" : ""}`} />
                        )}
                      </button>
                    )}
                    {docsExpanded && !docError && (
                      <ul className="space-y-1 pl-1 text-xs">
                        {docs.required.map((item) => (
                          <li key={item} className="text-orange-300">• {item}</li>
                        ))}
                        {docs.optional.map((item) => (
                          <li key={item} className="text-muted-foreground">• {item} (optional)</li>
                        ))}
                      </ul>
                    )}
                  </div>

                </div>
                <Link
                  to="/admin/applications/$applicationId"
                  params={{ applicationId: application.id }}
                  className="btn-gold whitespace-nowrap sm:self-center"
                >
                  Open Application
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  selected,
  onSelect,
  approved,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  selected: boolean;
  onSelect: () => void;
  approved?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`card-panel flex min-h-[5.5rem] w-full flex-col items-start gap-1 p-4 text-left transition-colors last:col-span-2 sm:last:col-span-1 ${
        selected
          ? "border-[color:var(--color-gold)] ring-1 ring-[color:var(--color-gold)]"
          : "hover:border-[color:var(--color-gold)]"
      }`}
    >
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon
          className={`h-4 w-4 ${approved ? "text-emerald-400" : "text-[color:var(--color-gold)]"}`}
        />
        {label}
      </span>
      <span
        className={`text-3xl font-bold ${approved ? "text-emerald-400" : "text-[color:var(--color-gold)]"}`}
      >
        {value}
      </span>
    </button>
  );
}


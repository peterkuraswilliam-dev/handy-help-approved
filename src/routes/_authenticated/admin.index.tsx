import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { STATUS_LABEL, type AppStatus } from "@/lib/application-helpers";

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
  qualifications: string | null;
  references_text: string | null;
  agreed_rules: boolean;
  confirmed_accurate: boolean;
  status: AppStatus;
  updated_at: string | null;
};

type StatusFilter = "all" | AppStatus;
type SortOption = "newest" | "oldest" | "business_name" | "status";

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

function AdminApplicationList() {
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(false);

    const { data, error: loadError } = await db
      .from("contractor_applications")
      .select("id,business_name,contact_name,email,phone,main_area,description,insurance_status,qualifications,references_text,agreed_rules,confirmed_accurate,status,updated_at")
      .order("updated_at", { ascending: false });

    if (loadError) {
      setApplications([]);
      setError(true);
    } else {
      setApplications((data as ApplicationRow[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  const statusFilteredApplications =
    selectedStatus === "all"
      ? applications
      : applications.filter((application) => application.status === selectedStatus);
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
  const filteredApplications = normalizedSearch
    ? statusFilteredApplications.filter((application) =>
        [application.business_name, application.contact_name, application.email].some((value) =>
          value?.toLocaleLowerCase().includes(normalizedSearch),
        ),
      )
    : statusFilteredApplications;
  const visibleApplications = [...filteredApplications].sort((a, b) => {
    if (sortOption === "business_name") return (a.business_name ?? a.contact_name ?? "").localeCompare(b.business_name ?? b.contact_name ?? "");
    if (sortOption === "status") return STATUS_LABEL[a.status].localeCompare(STATUS_LABEL[b.status]);
    const aDate = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const bDate = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    return sortOption === "oldest" ? aDate - bDate : bDate - aDate;
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

      {!loading && !error && applications.length > 0 && (
        <>
          <div className="cinematic-summary grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="Total" value={applications.length} />
            <SummaryCard label="Submitted" value={statusCounts.submitted} />
            <SummaryCard label="Under review" value={statusCounts.under_review} />
            <SummaryCard label="Approved" value={statusCounts.approved} />
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
            <select aria-label="Sort applications" value={sortOption} onChange={(event) => setSortOption(event.target.value as SortOption)} className="min-h-11 rounded-md border border-border bg-secondary/40 px-3 text-sm text-foreground">
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="business_name">Sort: Business name</option>
              <option value="status">Sort: Status</option>
            </select>
          </div>
        </>
      )}

      {loading && (
        <section
          className="card-panel py-12 text-center text-sm text-muted-foreground"
          aria-live="polite"
        >
          Loading applications…
        </section>
      )}

      {!loading && error && (
        <section className="card-panel space-y-3 py-10 text-center" role="alert">
          <p className="text-sm text-[color:var(--color-destructive,#ef4444)]">
            Applications could not be loaded. Please try again.
          </p>
          <button className="btn-outline" onClick={() => void loadApplications()}>
            Retry
          </button>
        </section>
      )}

      {!loading && !error && applications.length === 0 && (
        <section className="card-panel py-12 text-center">
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            No contractor applications have been submitted yet.
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
              className="btn-outline"
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
            const missing = [
              !application.business_name && "business name",
              !application.contact_name && "contact name",
              !application.email && "email",
              !application.phone && "phone",
              !application.main_area && "main area",
              !application.description && "description",
              !application.insurance_status && "insurance",
              !application.agreed_rules && "rules agreement",
              !application.confirmed_accurate && "accuracy confirmation",
            ].filter(Boolean) as string[];
            const completed = 9 - missing.length;

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
                  <p className="text-xs text-muted-foreground">
                    <span
                      className={`mr-2 inline-flex rounded-full border px-2 py-0.5 font-semibold ${STATUS_BADGE_CLASS[application.status]}`}
                    >
                      {STATUS_LABEL[application.status]}
                    </span>
                    Last updated: {updatedDate}
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground"><span>Application details</span><span>{completed}/9 completed</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-[color:var(--color-gold)]" style={{ width: `${(completed / 9) * 100}%` }} /></div>
                  </div>
                  {missing.length > 0 && <p className="text-xs text-[color:var(--color-gold)]">Missing: {missing.join(", ")}</p>}
                </div>
                <Link
                  to="/admin/$id"
                  params={{ id: application.id }}
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

function SummaryCard({ label, value }: { label: string; value: number }) {
  return <div className="card-panel p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-bold text-[color:var(--color-gold)]">{value}</p></div>;
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
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
  status: AppStatus;
  updated_at: string | null;
};

type StatusFilter = "all" | AppStatus;

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
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(false);

    const { data, error: loadError } = await db
      .from("contractor_applications")
      .select("id,business_name,contact_name,status,updated_at")
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

  const visibleApplications =
    selectedStatus === "all"
      ? applications
      : applications.filter((application) => application.status === selectedStatus);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/" className="btn-ghost -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back to main app
      </Link>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Contractor Applications</h1>
        <p className="text-muted-foreground">
          Review contractor applications for Handy Help Aberdeenshire.
        </p>
      </header>

      {!loading && !error && applications.length > 0 && (
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
              No applications match this status.
            </p>
            <button
              type="button"
              className="btn-outline"
              onClick={() => setSelectedStatus("all")}
            >
              View All Applications
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

            return (
              <li
                key={application.id}
                className="card-panel flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
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

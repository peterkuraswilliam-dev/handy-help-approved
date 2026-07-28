import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { STATUS_LABEL, type AppStatus } from "@/lib/application-helpers";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Handy Help Aberdeenshire" },
      { name: "description", content: "Admin dashboard for reviewing contractor applications." },
    ],
  }),
  beforeLoad: async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) throw redirect({ to: "/auth" });
    const { data, error } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
    if (error || !data) throw redirect({ to: "/dashboard" });
  },
  component: Admin,
});

type Row = {
  id: string;
  business_name: string | null;
  contact_name: string | null;
  status: AppStatus;
  updated_at: string | null;
};

function Admin() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await db
      .from("contractor_applications")
      .select("id,business_name,contact_name,status,updated_at")
      .order("updated_at", { ascending: false });
    if (error) {
      setError(error.message);
      setRows(null);
    } else {
      setRows((data as Row[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <Link to="/" className="btn-ghost -ml-2">
          <ArrowLeft className="h-4 w-4" /> Back to main app
        </Link>
      </div>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Contractor Applications</h1>
        <p className="text-muted-foreground">
          Review and manage contractor applications for Handy Help Aberdeenshire.
        </p>
      </header>

      <div className="rounded-md border border-[color:var(--color-gold)]/40 bg-[color:var(--color-gold)]/10 px-4 py-3 text-sm font-medium">
        Free while the Handy Help Aberdeenshire application is being developed.
      </div>

      {loading && (
        <section className="card-panel text-center py-12 text-sm text-muted-foreground">
          Loading applications…
        </section>
      )}

      {!loading && error && (
        <section className="card-panel text-center py-10 space-y-3">
          <p className="text-sm text-[color:var(--color-destructive,#ef4444)]">
            Couldn't load applications: {error}
          </p>
          <button className="btn-outline" onClick={() => void load()}>Retry</button>
        </section>
      )}

      {!loading && !error && rows && rows.length === 0 && (
        <section className="card-panel text-center py-12">
          <h2 className="text-lg font-semibold text-[color:var(--color-gold)]">
            No applications yet
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Contractor applications will appear here as they are submitted.
          </p>
        </section>
      )}

      {!loading && !error && rows && rows.length > 0 && (
        <ul className="space-y-3">
          {rows.map((r) => {
            const title = r.business_name?.trim() || r.contact_name?.trim() || "(no name)";
            const updated = r.updated_at
              ? new Date(r.updated_at).toLocaleString()
              : "Not available";
            return (
              <li key={r.id} className="card-panel flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                <div className="min-w-0">
                  <h2 className="font-semibold truncate">{title}</h2>
                  <p className="text-sm text-muted-foreground truncate">
                    {r.contact_name || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="badge-status mr-2">{STATUS_LABEL[r.status]}</span>
                    Updated: {updated}
                  </p>
                </div>
                <Link
                  to="/admin/applications/$applicationId"
                  params={{ applicationId: r.id }}
                  className="btn-gold sm:self-center whitespace-nowrap"
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

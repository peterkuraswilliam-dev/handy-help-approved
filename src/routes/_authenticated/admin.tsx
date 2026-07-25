import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_LABEL, type AppStatus } from "@/lib/application-helpers";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Handy Help Aberdeenshire" }] }),
  component: Admin,
});

const STATUSES: (AppStatus | "all")[] = ["all", "submitted", "under_review", "more_info_required", "approved", "rejected", "suspended", "draft"];

type Row = {
  id: string; user_id: string; business_name: string | null; contact_name: string | null;
  status: AppStatus; created_at: string; email: string | null;
};

function Admin() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [filter, setFilter] = useState<(AppStatus | "all")>("submitted");
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => { void checkAdmin(); }, []);
  useEffect(() => { if (isAdmin) void load(); }, [filter, isAdmin]);

  async function checkAdmin() {
    const { data: user } = await supabase.auth.getUser();
    const uid = user.user?.id;
    if (!uid) return;
    const { data } = await supabase.from("user_roles" as never).select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
    setIsAdmin(!!data);
    setLoading(false);
  }

  async function load() {
    let q = supabase.from("contractor_applications" as never)
      .select("id,user_id,business_name,contact_name,status,created_at,email")
      .order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) { toast.error(error.message); return; }
    setRows((data as Row[]) ?? []);
  }

  if (loading) return <p className="text-muted-foreground">Loading…</p>;
  if (isAdmin === false) {
    return (
      <div className="max-w-md mx-auto card-panel text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-[color:var(--color-gold)]" />
        <h1 className="text-xl font-semibold mt-2">Admin access required</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your account doesn't have admin permissions. Ask an existing admin to grant them.
        </p>
        <Link to="/dashboard" className="btn-outline mt-4">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/dashboard" className="btn-ghost -ml-2"><ArrowLeft className="h-4 w-4" /> Dashboard</Link>
        <h1 className="text-2xl font-bold">Admin</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`badge-status ${filter === s ? "!bg-[color:var(--color-gold)] !text-[color:var(--color-primary-foreground)]" : ""}`}>
            {s === "all" ? "All" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>
      <div className="card-panel p-0 overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No applications in this view.</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id}
                onClick={() => router.navigate({ to: "/admin/$id", params: { id: r.id } })}
                className="p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-secondary/40">
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.business_name ?? "(no business name)"}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.contact_name} · {r.email} · {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`badge-status ${r.status === "approved" ? "!border-[color:var(--color-success)] !text-[color:var(--color-success)]" : ""}`}>
                  {STATUS_LABEL[r.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

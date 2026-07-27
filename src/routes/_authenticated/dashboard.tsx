import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { STATUS_LABEL, completionPercent, missingFields, type AppStatus } from "@/lib/application-helpers";
import { toast } from "sonner";
import { CheckCircle2, LogOut, ShieldCheck, Pencil, Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Contractor Dashboard — Handy Help Aberdeenshire" }] }),
  component: Dashboard,
});

type Application = {
  id: string;
  status: AppStatus;
  business_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  main_area: string | null;
  description: string | null;
  insurance_status: string | null;
  agreed_rules: boolean;
  confirmed_accurate: boolean;
  approved_at: string | null;
  decision_reason: string | null;
  logo_path: string | null;
};

function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [app, setApp] = useState<Application | null>(null);
  const [services, setServices] = useState<{ id: string; service: string }[]>([]);
  const [areas, setAreas] = useState<{ id: string; area: string }[]>([]);
  const [docs, setDocs] = useState<{ id: string; kind: string; path: string }[]>([]);
  const [notes, setNotes] = useState<{ note: string; created_at: string }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const { data: user } = await supabase.auth.getUser();
    const uid = user.user?.id;
    if (!uid) return;
    const [{ data: roles }, { data: application }] = await Promise.all([
      db.from("user_roles").select("role").eq("user_id", uid),
      db.from("contractor_applications").select("*").eq("user_id", uid).maybeSingle(),
    ]);
    setIsAdmin(!!(roles as { role: string }[] | null)?.some((r) => r.role === "admin"));
    const a = application as Application | null;
    setApp(a);
    if (a) {
      const [{ data: s }, { data: ar }, { data: d }, { data: n }] = await Promise.all([
        db.from("contractor_services").select("id,service").eq("application_id", a.id),
        db.from("contractor_areas").select("id,area").eq("application_id", a.id),
        db.from("contractor_documents").select("id,kind,path").eq("application_id", a.id),
        a.status === "more_info_required"
          ? db.from("admin_notes").select("note,created_at").eq("application_id", a.id).order("created_at", { ascending: false })
          : Promise.resolve({ data: [] }),
      ]);
      setServices((s as { id: string; service: string }[]) ?? []);
      setAreas((ar as { id: string; area: string }[]) ?? []);
      setDocs((d as { id: string; kind: string; path: string }[]) ?? []);
      setNotes((n as { note: string; created_at: string }[]) ?? []);
    }
    setLoading(false);
  }

  async function submitApp() {
    if (!app) return;
    const missing = missingFields(app as unknown as Record<string, unknown>, services.length, areas.length);
    if (missing.length) return toast.error("Complete: " + missing.join(", "));
    setBusy(true);
    const { error } = await supabase
      .from("contractor_applications")
      .update({ status: "submitted" }).eq("id", app.id);
    if (!error) {
      await db.from("application_status_history").insert({
        application_id: app.id, status: "submitted",
        changed_by: (await supabase.auth.getUser()).data.user?.id,
      });
      toast.success("Application submitted for review");
      await load();
    } else toast.error(error.message);
    setBusy(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  }

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  const pct = completionPercent(app as unknown as Record<string, unknown>, services.length, areas.length, docs.length);
  const missing = missingFields(app as unknown as Record<string, unknown>, services.length, areas.length);
  const status = app?.status ?? "draft";
  const canEdit = ["draft", "submitted", "more_info_required"].includes(status);

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Contractor Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your Approved Contractor application.</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && <Link to="/admin" className="btn-outline"><ShieldCheck className="h-4 w-4" /> Admin</Link>}
          <button onClick={signOut} className="btn-ghost"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="card-panel">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            {status === "approved"
              ? <span className="badge-approved"><CheckCircle2 className="h-3.5 w-3.5" /> Approved Contractor</span>
              : <span className="badge-status">{STATUS_LABEL[status]}</span>}
          </div>
          {status === "approved" && app?.approved_at && (
            <span className="text-xs text-muted-foreground">Approved {new Date(app.approved_at).toLocaleDateString()}</span>
          )}
        </div>
        {app?.decision_reason && (
          <p className="mt-3 text-sm bg-secondary/50 rounded-md p-2 border border-border">
            <span className="font-medium">Admin note:</span> {app.decision_reason}
          </p>
        )}
      </div>

      {status !== "approved" && (
        <div className="card-panel space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Application progress</span><span className="text-[color:var(--color-gold)] font-semibold">{pct}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-[color:var(--color-gold)] transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          {missing.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">Missing information</p>
              <ul className="text-sm text-muted-foreground list-disc ml-5">
                {missing.map((m) => <li key={m}>{m}</li>)}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            {canEdit && (
              <Link to="/application" className="btn-outline">
                <Pencil className="h-4 w-4" /> {app ? "Edit application" : "Start application"}
              </Link>
            )}
            {(status === "draft" || status === "more_info_required") && app && (
              <button onClick={submitApp} disabled={busy || missing.length > 0} className="btn-gold">
                <Send className="h-4 w-4" /> Submit application
              </button>
            )}
          </div>
        </div>
      )}

      {notes.length > 0 && (
        <div className="card-panel">
          <h3 className="font-semibold mb-2">Requests from admin</h3>
          <ul className="space-y-2 text-sm">
            {notes.map((n, i) => (
              <li key={i} className="border border-border rounded p-2">
                <span className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
                <p>{n.note}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card-panel grid grid-cols-3 text-center text-sm gap-3">
        <Stat label="Services" value={services.length} />
        <Stat label="Areas" value={areas.length} />
        <Stat label="Documents" value={docs.length} />
      </div>

      {status === "approved" && app && (
        <div className="card-panel space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">{app.business_name}</h2>
            <span className="badge-approved"><CheckCircle2 className="h-3.5 w-3.5" /> Approved</span>
          </div>
          <p className="text-sm text-muted-foreground">{app.description}</p>
          {services.length > 0 && (
            <p className="text-sm"><span className="text-muted-foreground">Services: </span>{services.map(s=>s.service).join(", ")}</p>
          )}
          {areas.length > 0 && (
            <p className="text-sm"><span className="text-muted-foreground">Areas: </span>{areas.map(a=>a.area).join(", ")}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Link to="/contractors/$id" params={{ id: app.id }} className="btn-gold w-fit">
              <CheckCircle2 className="h-4 w-4" /> View public profile
            </Link>
            <Link to="/application" className="btn-outline w-fit"><Pencil className="h-4 w-4" /> Edit profile</Link>
          </div>
          <p className="text-xs text-muted-foreground border-t border-border pt-3">
            Approval confirms that the contractor has supplied the requested information and agreed
            to follow our community standards. Customers should still carry out their own checks
            before agreeing to any work.
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-2xl font-bold text-[color:var(--color-gold)]">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

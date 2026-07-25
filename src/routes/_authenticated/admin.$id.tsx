import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { STATUS_LABEL, getSignedUrl, type AppStatus } from "@/lib/application-helpers";
import { ArrowLeft, CheckCircle2, XCircle, Pause, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/$id")({
  head: () => ({ meta: [{ title: "Review application — Handy Help Aberdeenshire" }] }),
  component: Review,
});

type App = {
  id: string; user_id: string; business_name: string | null; contact_name: string | null;
  email: string | null; phone: string | null; main_area: string | null;
  description: string | null; website: string | null; facebook: string | null;
  logo_path: string | null; insurance_status: string | null;
  qualifications: string | null; references_text: string | null;
  agreed_rules: boolean; confirmed_accurate: boolean;
  status: AppStatus; approved_at: string | null; decision_reason: string | null;
};

function Review() {
  const { id } = Route.useParams();
  const router = useRouter();
  const [app, setApp] = useState<App | null>(null);
  const [services, setServices] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [docs, setDocs] = useState<{ id: string; kind: string; path: string; original_name: string | null; url?: string }[]>([]);
  const [notes, setNotes] = useState<{ id: string; note: string; created_at: string }[]>([]);
  const [history, setHistory] = useState<{ status: AppStatus; reason: string | null; created_at: string }[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { void load(); }, [id]);

  async function load() {
    const { data } = await db.from("contractor_applications").select("*").eq("id", id).maybeSingle();
    const a = data as App | null;
    setApp(a);
    if (!a) return;
    if (a.logo_path) setLogoUrl(await getSignedUrl(a.logo_path));
    const [{ data: s }, { data: ar }, { data: d }, { data: n }, { data: h }] = await Promise.all([
      db.from("contractor_services").select("service").eq("application_id", id),
      db.from("contractor_areas").select("area").eq("application_id", id),
      db.from("contractor_documents").select("id,kind,path,original_name").eq("application_id", id),
      db.from("admin_notes").select("id,note,created_at").eq("application_id", id).order("created_at", { ascending: false }),
      db.from("application_status_history").select("status,reason,created_at").eq("application_id", id).order("created_at", { ascending: false }),
    ]);
    setServices(((s as { service: string }[]) ?? []).map(x => x.service));
    setAreas(((ar as { area: string }[]) ?? []).map(x => x.area));
    const rawDocs = (d as { id: string; kind: string; path: string; original_name: string | null }[]) ?? [];
    const withUrls = await Promise.all(rawDocs.map(async (x) => ({ ...x, url: (await getSignedUrl(x.path)) ?? undefined })));
    setDocs(withUrls);
    setNotes((n as { id: string; note: string; created_at: string }[]) ?? []);
    setHistory((h as { status: AppStatus; reason: string | null; created_at: string }[]) ?? []);
  }

  async function addNote() {
    if (!newNote.trim() || !app) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await db.from("admin_notes").insert({
      application_id: app.id, admin_id: u.user!.id, note: newNote.trim(),
    });
    if (error) return toast.error(error.message);
    setNewNote("");
    await load();
  }

  async function decide(status: AppStatus) {
    if (!app) return;
    setBusy(true);
    const patch: Record<string, unknown> = { status, decision_reason: reason || null };
    if (status === "approved") patch.approved_at = new Date().toISOString();
    const { error } = await db.from("contractor_applications").update(patch).eq("id", app.id);
    if (error) { toast.error(error.message); setBusy(false); return; }
    const { data: u } = await supabase.auth.getUser();
    await db.from("application_status_history").insert({
      application_id: app.id, status, reason: reason || null, changed_by: u.user!.id,
    });
    toast.success("Status updated to " + STATUS_LABEL[status]);
    setReason("");
    setBusy(false);
    await load();
  }

  if (!app) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Link to="/admin" className="btn-ghost -ml-2 text-sm"><ArrowLeft className="h-4 w-4" /> All applications</Link>
      <div className="card-panel space-y-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{app.business_name ?? "(no business name)"}</h1>
            <p className="text-sm text-muted-foreground">{app.contact_name} · {app.email} · {app.phone}</p>
          </div>
          <span className={`badge-status ${app.status === "approved" ? "!border-[color:var(--color-success)] !text-[color:var(--color-success)]" : ""}`}>
            {STATUS_LABEL[app.status]}
          </span>
        </div>
      </div>

      <div className="card-panel grid sm:grid-cols-2 gap-3 text-sm">
        {logoUrl && <img src={logoUrl} alt="Logo" className="col-span-full h-24 w-24 object-contain rounded border border-border" />}
        <Info label="Main area" value={app.main_area} />
        <Info label="Insurance" value={app.insurance_status} />
        <Info label="Website" value={app.website} />
        <Info label="Facebook" value={app.facebook} />
        <div className="col-span-full">
          <p className="text-xs text-muted-foreground">Description</p>
          <p>{app.description ?? "—"}</p>
        </div>
        <div><p className="text-xs text-muted-foreground">Services</p><p>{services.join(", ") || "—"}</p></div>
        <div><p className="text-xs text-muted-foreground">Areas</p><p>{areas.join(", ") || "—"}</p></div>
        <div className="col-span-full">
          <p className="text-xs text-muted-foreground">Qualifications</p>
          <p className="whitespace-pre-wrap">{app.qualifications ?? "—"}</p>
        </div>
        <div className="col-span-full">
          <p className="text-xs text-muted-foreground">References</p>
          <p className="whitespace-pre-wrap">{app.references_text ?? "—"}</p>
        </div>
        <div className="col-span-full flex gap-3 text-xs text-muted-foreground">
          <span>Rules agreed: {app.agreed_rules ? "✓" : "✗"}</span>
          <span>Info confirmed: {app.confirmed_accurate ? "✓" : "✗"}</span>
        </div>
      </div>

      <div className="card-panel">
        <h2 className="font-semibold mb-2">Documents</h2>
        {docs.length === 0 ? <p className="text-sm text-muted-foreground">No documents uploaded.</p> : (
          <ul className="text-sm space-y-1">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between border border-border rounded px-2 py-1">
                <span>{d.kind} · {d.original_name ?? d.path.split("/").pop()}</span>
                {d.url && <a href={d.url} target="_blank" rel="noreferrer" className="text-[color:var(--color-gold)]">Open</a>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card-panel space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><MessageCircle className="h-4 w-4" /> Private admin notes</h2>
        <div className="flex gap-2">
          <input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a private note…" maxLength={1000} />
          <button className="btn-outline" onClick={addNote}>Add</button>
        </div>
        <ul className="space-y-2 text-sm">
          {notes.map((n) => (
            <li key={n.id} className="border border-border rounded p-2">
              <span className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
              <p>{n.note}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="card-panel space-y-3">
        <h2 className="font-semibold">Decision</h2>
        <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (shown to contractor for request/rejection/suspension)" maxLength={1000} />
        <div className="flex flex-wrap gap-2">
          <button className="btn-gold" disabled={busy} onClick={() => decide("approved")}><CheckCircle2 className="h-4 w-4" /> Approve</button>
          <button className="btn-outline" disabled={busy} onClick={() => decide("more_info_required")}>Request more info</button>
          <button className="btn-outline" disabled={busy} onClick={() => decide("under_review")}>Mark under review</button>
          <button className="btn-outline" disabled={busy} onClick={() => decide("rejected")}><XCircle className="h-4 w-4" /> Reject</button>
          {app.status === "approved" && (
            <button className="btn-outline" disabled={busy} onClick={() => decide("suspended")}><Pause className="h-4 w-4" /> Suspend</button>
          )}
        </div>
      </div>

      <div className="card-panel">
        <h2 className="font-semibold mb-2">Status history</h2>
        <ul className="text-sm space-y-1">
          {history.map((h, i) => (
            <li key={i} className="flex justify-between border-b border-border py-1">
              <span>{STATUS_LABEL[h.status]}{h.reason ? ` — ${h.reason}` : ""}</span>
              <span className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><p>{value || "—"}</p></div>;
}

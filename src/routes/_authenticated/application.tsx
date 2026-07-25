import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadFile } from "@/lib/application-helpers";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Upload, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/application")({
  head: () => ({ meta: [{ title: "Application — Handy Help Aberdeenshire" }] }),
  component: ApplicationForm,
});

const emptyApp = {
  business_name: "", contact_name: "", email: "", phone: "",
  main_area: "", description: "", website: "", facebook: "",
  insurance_status: "", qualifications: "", references_text: "",
  agreed_rules: false, confirmed_accurate: false,
};

type Doc = { id: string; kind: string; path: string; original_name: string | null };

function ApplicationForm() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [appId, setAppId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("draft");
  const [form, setForm] = useState(emptyApp);
  const [services, setServices] = useState<{ id?: string; service: string }[]>([]);
  const [areas, setAreas] = useState<{ id?: string; area: string }[]>([]);
  const [newService, setNewService] = useState("");
  const [newArea, setNewArea] = useState("");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [gallery, setGallery] = useState<{ id: string; path: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    const u = userData.user?.id;
    if (!u) return;
    setUid(u);
    const { data: existing } = await supabase
      .from("contractor_applications").select("*").eq("user_id", u).maybeSingle();
    const e = existing as (typeof emptyApp & { id: string; status: string; logo_path: string | null }) | null;
    if (e) {
      setAppId(e.id);
      setStatus(e.status);
      setLogoPath(e.logo_path);
      setForm({
        business_name: e.business_name ?? "", contact_name: e.contact_name ?? "",
        email: e.email ?? "", phone: e.phone ?? "", main_area: e.main_area ?? "",
        description: e.description ?? "", website: e.website ?? "", facebook: e.facebook ?? "",
        insurance_status: e.insurance_status ?? "", qualifications: e.qualifications ?? "",
        references_text: e.references_text ?? "", agreed_rules: e.agreed_rules, confirmed_accurate: e.confirmed_accurate,
      });
      const [{ data: s }, { data: ar }, { data: d }, { data: g }] = await Promise.all([
        supabase.from("contractor_services").select("id,service").eq("application_id", e.id),
        supabase.from("contractor_areas").select("id,area").eq("application_id", e.id),
        supabase.from("contractor_documents").select("id,kind,path,original_name").eq("application_id", e.id),
        supabase.from("contractor_gallery").select("id,path").eq("application_id", e.id),
      ]);
      setServices((s as { id: string; service: string }[]) ?? []);
      setAreas((ar as { id: string; area: string }[]) ?? []);
      setDocs((d as Doc[]) ?? []);
      setGallery((g as { id: string; path: string }[]) ?? []);
    } else {
      const { data: profile } = await supabase.from("profiles").select("email,full_name").eq("id", u).maybeSingle();
      const p = profile as { email: string | null; full_name: string | null } | null;
      setForm((f) => ({ ...f, email: p?.email ?? "", contact_name: p?.full_name ?? "" }));
    }
  }

  function upd<K extends keyof typeof emptyApp>(k: K, v: (typeof emptyApp)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function ensureApp(): Promise<string | null> {
    if (appId) return appId;
    if (!uid) return null;
    const { data, error } = await supabase
      .from("contractor_applications")
      .insert({ user_id: uid, status: "draft", ...form })
      .select("id").single();
    if (error) { toast.error(error.message); return null; }
    const id = (data as { id: string }).id;
    setAppId(id);
    return id;
  }

  async function save() {
    setSaving(true);
    try {
      const id = await ensureApp();
      if (!id) return;
      const { error } = await supabase.from("contractor_applications")
        .update({ ...form, logo_path: logoPath }).eq("id", id);
      if (error) throw error;
      toast.success("Saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally { setSaving(false); }
  }

  async function addService() {
    if (!newService.trim()) return;
    const id = await ensureApp(); if (!id) return;
    const { data, error } = await supabase.from("contractor_services")
      .insert({ application_id: id, service: newService.trim() }).select("id,service").single();
    if (error) return toast.error(error.message);
    setServices((s) => [...s, data as { id: string; service: string }]);
    setNewService("");
  }
  async function removeService(id?: string) {
    if (!id) return;
    await supabase.from("contractor_services").delete().eq("id", id);
    setServices((s) => s.filter((x) => x.id !== id));
  }
  async function addArea() {
    if (!newArea.trim()) return;
    const id = await ensureApp(); if (!id) return;
    const { data, error } = await supabase.from("contractor_areas")
      .insert({ application_id: id, area: newArea.trim() }).select("id,area").single();
    if (error) return toast.error(error.message);
    setAreas((a) => [...a, data as { id: string; area: string }]);
    setNewArea("");
  }
  async function removeArea(id?: string) {
    if (!id) return;
    await supabase.from("contractor_areas").delete().eq("id", id);
    setAreas((a) => a.filter((x) => x.id !== id));
  }

  async function handleUpload(kind: "logo" | "insurance" | "qualification" | "gallery", file: File) {
    if (!uid) return;
    const id = await ensureApp(); if (!id) return;
    try {
      const path = await uploadFile(uid, kind, file);
      if (kind === "logo") {
        setLogoPath(path);
        await supabase.from("contractor_applications").update({ logo_path: path }).eq("id", id);
        toast.success("Logo uploaded");
      } else if (kind === "gallery") {
        const { data } = await supabase.from("contractor_gallery")
          .insert({ application_id: id, path }).select("id,path").single();
        setGallery((g) => [...g, data as { id: string; path: string }]);
        toast.success("Photo added");
      } else {
        const { data } = await supabase.from("contractor_documents")
          .insert({ application_id: id, kind, path, original_name: file.name })
          .select("id,kind,path,original_name").single();
        setDocs((d) => [...d, data as Doc]);
        toast.success("Document uploaded");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function removeDoc(d: Doc) {
    await supabase.storage.from("contractor-files").remove([d.path]);
    await supabase.from("contractor_documents").delete().eq("id", d.id);
    setDocs((x) => x.filter((y) => y.id !== d.id));
  }

  async function removeGalleryItem(g: { id: string; path: string }) {
    await supabase.storage.from("contractor-files").remove([g.path]);
    await supabase.from("contractor_gallery").delete().eq("id", g.id);
    setGallery((x) => x.filter((y) => y.id !== g.id));
  }

  const locked = ["under_review", "approved", "rejected", "suspended"].includes(status);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Link to="/dashboard" className="btn-ghost -ml-2 text-sm"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
      <h1 className="text-2xl font-bold">Contractor Application</h1>
      {locked && <p className="text-sm text-[color:var(--color-gold)]">This application is locked while under review. You'll be notified if we need more information.</p>}

      <Section title="Business details">
        <Field label="Business or trading name"><input value={form.business_name} onChange={(e) => upd("business_name", e.target.value)} disabled={locked} maxLength={120} /></Field>
        <Field label="Contact name"><input value={form.contact_name} onChange={(e) => upd("contact_name", e.target.value)} disabled={locked} maxLength={100} /></Field>
        <Field label="Email address"><input type="email" value={form.email} onChange={(e) => upd("email", e.target.value)} disabled={locked} /></Field>
        <Field label="Phone number"><input value={form.phone} onChange={(e) => upd("phone", e.target.value)} disabled={locked} maxLength={30} /></Field>
        <Field label="Main operating area"><input value={form.main_area} onChange={(e) => upd("main_area", e.target.value)} disabled={locked} placeholder="e.g. Aberdeen" /></Field>
        <Field label="Short business description">
          <textarea rows={3} value={form.description} onChange={(e) => upd("description", e.target.value)} disabled={locked} maxLength={1000} />
        </Field>
        <Field label="Website"><input value={form.website} onChange={(e) => upd("website", e.target.value)} disabled={locked} placeholder="https://…" /></Field>
        <Field label="Facebook page"><input value={form.facebook} onChange={(e) => upd("facebook", e.target.value)} disabled={locked} /></Field>
      </Section>

      <Section title="Areas covered">
        <TagList items={areas.map(a => a.area)} onRemove={(i) => removeArea(areas[i].id)} disabled={locked} />
        {!locked && (
          <div className="flex gap-2 mt-2">
            <input value={newArea} onChange={(e) => setNewArea(e.target.value)} placeholder="e.g. Aberdeen, Ellon" />
            <button className="btn-outline" onClick={addArea}>Add</button>
          </div>
        )}
      </Section>

      <Section title="Services offered">
        <TagList items={services.map(s => s.service)} onRemove={(i) => removeService(services[i].id)} disabled={locked} />
        {!locked && (
          <div className="flex gap-2 mt-2">
            <input value={newService} onChange={(e) => setNewService(e.target.value)} placeholder="e.g. Plumbing" />
            <button className="btn-outline" onClick={addService}>Add</button>
          </div>
        )}
      </Section>

      <Section title="Business logo">
        {logoPath && <p className="text-xs text-muted-foreground mb-2">Uploaded ✓</p>}
        <FileInput accept="image/*" disabled={locked} onFile={(f) => handleUpload("logo", f)} />
      </Section>

      <Section title="Photos of previous work">
        <div className="grid grid-cols-3 gap-2 mb-2">
          {gallery.map((g) => (
            <div key={g.id} className="relative border border-border rounded p-2 text-xs">
              <span className="block truncate">{g.path.split("/").pop()}</span>
              {!locked && <button className="absolute -top-2 -right-2 bg-destructive rounded-full p-0.5" onClick={() => removeGalleryItem(g)}><X className="h-3 w-3" /></button>}
            </div>
          ))}
        </div>
        <FileInput accept="image/*" disabled={locked} onFile={(f) => handleUpload("gallery", f)} />
      </Section>

      <Section title="Public liability insurance">
        <Field label="Insurance status">
          <select value={form.insurance_status} onChange={(e) => upd("insurance_status", e.target.value)} disabled={locked}>
            <option value="">Select…</option>
            <option value="active">Active</option>
            <option value="pending">Renewing / Pending</option>
            <option value="none">Not currently held</option>
          </select>
        </Field>
        <DocList docs={docs.filter(d => d.kind === "insurance")} onRemove={removeDoc} locked={locked} />
        <FileInput accept="image/*,application/pdf" disabled={locked} onFile={(f) => handleUpload("insurance", f)} />
      </Section>

      <Section title="Qualifications or certifications">
        <Field label="List your qualifications"><textarea rows={3} value={form.qualifications} onChange={(e) => upd("qualifications", e.target.value)} disabled={locked} maxLength={1000} /></Field>
        <DocList docs={docs.filter(d => d.kind === "qualification")} onRemove={removeDoc} locked={locked} />
        <FileInput accept="image/*,application/pdf" disabled={locked} onFile={(f) => handleUpload("qualification", f)} />
      </Section>

      <Section title="Customer references or reviews">
        <Field label="Names, contact details or review links"><textarea rows={3} value={form.references_text} onChange={(e) => upd("references_text", e.target.value)} disabled={locked} maxLength={2000} /></Field>
      </Section>

      <Section title="Declarations">
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="w-auto mt-1" checked={form.agreed_rules} onChange={(e) => upd("agreed_rules", e.target.checked)} disabled={locked} />
          <span>I have read and agree to follow the <Link to="/community-rules" className="text-[color:var(--color-gold)] underline">community rules</Link>.</span>
        </label>
        <label className="flex items-start gap-2 text-sm mt-2">
          <input type="checkbox" className="w-auto mt-1" checked={form.confirmed_accurate} onChange={(e) => upd("confirmed_accurate", e.target.checked)} disabled={locked} />
          <span>I confirm that all information provided is accurate and true to the best of my knowledge.</span>
        </label>
      </Section>

      <div className="flex gap-2 sticky bottom-3 bg-[color:var(--color-background)]/90 backdrop-blur p-2 rounded-md">
        <button className="btn-gold flex-1" onClick={save} disabled={saving || locked}>{saving ? "Saving…" : "Save application"}</button>
        <button className="btn-outline" onClick={() => router.navigate({ to: "/dashboard" })}>Done</button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-panel space-y-3">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label>{label}</label>{children}</div>;
}
function TagList({ items, onRemove, disabled }: { items: string[]; onRemove: (i: number) => void; disabled: boolean }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">None added yet.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t, i) => (
        <span key={i} className="badge-status flex items-center gap-1">
          {t}
          {!disabled && <button onClick={() => onRemove(i)}><X className="h-3 w-3" /></button>}
        </span>
      ))}
    </div>
  );
}
function FileInput({ accept, disabled, onFile }: { accept: string; disabled: boolean; onFile: (f: File) => void }) {
  return (
    <label className={`btn-outline w-fit cursor-pointer ${disabled ? "opacity-50" : ""}`}>
      <Upload className="h-4 w-4" /> Upload file
      <input type="file" accept={accept} className="hidden" disabled={disabled}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) { onFile(f); e.target.value = ""; } }} />
    </label>
  );
}
function DocList({ docs, onRemove, locked }: { docs: Doc[]; onRemove: (d: Doc) => void; locked: boolean }) {
  if (docs.length === 0) return null;
  return (
    <ul className="text-sm space-y-1">
      {docs.map((d) => (
        <li key={d.id} className="flex items-center justify-between border border-border rounded px-2 py-1">
          <span className="truncate">{d.original_name ?? d.path.split("/").pop()}</span>
          {!locked && <button onClick={() => onRemove(d)}><Trash2 className="h-4 w-4 text-destructive" /></button>}
        </li>
      ))}
    </ul>
  );
}

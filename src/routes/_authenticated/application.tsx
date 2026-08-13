import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { friendlyMessage } from "@/lib/errors";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { uploadFile } from "@/lib/application-helpers";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Upload, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/application")({
  head: () => ({ meta: [{ title: "Application — Handy Help Aberdeenshire" }] }),
  component: ApplicationForm,
});

const emptyApp = {
  business_name: "", contact_name: "", email: "", phone: "",
  company_registration_number: "", main_area: "", description: "", website: "", facebook: "",
  insurance_status: "", qualifications: "", references_text: "",
  agreed_rules: false, confirmed_accurate: false,
};

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
type WeekDay = (typeof weekDays)[number];
type WorkingHours = { days: Record<WeekDay, { closed: boolean; opens: string; closes: string }>; note: string };

function defaultWorkingHours(): WorkingHours {
  return {
    days: Object.fromEntries(weekDays.map((day) => [day, { closed: day === "Saturday" || day === "Sunday", opens: "09:00", closes: "17:00" }])) as WorkingHours["days"],
    note: "",
  };
}

function parseWorkingHours(value: string | null | undefined): WorkingHours {
  try {
    const parsed = JSON.parse(value ?? "") as Partial<WorkingHours>;
    if (!parsed.days) return defaultWorkingHours();
    const fallback = defaultWorkingHours();
    return {
      days: Object.fromEntries(weekDays.map((day) => [day, { ...fallback.days[day], ...parsed.days?.[day] }])) as WorkingHours["days"],
      note: typeof parsed.note === "string" ? parsed.note : "",
    };
  } catch {
    return { ...defaultWorkingHours(), note: value ?? "" };
  }
}

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
  const [workingHours, setWorkingHours] = useState<WorkingHours>(defaultWorkingHours);
  const [saving, setSaving] = useState(false);
  const creating = useRef<Promise<string | null> | null>(null);

  useEffect(() => { void load(); }, []);

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    const u = userData.user?.id;
    if (!u) return;
    setUid(u);
    const { data: existing } = await supabase
      .from("contractor_applications").select("*").eq("user_id", u).maybeSingle();
    const e = existing as (typeof emptyApp & { id: string; status: string; logo_path: string | null; working_hours: string | null }) | null;
    if (e) {
      setAppId(e.id);
      setStatus(e.status);
      setLogoPath(e.logo_path);
      setForm({
        business_name: e.business_name ?? "", contact_name: e.contact_name ?? "",
        email: e.email ?? "", phone: e.phone ?? "",
        company_registration_number: e.company_registration_number ?? "",
        main_area: e.main_area ?? "",
        description: e.description ?? "", website: e.website ?? "", facebook: e.facebook ?? "",
        insurance_status: e.insurance_status ?? "", qualifications: e.qualifications ?? "",
        references_text: e.references_text ?? "", agreed_rules: e.agreed_rules, confirmed_accurate: e.confirmed_accurate,
      });
      setWorkingHours(parseWorkingHours(e.working_hours));
      const [{ data: s }, { data: ar }, { data: d }, { data: g }] = await Promise.all([
        db.from("contractor_services").select("id,service").eq("application_id", e.id),
        db.from("contractor_areas").select("id,area").eq("application_id", e.id),
        db.from("contractor_documents").select("id,kind,path,original_name").eq("application_id", e.id).eq("is_active", true),
        db.from("contractor_gallery").select("id,path").eq("application_id", e.id),
      ]);
      setServices((s as { id: string; service: string }[]) ?? []);
      setAreas((ar as { id: string; area: string }[]) ?? []);
      setDocs((d as Doc[]) ?? []);
      setGallery((g as { id: string; path: string }[]) ?? []);
    } else {
      const { data: profile } = await db.from("profiles").select("email,full_name").eq("id", u).maybeSingle();
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
    if (creating.current) return creating.current;

    const run = (async (): Promise<string | null> => {
      // Re-check server-side in case an application already exists for this user.
      const { data: existing } = await supabase
        .from("contractor_applications")
        .select("id")
        .eq("user_id", uid)
        .maybeSingle();
      if (existing) {
        const id = (existing as { id: string }).id;
        setAppId(id);
        return id;
      }
      const { data, error } = await supabase
        .from("contractor_applications")
        .insert({ user_id: uid, status: "draft", ...form, working_hours: JSON.stringify(workingHours) })
        .select("id").single();
      if (error) { toast.error(friendlyMessage(error)); return null; }
      const id = (data as { id: string }).id;
      setAppId(id);
      return id;
    })();

    creating.current = run;
    try {
      return await run;
    } finally {
      creating.current = null;
    }
  }

  async function save() {
    setSaving(true);
    try {
      const id = await ensureApp();
      if (!id) return;
      const { error } = await db.from("contractor_applications")
        .update({ ...form, working_hours: JSON.stringify(workingHours), logo_path: logoPath }).eq("id", id);
      if (error) throw error;
      toast.success("Saved");
    } catch (err) {
      toast.error(friendlyMessage(err, "Failed to save"));
    } finally { setSaving(false); }
  }

  async function submit() {
    const missing = [
      !form.business_name.trim() && "business name",
      !form.contact_name.trim() && "contact name",
      !form.email.trim() && "email address",
      !form.phone.trim() && "phone number",
      !form.main_area.trim() && "main operating area",
      !form.description.trim() && "business description",
      services.length === 0 && "a service offered",
      areas.length === 0 && "an area covered",
      !form.agreed_rules && "agreement to the community rules",
      !form.confirmed_accurate && "confirmation that the information is accurate",
    ].filter(Boolean) as string[];
    if (missing.length > 0) {
      toast.error(`Complete: ${missing.join(", ")}.`);
      return;
    }
    if (status === "submitted" || status === "under_review") {
      toast.info("Your application has already been submitted.");
      return;
    }
    setSaving(true);
    try {
      const id = await ensureApp();
      if (!id) return;
      const { error } = await db.from("contractor_applications")
        .update({ ...form, working_hours: JSON.stringify(workingHours), logo_path: logoPath, status: "submitted" }).eq("id", id);
      if (error) throw error;
      await db.from("application_status_history").insert({
        application_id: id,
        status: "submitted",
        changed_by: uid,
      });
      setStatus("submitted");
      toast.success("Application submitted for review");
    } catch (err) {
      toast.error(friendlyMessage(err, "Failed to submit application"));
    } finally { setSaving(false); }
  }

  async function addService() {
    if (!newService.trim()) return;
    const id = await ensureApp(); if (!id) return;
    const { data, error } = await db.from("contractor_services")
      .insert({ application_id: id, service: newService.trim() }).select("id,service").single();
    if (error) return toast.error(friendlyMessage(error));
    setServices((s) => [...s, data as { id: string; service: string }]);
    setNewService("");
  }
  async function removeService(id?: string) {
    if (!id) return;
    await db.from("contractor_services").delete().eq("id", id);
    setServices((s) => s.filter((x) => x.id !== id));
  }
  async function addArea() {
    if (!newArea.trim()) return;
    const id = await ensureApp(); if (!id) return;
    const { data, error } = await db.from("contractor_areas")
      .insert({ application_id: id, area: newArea.trim() }).select("id,area").single();
    if (error) return toast.error(friendlyMessage(error));
    setAreas((a) => [...a, data as { id: string; area: string }]);
    setNewArea("");
  }
  async function removeArea(id?: string) {
    if (!id) return;
    await db.from("contractor_areas").delete().eq("id", id);
    setAreas((a) => a.filter((x) => x.id !== id));
  }

  async function handleUpload(kind: "logo" | "insurance" | "qualification" | "gallery", file: File) {
    if (!uid) return;
    const id = await ensureApp(); if (!id) return;
    try {
      const path = await uploadFile(uid, kind, file);
      if (kind === "logo") {
        setLogoPath(path);
        await db.from("contractor_applications").update({ logo_path: path }).eq("id", id);
        toast.success("Logo uploaded");
      } else if (kind === "gallery") {
        const { data } = await db.from("contractor_gallery")
          .insert({ application_id: id, path }).select("id,path").single();
        setGallery((g) => [...g, data as { id: string; path: string }]);
        toast.success("Photo added");
      } else {
        const { data } = await db.from("contractor_documents")
          .insert({ application_id: id, kind, path, original_name: file.name })
          .select("id,kind,path,original_name").single();
        const created = data as Doc;
        // Keep the previous document for history: mark it replaced rather than deleting it.
        const previous = docs.filter((d) => d.kind === kind).map((d) => d.id);
        if (previous.length > 0) {
          const { data: openReq } = await db
            .from("application_info_requests")
            .select("id")
            .eq("application_id", id)
            .eq("status", "open")
            .order("requested_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          await db
            .from("contractor_documents")
            .update({
              is_active: false,
              replaced_at: new Date().toISOString(),
              replaced_by_document_id: created.id,
              info_request_id: (openReq as { id: string } | null)?.id ?? null,
            })
            .in("id", previous);
        }
        setDocs((d) => [...d.filter((x) => x.kind !== kind), created]);
        toast.success("Document uploaded");
      }

    } catch (err) {
      toast.error(friendlyMessage(err, "Upload failed"));
    }
  }

  async function removeDoc(d: Doc) {
    await supabase.storage.from("contractor-files").remove([d.path]);
    await db.from("contractor_documents").delete().eq("id", d.id);
    setDocs((x) => x.filter((y) => y.id !== d.id));
  }

  async function removeGalleryItem(g: { id: string; path: string }) {
    await supabase.storage.from("contractor-files").remove([g.path]);
    await db.from("contractor_gallery").delete().eq("id", g.id);
    setGallery((x) => x.filter((y) => y.id !== g.id));
  }

  const locked = ["under_review", "approved", "rejected", "suspended"].includes(status);

  return (
    <div className="shell-prose space-y-fluid-md">
      <Link to="/dashboard" className="btn-ghost -ml-2 text-sm"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
      <h1 className="text-2xl font-bold">Contractor Application</h1>
      {locked && <p className="text-sm text-[color:var(--color-gold)]">This application is locked while under review. You'll be notified if we need more information.</p>}

      <Section title="Business details">
        <Field label="Business or trading name"><input value={form.business_name} onChange={(e) => upd("business_name", e.target.value)} disabled={locked} maxLength={120} /></Field>
        <Field label="Contact name"><input value={form.contact_name} onChange={(e) => upd("contact_name", e.target.value)} disabled={locked} maxLength={100} /></Field>
        <Field label="Email address"><input type="email" value={form.email} onChange={(e) => upd("email", e.target.value)} disabled={locked} /></Field>
        <Field label="Phone number"><input value={form.phone} onChange={(e) => upd("phone", e.target.value)} disabled={locked} maxLength={30} /></Field>
        <Field label="Company registration number"><input value={form.company_registration_number} onChange={(e) => upd("company_registration_number", e.target.value)} disabled={locked} maxLength={20} /></Field>
        <div>
          <label>Working hours</label>
          <div className="mt-fluid-2xs space-y-fluid-xs rounded-md border border-border p-fluid-sm">
            {weekDays.map((day) => {
              const hours = workingHours.days[day];
              return (
                <div key={day} className="grid grid-cols-[minmax(5rem,1fr)_auto] items-center gap-fluid-xs sm:grid-cols-[8rem_auto_1fr]">
                  <span className="text-sm font-medium">{day}</span>
                  <label className="flex items-center gap-1 text-sm text-muted-foreground"><input type="checkbox" className="w-auto" checked={hours.closed} disabled={locked} onChange={(e) => setWorkingHours((current) => ({ ...current, days: { ...current.days, [day]: { ...current.days[day], closed: e.target.checked } } }))} /> Closed</label>
                  {!hours.closed && <div className="col-span-2 flex items-center gap-fluid-xs sm:col-span-1"><input aria-label={`${day} opening time`} type="time" value={hours.opens} disabled={locked} onChange={(e) => setWorkingHours((current) => ({ ...current, days: { ...current.days, [day]: { ...current.days[day], opens: e.target.value } } }))} /><span className="text-sm text-muted-foreground">to</span><input aria-label={`${day} closing time`} type="time" value={hours.closes} disabled={locked} onChange={(e) => setWorkingHours((current) => ({ ...current, days: { ...current.days, [day]: { ...current.days[day], closes: e.target.value } } }))} /></div>}
                </div>
              );
            })}
            <textarea aria-label="Working hours note" rows={2} value={workingHours.note} disabled={locked} onChange={(e) => setWorkingHours((current) => ({ ...current, note: e.target.value }))} placeholder="Optional note, e.g. appointments only or emergency call-outs" maxLength={300} />
          </div>
        </div>
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
          <div className="mt-fluid-xs flex flex-wrap gap-fluid-xs">
            <input value={newArea} onChange={(e) => setNewArea(e.target.value)} placeholder="e.g. Aberdeen, Ellon" />
            <button className="btn-outline" onClick={addArea}>Add</button>
          </div>
        )}
      </Section>

      <Section title="Services offered">
        <TagList items={services.map(s => s.service)} onRemove={(i) => removeService(services[i].id)} disabled={locked} />
        {!locked && (
          <div className="mt-fluid-xs flex flex-wrap gap-fluid-xs">
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
        <div className="mb-fluid-xs grid grid-cols-2 gap-fluid-xs sm:grid-cols-3 lg:grid-cols-4">
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
        <label className="flex items-start gap-fluid-xs text-sm">
          <input type="checkbox" className="w-auto mt-1" checked={form.agreed_rules} onChange={(e) => upd("agreed_rules", e.target.checked)} disabled={locked} />
          <span>I have read and agree to follow the <Link to="/community-rules" className="text-[color:var(--color-gold)] underline">community rules</Link>.</span>
        </label>
        <label className="mt-fluid-xs flex items-start gap-fluid-xs text-sm">
          <input type="checkbox" className="w-auto mt-1" checked={form.confirmed_accurate} onChange={(e) => upd("confirmed_accurate", e.target.checked)} disabled={locked} />
          <span>I confirm that all information provided is accurate and true to the best of my knowledge.</span>
        </label>
      </Section>

      <div className="sticky bottom-3 flex flex-wrap gap-fluid-xs rounded-md bg-[color:var(--color-background)]/90 p-fluid-xs backdrop-blur">
        <button className="btn-outline flex-1" onClick={save} disabled={saving || locked}>{saving ? "Saving…" : "Save draft"}</button>
        {status === "draft" && <button className="btn-gold flex-1" onClick={submit} disabled={saving || locked}>{saving ? "Saving…" : "Submit application"}</button>}
        <button className="btn-outline" onClick={() => router.navigate({ to: "/dashboard" })}>Done</button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-panel space-y-fluid-sm">
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
    <div className="flex flex-wrap gap-fluid-xs">
      {items.map((t, i) => (
        <span key={i} className="badge-status flex items-center gap-1">
          {t}
          {!disabled && <button onClick={() => onRemove(i)}><X className="h-3 w-3" /></button>}
        </span>
      ))}
    </div>
  );
}
function FileInput({
  accept,
  disabled,
  onFile,
  kind = "document",
}: {
  accept: string;
  disabled: boolean;
  onFile: (f: File) => void | Promise<void>;
  kind?: "image" | "document";
}) {
  return (
    <FileDropzone
      accept={accept}
      allowedTypes={kind === "image" ? IMAGE_TYPES : DOCUMENT_TYPES}
      maxBytes={kind === "image" ? MAX_IMAGE_BYTES : MAX_DOCUMENT_BYTES}
      disabled={disabled}
      onFile={onFile}
    />
  );
}
function DocList({ docs, onRemove, locked }: { docs: Doc[]; onRemove: (d: Doc) => void; locked: boolean }) {
  if (docs.length === 0) return null;
  return (
    <ul className="space-y-fluid-2xs text-sm">
      {docs.map((d) => (
        <li key={d.id} className="flex items-center justify-between rounded border border-border px-fluid-xs py-fluid-2xs">
          <span className="truncate">{d.original_name ?? d.path.split("/").pop()}</span>
          {!locked && <button onClick={() => onRemove(d)}><Trash2 className="h-4 w-4 text-destructive" /></button>}
        </li>
      ))}
    </ul>
  );
}

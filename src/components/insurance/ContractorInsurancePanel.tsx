import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldCheck, Upload } from "lucide-react";
import { db } from "@/lib/db";
import { uploadFile } from "@/lib/application-helpers";
import { insuranceSummary, VERIFICATION_LABEL } from "@/lib/insurance";
import { InsuranceBadge } from "@/components/insurance/InsuranceBadge";
import { FileDropzone } from "@/components/uploads/FileDropzone";
import { DOCUMENT_TYPES, MAX_DOCUMENT_BYTES, describeTypes, formatBytes } from "@/lib/file-validation";

type DocRow = {
  id: string;
  path: string;
  original_name: string | null;
  created_at: string;
  is_active: boolean;
  verification_state: string | null;
};

export function ContractorInsurancePanel({
  applicationId,
  userId,
  insuranceStatus,
  provider,
  policyType,
  expiryDate,
  verificationState,
  onSaved,
}: {
  applicationId: string;
  userId: string;
  insuranceStatus: string | null;
  provider: string | null;
  policyType: string | null;
  expiryDate: string | null;
  verificationState: string | null;
  onSaved?: () => void;
}) {
  const [form, setForm] = useState({
    provider: provider ?? "",
    policyType: policyType ?? "",
    expiryDate: expiryDate ?? "",
  });
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm({ provider: provider ?? "", policyType: policyType ?? "", expiryDate: expiryDate ?? "" });
  }, [provider, policyType, expiryDate]);

  const load = useCallback(async () => {
    const { data } = await db
      .from("contractor_documents")
      .select("id,path,original_name,created_at,is_active,verification_state")
      .eq("application_id", applicationId)
      .eq("kind", "insurance")
      .order("created_at", { ascending: false });
    setDocs((data as DocRow[]) ?? []);
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = insuranceSummary({ status: insuranceStatus, expiryDate, verificationState });
  const current = docs.find((d) => d.is_active) ?? docs[0] ?? null;

  const save = async () => {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      if (file) {
        const path = await uploadFile(userId, "insurance", file);
        if (current) {
          await db
            .from("contractor_documents")
            .update({ is_active: false, replaced_at: new Date().toISOString() })
            .eq("id", current.id);
        }
        const { error: insErr } = await db.from("contractor_documents").insert({
          application_id: applicationId,
          kind: "insurance",
          path,
          original_name: file.name,
          is_active: true,
        });
        if (insErr) throw insErr;
      }

      const { error: updErr } = await db
        .from("contractor_applications")
        .update({
          insurance_provider: form.provider.trim() || null,
          insurance_policy_type: form.policyType.trim() || null,
          insurance_expiry_date: form.expiryDate || null,
          insurance_verification_state: "awaiting_review",
        })
        .eq("id", applicationId);
      if (updErr) throw updErr;

      setFile(null);
      setSaved(true);
      await load();
      onSaved?.();
    } catch {
      setError("Your insurance details could not be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const warn = summary.state === "expired" || summary.state === "expiring_soon" || summary.state === "missing_expiry";

  return (
    <section className="card-panel space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Your insurance</h2>
        </div>
        <InsuranceBadge input={{ status: insuranceStatus, expiryDate, verificationState }} />
      </div>

      {warn && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            summary.state === "expired"
              ? "border-destructive/50 bg-destructive/10 text-destructive"
              : "border-[color:var(--color-gold)]/50 bg-[color:var(--color-gold)]/10"
          }`}
        >
          <p className="font-semibold">{summary.label}</p>
          <p className="text-xs">
            {summary.detail} Please upload up-to-date insurance evidence and confirm the new expiry date.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-xs text-muted-foreground">Insurance provider</span>
          <input
            className="w-full rounded-md border border-white/15 bg-secondary px-3 py-2 text-sm"
            value={form.provider}
            onChange={(e) => setForm({ ...form, provider: e.target.value })}
            placeholder="e.g. Aviva"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-xs text-muted-foreground">Policy type</span>
          <input
            className="w-full rounded-md border border-white/15 bg-secondary px-3 py-2 text-sm"
            value={form.policyType}
            onChange={(e) => setForm({ ...form, policyType: e.target.value })}
            placeholder="e.g. Public liability"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-xs text-muted-foreground">Insurance expiry date</span>
          <input
            type="date"
            className="w-full rounded-md border border-white/15 bg-secondary px-3 py-2 text-sm"
            value={form.expiryDate}
            onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
          />
        </label>
        <div className="space-y-1 text-sm sm:col-span-2">
          <span className="text-xs text-muted-foreground">
            {current ? "Replace insurance document" : "Upload insurance document"}
          </span>
          <FileDropzone
            accept="image/*,application/pdf"
            allowedTypes={DOCUMENT_TYPES}
            maxBytes={MAX_DOCUMENT_BYTES}
            onFile={(f) => setFile(f)}
            hint={`${describeTypes(DOCUMENT_TYPES)} · up to ${formatBytes(MAX_DOCUMENT_BYTES)} · saved when you press Save`}
          />
          {file && <p className="text-xs text-muted-foreground">Selected: {file.name}</p>}
        </div>
      </div>

      {current && (
        <p className="text-xs text-muted-foreground">
          Current document: {current.original_name?.trim() || current.path.split("/").pop()} —{" "}
          {VERIFICATION_LABEL[current.verification_state ?? "awaiting_review"] ?? "Awaiting review"}
        </p>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
      {saved && (
        <p className="text-xs text-success">
          Saved. Your insurance details have been sent to our team for review.
        </p>
      )}

      <button className="btn-gold" disabled={busy} onClick={() => void save()}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Save insurance details
      </button>
    </section>
  );
}

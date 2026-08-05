import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { insuranceSummary, VERIFICATION_LABEL } from "@/lib/insurance";
import { InsuranceBadge } from "@/components/insurance/InsuranceBadge";

type DocRow = {
  id: string;
  path: string;
  original_name: string | null;
  created_at: string;
  is_active: boolean;
  verification_state: string | null;
};

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="break-words text-sm">{value?.trim() ? value : "Not provided"}</p>
    </div>
  );
}

export function AdminInsurancePanel({
  applicationId,
  insuranceStatus,
  provider,
  policyType,
  expiryDate,
  verificationState,
  verifiedAt,
  onUpdated,
}: {
  applicationId: string;
  insuranceStatus: string | null;
  provider: string | null;
  policyType: string | null;
  expiryDate: string | null;
  verificationState: string | null;
  verifiedAt: string | null;
  onUpdated?: () => void;
}) {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await db
      .from("contractor_documents")
      .select("id,path,original_name,created_at,is_active,verification_state")
      .eq("application_id", applicationId)
      .eq("kind", "insurance")
      .order("created_at", { ascending: false });
    if (err) setError("Insurance documents could not be loaded.");
    else setDocs((data as DocRow[]) ?? []);
    setLoading(false);
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = insuranceSummary({
    status: insuranceStatus,
    expiryDate,
    verificationState,
    hasDocument: docs.length > 0,
  });

  const setVerification = async (state: "verified" | "rejected" | "awaiting_review") => {
    setBusy(true);
    setError(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;
      const { error: err } = await db
        .from("contractor_applications")
        .update({
          insurance_verification_state: state,
          insurance_verified_at: state === "awaiting_review" ? null : new Date().toISOString(),
          insurance_verified_by: state === "awaiting_review" ? null : uid,
        })
        .eq("id", applicationId);
      if (err) throw err;
      const active = docs.find((d) => d.is_active) ?? docs[0];
      if (active) {
        await db.from("contractor_documents").update({ verification_state: state }).eq("id", active.id);
      }
      await load();
      onUpdated?.();
    } catch {
      setError("The insurance verification could not be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const current = docs.find((d) => d.is_active) ?? docs[0] ?? null;
  const previous = docs.filter((d) => d.id !== current?.id);

  return (
    <section className="card-panel space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Insurance</h2>
        </div>
        <InsuranceBadge input={{ status: insuranceStatus, expiryDate, verificationState }} />
      </div>

      <p className="text-sm text-muted-foreground">{summary.detail}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Insurance status" value={insuranceStatus} />
        <Field label="Insurance provider" value={provider} />
        <Field label="Policy type" value={policyType} />
        <Field label="Expiry date" value={summary.expiryText} />
        <Field
          label="Verification"
          value={VERIFICATION_LABEL[verificationState ?? "awaiting_review"] ?? "Awaiting review"}
        />
        <Field
          label="Verified on"
          value={verifiedAt ? new Date(verifiedAt).toLocaleString() : "Not verified yet"}
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button className="btn-gold" disabled={busy} onClick={() => void setVerification("verified")}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Mark insurance
          verified
        </button>
        <button className="btn-ghost" disabled={busy} onClick={() => void setVerification("rejected")}>
          <XCircle className="h-4 w-4" /> Reject insurance
        </button>
        <button className="btn-ghost" disabled={busy} onClick={() => void setVerification("awaiting_review")}>
          <RefreshCw className="h-4 w-4" /> Reset to awaiting review
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-primary">Insurance documents</h3>
        {loading ? (
          <div className="h-16 animate-pulse rounded-lg bg-white/10" />
        ) : docs.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">No insurance document uploaded</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {current && (
              <li className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="break-words font-medium">
                  {current.original_name?.trim() || current.path.split("/").pop()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Current document — uploaded {new Date(current.created_at).toLocaleDateString()} —{" "}
                  {VERIFICATION_LABEL[current.verification_state ?? "awaiting_review"] ?? "Awaiting review"}
                </p>
              </li>
            )}
            {previous.map((d) => (
              <li key={d.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3 opacity-80">
                <p className="break-words">{d.original_name?.trim() || d.path.split("/").pop()}</p>
                <p className="text-xs text-muted-foreground">
                  Replaced document — uploaded {new Date(d.created_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { STATUS_LABEL, insuranceProvided, type AppStatus } from "@/lib/application-helpers";
import { ProgressBar } from "@/components/application/shared";

const REJECTION_REASONS = [
  "Incomplete application",
  "Missing or invalid insurance",
  "Missing or invalid qualifications",
  "Unable to verify the business",
  "Outside the Aberdeenshire coverage area",
  "Does not meet the community rules",
  "Other",
];

type Props = {
  applicationId: string;
  status: AppStatus;
  percent: number;
  missingInfo: string[];
  missingDocs: string[];
  insuranceStatus: string | null;
  qualifications: string | null;
  approvedAt?: string | null;
  onDecided?: () => void;
};

export function DecisionActions({
  applicationId,
  status,
  percent,
  missingInfo,
  missingDocs,
  insuranceStatus,
  qualifications,
  approvedAt,
  onDecided,
}: Props) {
  const [checks, setChecks] = useState<{ done: number; total: number } | null>(null);
  const [mode, setMode] = useState<"none" | "approve" | "reject">("none");
  const [internalNote, setInternalNote] = useState("");
  const [contractorMessage, setContractorMessage] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qualsRelevant = !!(qualifications && qualifications.trim().length > 0);
  const totalChecks = qualsRelevant ? 15 : 13;

  const loadChecks = useCallback(async () => {
    const { data } = await db
      .from("application_review_checks")
      .select("check_key,completed")
      .eq("application_id", applicationId);
    const rows = (data as { check_key: string; completed: boolean }[]) ?? [];
    const done = rows.filter((r) => r.completed).length;
    setChecks({ done: Math.min(done, totalChecks), total: totalChecks });
  }, [applicationId, totalChecks]);

  useEffect(() => {
    void loadChecks();
  }, [loadChecks]);

  const blocked = missingInfo.length > 0 || missingDocs.length > 0;
  const decided = status === "approved" || status === "rejected";

  const reset = () => {
    setMode("none");
    setInternalNote("");
    setContractorMessage("");
    setRejectReason("");
    setConfirmed(false);
    setError(null);
  };

  const decide = async (decision: "approved" | "rejected") => {
    setBusy(true);
    setError(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("no user");

      const now = new Date().toISOString();
      const message = contractorMessage.trim();

      const update: Record<string, unknown> = {
        status: decision,
        decided_by: uid,
        decided_at: now,
        contractor_decision_message: message || null,
      };
      if (decision === "approved") {
        update.approved_at = now;
        update.rejected_at = null;
        update.decision_reason = null;
      } else {
        update.rejected_at = now;
        update.approved_at = null;
        update.decision_reason = rejectReason;
      }

      const { error: updErr } = await db
        .from("contractor_applications")
        .update(update)
        .eq("id", applicationId);
      if (updErr) throw new Error(updErr.message);

      const { error: histErr } = await db.from("application_status_history").insert({
        application_id: applicationId,
        status: decision,
        reason: message || (decision === "approved" ? "Application approved" : rejectReason),
        changed_by: uid,
      });
      if (histErr) throw new Error(histErr.message);

      const note = internalNote.trim();
      if (note) {
        await db.from("admin_notes").insert({
          application_id: applicationId,
          admin_id: uid,
          note: `[${decision === "approved" ? "Approval" : "Rejection"} decision note] ${note}`,
        });
      }

      reset();
      onDecided?.();
    } catch {
      setError("The decision could not be saved. Please try again.");
      setConfirmed(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card-panel space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Decision</h2>
        {decided && (
          <span
            className={
              status === "approved"
                ? "rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300"
                : "rounded-full border border-red-500/40 bg-red-500/15 px-3 py-1 text-xs font-medium text-red-300"
            }
          >
            {STATUS_LABEL[status]}
            {approvedAt ? ` — ${new Date(approvedAt).toLocaleDateString()}` : ""}
          </span>
        )}
      </div>

      {/* Pre-decision summary */}
      <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Application completion</span>
            <span className="font-medium">{percent}%</span>
          </div>
          <ProgressBar percent={percent} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Review checklist</span>
          <span className="font-medium">
            {checks ? `${checks.done} of ${checks.total} complete` : "Loading…"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Missing information</span>
          <span className={missingInfo.length ? "font-medium text-orange-400" : "font-medium text-emerald-400"}>
            {missingInfo.length}
          </span>
        </div>
        <div className="flex items-start justify-between gap-2">
          <span className="text-muted-foreground">Missing documents</span>
          <span className={missingDocs.length ? "font-medium text-orange-400" : "font-medium text-emerald-400 text-right"}>
            {missingDocs.length === 0
              ? "0"
              : missingDocs.join(", ")}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Insurance</span>
          <span className={insuranceProvided(insuranceStatus) ? "font-medium text-emerald-400" : "font-medium text-orange-400"}>
            {insuranceStatus?.trim() || "Not provided"}
          </span>
        </div>
      </div>

      {blocked && (
        <p className="flex items-start gap-2 rounded-lg border border-orange-500/40 bg-orange-500/10 p-2 text-sm text-orange-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Approval is blocked while required information or documents are missing. Request more information from the
            contractor first.
          </span>
        </p>
      )}

      {mode === "none" && (
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={blocked || status === "approved"}
            onClick={() => {
              setMode("approve");
              setError(null);
            }}
          >
            <CheckCircle2 className="h-4 w-4" /> Approve application
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={status === "rejected"}
            onClick={() => {
              setMode("reject");
              setError(null);
            }}
          >
            <XCircle className="h-4 w-4" /> Reject application
          </button>
        </div>
      )}

      {mode === "approve" && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="approve-note" className="text-sm font-medium">
              Internal decision note (optional, never shown to the contractor)
            </label>
            <textarea
              id="approve-note"
              rows={3}
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-white/5 p-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="approve-message" className="text-sm font-medium">
              Message to the contractor (optional)
            </label>
            <textarea
              id="approve-message"
              rows={3}
              value={contractorMessage}
              onChange={(e) => setContractorMessage(e.target.value)}
              placeholder="Welcome to Handy Help Aberdeenshire."
              className="w-full rounded-lg border border-white/15 bg-white/5 p-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
            />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-emerald-500"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span>
              I confirm this application has been reviewed and should be approved. The contractor will receive the
              Approved Contractor badge and a live public profile.
            </span>
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!confirmed || busy || blocked}
              onClick={() => void decide("approved")}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Confirm approval
            </button>
            <button className="btn-ghost" onClick={reset} disabled={busy}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === "reject" && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="reject-reason" className="text-sm font-medium">
              Rejection reason (required)
            </label>
            <select
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-white/5 p-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
            >
              <option value="">Select a reason…</option>
              {REJECTION_REASONS.map((r) => (
                <option key={r} value={r} className="bg-[color:var(--color-navy,#0b1729)]">
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="reject-message" className="text-sm font-medium">
              Message to the contractor (required)
            </label>
            <textarea
              id="reject-message"
              rows={4}
              value={contractorMessage}
              onChange={(e) => setContractorMessage(e.target.value)}
              placeholder="Explain clearly why the application was not approved."
              className="w-full rounded-lg border border-white/15 bg-white/5 p-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="reject-note" className="text-sm font-medium">
              Internal decision note (optional, never shown to the contractor)
            </label>
            <textarea
              id="reject-note"
              rows={3}
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-white/5 p-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
            />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-red-500"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span>I confirm this application should be rejected and the message above sent to the contractor.</span>
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!confirmed || busy || !rejectReason || contractorMessage.trim().length === 0}
              onClick={() => void decide("rejected")}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Confirm rejection
            </button>
            <button className="btn-ghost" onClick={reset} disabled={busy}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

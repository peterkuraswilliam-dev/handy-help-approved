import { useCallback, useEffect, useState } from "react";
import { friendlyMessage } from "@/lib/errors";
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { STATUS_LABEL, insuranceProvided, type AppStatus } from "@/lib/application-helpers";
import { blocksApproval, insuranceSummary } from "@/lib/insurance";
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
  insuranceExpiryDate?: string | null;
  insuranceVerificationState?: string | null;
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
  insuranceExpiryDate = null,
  insuranceVerificationState = null,
  qualifications,
  approvedAt,
  onDecided,
}: Props) {
  const [checks, setChecks] = useState<{ done: number; total: number; needsInfo: number } | null>(null);
  const [openRequests, setOpenRequests] = useState<number | null>(null);
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
    const [{ data: checkData }, { data: reqData }] = await Promise.all([
      db
        .from("application_review_checks")
        .select("check_key,completed,review_state")
        .eq("application_id", applicationId),
      db
        .from("application_info_requests")
        .select("id,status")
        .eq("application_id", applicationId),
    ]);
    const rows = (checkData as { check_key: string; completed: boolean; review_state: string | null }[]) ?? [];
    const done = rows.filter((r) => r.completed || r.review_state === "checked" || r.review_state === "not_applicable")
      .length;
    const needsInfo = rows.filter((r) => r.review_state === "needs_info").length;
    setChecks({ done: Math.min(done, totalChecks), total: totalChecks, needsInfo });
    const reqs = (reqData as { id: string; status: string }[]) ?? [];
    setOpenRequests(reqs.filter((r) => r.status !== "closed" && r.status !== "completed").length);
  }, [applicationId, totalChecks]);

  useEffect(() => {
    void loadChecks();
  }, [loadChecks]);

  const insuranceOk = insuranceProvided(insuranceStatus);
  const insurance = insuranceSummary({
    status: insuranceStatus,
    expiryDate: insuranceExpiryDate,
    verificationState: insuranceVerificationState,
  });
  const blockers: string[] = [];
  if (missingInfo.length > 0) blockers.push(`${missingInfo.length} required detail(s) still missing`);
  if (missingDocs.length > 0) blockers.push(`Missing documents: ${missingDocs.join(", ")}`);
  if (checks && checks.done < checks.total)
    blockers.push(`Review checklist incomplete (${checks.done} of ${checks.total})`);
  if (checks && checks.needsInfo > 0) blockers.push(`${checks.needsInfo} checklist item(s) marked Needs Information`);
  if (openRequests && openRequests > 0) blockers.push(`${openRequests} information request(s) still open`);
  if (!insuranceOk) blockers.push("Insurance is not confirmed as valid");
  else if (blocksApproval(insurance.state)) blockers.push(`${insurance.label} — ${insurance.detail}`);
  else if (insurance.state === "awaiting_review")
    blockers.push("Insurance has not been verified by an administrator yet");
  const loadingGate = checks === null || openRequests === null;
  const blocked = loadingGate || blockers.length > 0;
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
      if (updErr) throw new Error(friendlyMessage(updErr));

      const { error: histErr } = await db.from("application_status_history").insert({
        application_id: applicationId,
        status: decision,
        reason: message || (decision === "approved" ? "Application approved" : rejectReason),
        changed_by: uid,
      });
      if (histErr) throw new Error(friendlyMessage(histErr));

      if (decision === "approved") {
        const { error: profileErr } = await db.rpc("activate_contractor_profile", {
          _application_id: applicationId,
        });
        if (profileErr) throw new Error(friendlyMessage(profileErr));
      }



      const note = internalNote.trim();
      if (note) {
        await db.from("admin_notes").insert({
          application_id: applicationId,
          admin_id: uid,
          note: `[${decision === "approved" ? "Approval" : "Rejection"} decision note] ${note}`,
        });
      }

      reset();
      void loadChecks();

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
                ? "rounded-full border border-success/40 bg-success/15 px-3 py-1 text-xs font-medium text-success-foreground"
                : "rounded-full border border-destructive/40 bg-destructive/15 px-3 py-1 text-xs font-medium text-destructive"
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
          <span className="text-muted-foreground">Items marked Needs Information</span>
          <span className={checks?.needsInfo ? "font-medium text-warning" : "font-medium text-success"}>
            {checks ? checks.needsInfo : "…"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Missing information</span>
          <span className={missingInfo.length ? "font-medium text-warning" : "font-medium text-success"}>
            {missingInfo.length}
          </span>
        </div>
        <div className="flex items-start justify-between gap-2">
          <span className="text-muted-foreground">Missing documents</span>
          <span className={missingDocs.length ? "font-medium text-warning" : "font-medium text-success text-right"}>
            {missingDocs.length === 0
              ? "0"
              : missingDocs.join(", ")}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Open information requests</span>
          <span className={openRequests ? "font-medium text-warning" : "font-medium text-success"}>
            {openRequests === null ? "…" : openRequests}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Insurance</span>
          <span className={insuranceOk ? "font-medium text-success" : "font-medium text-warning"}>
            {insuranceStatus?.trim() || "Not provided"}
          </span>
        </div>
      </div>

      {!decided && blockers.length > 0 && (
        <div className="space-y-1 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
          <p className="flex items-start gap-2 font-medium">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Approval is blocked until these are resolved:</span>
          </p>
          <ul className="list-disc space-y-0.5 pl-9">
            {blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      )}


      {mode === "none" && (
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-success-foreground disabled:cursor-not-allowed disabled:opacity-50"
            disabled={blocked || status === "approved"}
            onClick={() => {
              setMode("approve");
              setError(null);
            }}
          >
            <CheckCircle2 className="h-4 w-4" /> Approve application
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive disabled:cursor-not-allowed disabled:opacity-50"
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
              className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-success-foreground disabled:cursor-not-allowed disabled:opacity-50"
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
              className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-50"
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

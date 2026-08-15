import { useCallback, useEffect, useState } from "react";
import { friendlyMessage } from "@/lib/errors";
import { Loader2, RotateCcw, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import type { AppStatus } from "@/lib/application-helpers";

const SUSPENSION_REASONS = [
  "Insurance no longer valid",
  "Qualification or certification concern",
  "Complaint received about work carried out",
  "Business details out of date or incorrect",
  "Community standards concern",
  "Requested by the contractor",
  "Other",
];

export type StatusEvent = {
  id: string;
  action: "suspend" | "restore";
  previous_status: string | null;
  new_status: string;
  reason: string;
  public_message: string | null;
  created_at: string;
};

export function SuspendRestore({
  applicationId,
  status,
  onChanged,
}: {
  applicationId: string;
  status: AppStatus;
  onChanged?: () => void;
}) {
  const [events, setEvents] = useState<StatusEvent[]>([]);
  const [mode, setMode] = useState<"none" | "suspend" | "restore">("none");
  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadEvents = useCallback(async () => {
    const { data } = await db
      .from("contractor_status_events")
      .select("id,action,previous_status,new_status,reason,public_message,created_at")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false });
    setEvents((data as StatusEvent[]) ?? []);
  }, [applicationId]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const reset = () => {
    setMode("none");
    setReason("");
    setOtherReason("");
    setMessage("");
    setNote("");
    setConfirmed(false);
  };

  const finalReason = reason === "Other" ? otherReason.trim() : reason;

  const run = async (action: "suspend" | "restore") => {
    setBusy(true);
    try {
      const { error } =
        action === "suspend"
          ? await db.rpc("suspend_contractor", {
              _application_id: applicationId,
              _reason: finalReason,
              _contractor_message: message.trim(),
              _admin_note: note.trim() || null,
            })
          : await db.rpc("restore_contractor", {
              _application_id: applicationId,
              _reason: finalReason || reason,
              _contractor_message: message.trim() || null,
              _admin_note: note.trim() || null,
            });
      if (error) throw new Error(friendlyMessage(error));
      toast.success(
        action === "suspend" ? "Contractor suspended" : "Contractor restored — public profile is live again",
      );
      reset();
      await loadEvents();
      onChanged?.();
    } catch (e) {
      toast.error(friendlyMessage(e, "The change could not be saved."));
      setConfirmed(false);
    } finally {
      setBusy(false);
    }
  };

  if (status !== "approved" && status !== "suspended" && events.length === 0) return null;

  const suspended = status === "suspended";

  return (
    <section className="card-panel space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Approved contractor status</h2>
        <span
          className={
            suspended
              ? "rounded-full border border-destructive/40 bg-destructive/15 px-3 py-1 text-xs font-medium text-destructive"
              : "badge-approved"
          }
        >
          {suspended ? "Suspended" : "Approved"}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Suspending hides the public profile and the Approved Contractor badge. Nothing is deleted — the application,
        documents, photos and approval history are all kept and can be restored.
      </p>

      {mode === "none" && (
        <div className="flex flex-wrap gap-2">
          {!suspended && status === "approved" && (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-50"
              onClick={() => setMode("suspend")}
            >
              <ShieldAlert className="h-4 w-4" /> Suspend contractor
            </button>
          )}
          {suspended && (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-success-foreground disabled:opacity-50"
              onClick={() => setMode("restore")}
            >
              <RotateCcw className="h-4 w-4" /> Restore contractor
            </button>
          )}
        </div>
      )}

      {mode === "suspend" && (
        <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3">
          <div className="space-y-1">
            <label htmlFor="susp-reason" className="text-sm font-medium">
              Suspension reason (required)
            </label>
            <select
              id="susp-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-white/5 p-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
            >
              <option value="">Select a reason…</option>
              {SUSPENSION_REASONS.map((r) => (
                <option key={r} value={r} className="bg-[color:var(--color-navy,#0b1729)]">
                  {r}
                </option>
              ))}
            </select>
            {reason === "Other" && (
              <input
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                placeholder="Describe the reason"
                className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 p-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
              />
            )}
          </div>
          <div className="space-y-1">
            <label htmlFor="susp-message" className="text-sm font-medium">
              Message to the contractor (required)
            </label>
            <textarea
              id="susp-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explain what needs to happen before the profile can be restored."
              className="w-full rounded-lg border border-white/15 bg-white/5 p-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="susp-note" className="text-sm font-medium">
              Private admin note (optional, never shown to the contractor)
            </label>
            <textarea
              id="susp-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
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
            <span>
              I confirm this contractor should be suspended. Their public profile and Approved Contractor badge will be
              hidden immediately.
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-50"
              disabled={busy || !confirmed || !finalReason || message.trim().length === 0}
              onClick={() => void run("suspend")}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
              Confirm suspension
            </button>
            <button type="button" className="btn-ghost" onClick={reset} disabled={busy}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === "restore" && (
        <div className="space-y-3 rounded-lg border border-success/40 bg-success/10 p-3">
          <div className="space-y-1">
            <label htmlFor="rest-reason" className="text-sm font-medium">
              Restoration reason (required)
            </label>
            <input
              id="rest-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Valid insurance certificate received"
              className="w-full rounded-lg border border-white/15 bg-white/5 p-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="rest-message" className="text-sm font-medium">
              Message to the contractor (optional)
            </label>
            <textarea
              id="rest-message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your Approved Contractor profile is live again."
              className="w-full rounded-lg border border-white/15 bg-white/5 p-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="rest-note" className="text-sm font-medium">
              Private admin note (optional)
            </label>
            <textarea
              id="rest-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
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
            <span>I confirm this contractor should be restored to Approved with a live public profile.</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-success-foreground disabled:cursor-not-allowed disabled:opacity-50"
              disabled={busy || !confirmed || reason.trim().length === 0}
              onClick={() => void run("restore")}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Confirm restoration
            </button>
            <button type="button" className="btn-ghost" onClick={reset} disabled={busy}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {events.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Suspension history</h3>
          <ul className="space-y-2">
            {events.map((ev) => (
              <li key={ev.id} className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={
                      ev.action === "suspend"
                        ? "rounded-full border border-destructive/40 bg-destructive/15 px-2 py-0.5 text-xs text-destructive"
                        : "rounded-full border border-success/40 bg-success/15 px-2 py-0.5 text-xs text-success-foreground"
                    }
                  >
                    {ev.action === "suspend" ? "Suspended" : "Restored"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(ev.created_at).toLocaleString()} · {ev.previous_status} → {ev.new_status}
                  </span>
                </div>
                <p className="mt-1">{ev.reason}</p>
                {ev.public_message && (
                  <p className="mt-1 text-xs text-muted-foreground">Contractor message: {ev.public_message}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

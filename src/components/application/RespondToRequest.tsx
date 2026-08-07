import { Link } from "@tanstack/react-router";
import { friendlyMessage } from "@/lib/errors";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Pencil,
  RefreshCw,
  Save,
  Send,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { type InfoRequestRow } from "@/components/application/info-requests";
import {
  ITEM_STATUS_LABEL,
  ITEM_STATUS_TONE,
  ITEM_TAB,
  itemLabel,
  itemStatus,
  loadSnapshotSource,
  type ItemStatus,
  type RequestItemRow,
  type SnapshotSource,
} from "@/components/application/request-items";

type Props = {
  applicationId: string;
  /** Required application information still missing (labels). */
  missingInfo: string[];
  /** Required documents still missing (labels). */
  missingDocs: string[];
  onResubmitted: () => void;
  /** Jump to another dashboard tab (photos, documents…). */
  onOpenTab?: (tab: string) => void;
};

export function RespondToRequest({
  applicationId,
  missingInfo,
  missingDocs,
  onResubmitted,
  onOpenTab,
}: Props) {
  const [open, setOpen] = useState<InfoRequestRow[]>([]);
  const [items, setItems] = useState<RequestItemRow[]>([]);
  const [src, setSrc] = useState<SnapshotSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const { data, error } = await db
        .from("application_info_requests")
        .select(
          "id,application_id,message,requested_sections,requested_documents,requested_by,requested_at,due_date,status,completed_at,response_message,responded_at",
        )
        .eq("application_id", applicationId)
        .eq("status", "open")
        .order("requested_at", { ascending: false });
      if (error) {
        setFailed(true);
        return;
      }
      const rows = (data as InfoRequestRow[]) ?? [];
      setOpen(rows);
      setMessage(rows.find((r) => r.response_message)?.response_message ?? "");
      if (rows.length > 0) {
        const [{ data: itemRows }, snapshot] = await Promise.all([
          db
            .from("application_info_request_items")
            .select("id,request_id,application_id,item_type,item_key,snapshot")
            .in(
              "request_id",
              rows.map((r) => r.id),
            ),
          loadSnapshotSource(applicationId),
        ]);
        setItems((itemRows as RequestItemRow[]) ?? []);
        setSrc(snapshot);
      } else {
        setItems([]);
        setSrc(null);
      }
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <section className="card-panel space-y-3">
        <div className="h-5 w-1/3 animate-pulse rounded bg-white/10" />
        <div className="h-16 w-full animate-pulse rounded bg-white/10" />
      </section>
    );
  }

  if (failed) {
    return (
      <section className="card-panel space-y-3">
        <h2 className="font-semibold">Respond to our request</h2>
        <p className="text-sm text-muted-foreground">This request could not be loaded.</p>
        <button className="btn-outline w-fit" onClick={() => void load()}>
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </section>
    );
  }

  if (open.length === 0) return null;

  const statuses: { item: RequestItemRow; status: ItemStatus }[] = src
    ? items.map((item) => ({ item, status: itemStatus(item, src) }))
    : items.map((item) => ({ item, status: "not_updated" as ItemStatus }));

  const outstandingItems = statuses.filter((s) => s.status === "not_updated");
  const outstandingRequired = [...missingInfo, ...missingDocs];
  const readyToResubmit = outstandingItems.length === 0 && outstandingRequired.length === 0;

  async function saveResponse() {
    setBusy(true);
    try {
      const text = message.trim();
      const { error } = await db
        .from("application_info_requests")
        .update({ response_message: text.length > 0 ? text : null })
        .eq("application_id", applicationId)
        .eq("status", "open");
      if (error) throw new Error(friendlyMessage(error));
      toast.success("Your changes were saved. You can resubmit when you're ready.");
      await load();
    } catch (e) {
      toast.error(friendlyMessage(e, "Could not save your response."));
    } finally {
      setBusy(false);
    }
  }

  async function resubmit() {
    setBusy(true);
    try {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      const now = new Date().toISOString();
      const text = message.trim();

      const { error: appErr } = await db
        .from("contractor_applications")
        .update({ status: "submitted" })
        .eq("id", applicationId);
      if (appErr) throw new Error(friendlyMessage(appErr));

      const { error: reqErr } = await db
        .from("application_info_requests")
        .update({
          status: "responded",
          response_message: text.length > 0 ? text : null,
          responded_at: now,
          resubmitted_at: now,
          completed_at: now,
        })
        .eq("application_id", applicationId)
        .eq("status", "open");
      if (reqErr) throw new Error(friendlyMessage(reqErr));

      await db.from("application_status_history").insert({
        application_id: applicationId,
        status: "submitted",
        reason: text.length > 0 ? text : "Application resubmitted after an information request",
        changed_by: uid,
      });

      toast.success("Application resubmitted for review");
      setConfirming(false);
      await load();
      onResubmitted();
    } catch (e) {
      toast.error(friendlyMessage(e, "Resubmission failed. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card-panel space-y-4 border-orange-500/40">
      <div className="space-y-1">
        <h2 className="font-semibold">Respond and resubmit</h2>
        <p className="flex items-start gap-2 rounded-lg border border-orange-500/40 bg-orange-500/10 p-3 text-sm text-orange-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          More information is required before your application review can continue.
        </p>
      </div>

      <div className="space-y-3">
        {open.map((r) => (
          <div key={r.id} className="rounded-lg border border-orange-500/40 bg-orange-500/10 p-3">
            <p className="text-xs text-orange-300">
              Message from the review team — {new Date(r.requested_at).toLocaleString()} · Status:{" "}
              {r.status === "open" ? "Open" : r.status === "responded" ? "Responded" : "Closed"}
            </p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm">{r.message}</p>
            {r.due_date && (
              <p className="mt-1 text-xs text-muted-foreground">
                Please respond by {new Date(r.due_date).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>

      {statuses.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">What we asked for</h3>
          <ul className="space-y-2">
            {statuses.map(({ item, status }) => {
              const tab = ITEM_TAB[item.item_key];
              return (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {status === "not_updated" ? (
                      <Circle className="h-4 w-4 shrink-0 text-orange-300" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    )}
                    <span className="min-w-0 break-words">{itemLabel(item)}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${ITEM_STATUS_TONE[status]}`}
                    >
                      {ITEM_STATUS_LABEL[status]}
                    </span>
                    {tab && onOpenTab ? (
                      <button className="btn-outline" onClick={() => onOpenTab(tab)}>
                        Open
                      </button>
                    ) : (
                      <Link to="/application" className="btn-outline">
                        Open
                      </Link>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
          {readyToResubmit && (
            <p className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">
              <CheckCircle2 className="h-4 w-4" /> Ready to Resubmit
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link to="/application" className="btn-outline w-full sm:w-auto">
          <Pencil className="h-4 w-4" /> Update application
        </Link>
        <Link to="/application" className="btn-outline w-full sm:w-auto">
          <Upload className="h-4 w-4" /> Upload replacement document
        </Link>
      </div>

      {(outstandingItems.length > 0 || outstandingRequired.length > 0) && (
        <div className="rounded-lg border border-orange-500/40 bg-orange-500/10 p-3 text-sm">
          <p className="flex items-center gap-2 font-medium text-orange-300">
            <AlertTriangle className="h-4 w-4" /> Still to do before you can resubmit
          </p>
          <ul className="mt-1 list-inside list-disc">
            {outstandingItems.map(({ item }) => (
              <li key={item.id}>{itemLabel(item)}</li>
            ))}
            {outstandingRequired.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="response-message" className="text-sm font-medium">
          Response message (optional)
        </label>
        <textarea
          id="response-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Tell us what you have updated…"
          className="w-full rounded-lg border border-border bg-secondary/40 p-3 text-sm"
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button onClick={() => void saveResponse()} disabled={busy} className="btn-outline w-full sm:w-auto">
          <Save className="h-4 w-4" /> Save changes
        </button>
        <button
          onClick={() => setConfirming(true)}
          disabled={busy || !readyToResubmit}
          className="btn-gold w-full sm:w-auto"
          title={readyToResubmit ? undefined : "Complete every requested item first"}
        >
          <Send className="h-4 w-4" /> Resubmit Application
        </button>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm space-y-3 rounded-xl border border-white/15 bg-[color:var(--color-navy,#0b1220)] p-4">
            <h3 className="font-semibold">Resubmit your application?</h3>
            <p className="text-sm text-muted-foreground">
              Your updates and response will be sent back to the review team and your application status
              will change to Submitted.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button className="btn-gold w-full sm:w-auto" disabled={busy} onClick={() => void resubmit()}>
                <Send className="h-4 w-4" /> {busy ? "Resubmitting…" : "Confirm resubmission"}
              </button>
              <button
                className="btn-outline w-full sm:w-auto"
                disabled={busy}
                onClick={() => setConfirming(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

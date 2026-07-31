import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Pencil, RefreshCw, Send, Upload } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import {
  INFO_DOCUMENTS,
  INFO_SECTIONS,
  labelFor,
  type InfoRequestRow,
} from "@/components/application/info-requests";

type Props = {
  applicationId: string;
  /** Requested information still missing from the application (labels). */
  missingInfo: string[];
  /** Requested documents still missing (labels). */
  missingDocs: string[];
  onResubmitted: () => void;
};

export function RespondToRequest({ applicationId, missingInfo, missingDocs, onResubmitted }: Props) {
  const [open, setOpen] = useState<InfoRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const { data, error } = await db
        .from("application_info_requests")
        .select(
          "id,application_id,message,requested_sections,requested_documents,requested_by,requested_at,due_date,status,completed_at",
        )
        .eq("application_id", applicationId)
        .eq("status", "open")
        .order("requested_at", { ascending: false });
      if (error) {
        setFailed(true);
        return;
      }
      setOpen((data as InfoRequestRow[]) ?? []);
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

  const requestedSections = Array.from(
    new Set(open.flatMap((r) => r.requested_sections ?? [])),
  ).map((k) => labelFor(INFO_SECTIONS, k));
  const requestedDocuments = Array.from(
    new Set(open.flatMap((r) => r.requested_documents ?? [])),
  ).map((k) => labelFor(INFO_DOCUMENTS, k));

  const outstanding = [...missingInfo, ...missingDocs];

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
      if (appErr) throw new Error(appErr.message);

      const { error: reqErr } = await db
        .from("application_info_requests")
        .update({
          status: "responded",
          response_message: text.length > 0 ? text : null,
          responded_at: now,
          completed_at: now,
        })
        .eq("application_id", applicationId)
        .eq("status", "open");
      if (reqErr) throw new Error(reqErr.message);

      await db.from("application_status_history").insert({
        application_id: applicationId,
        status: "submitted",
        reason: text.length > 0 ? text : "Application resubmitted after an information request",
        changed_by: uid,
      });

      toast.success("Application resubmitted for review");
      setMessage("");
      await load();
      onResubmitted();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Resubmission failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card-panel space-y-4 border-orange-500/40">
      <div className="space-y-1">
        <h2 className="font-semibold">Respond and resubmit</h2>
        <p className="text-sm text-muted-foreground">
          Update the information we asked for, then resubmit your application for review.
        </p>
      </div>

      <div className="space-y-3">
        {open.map((r) => (
          <div key={r.id} className="rounded-lg border border-orange-500/40 bg-orange-500/10 p-3">
            <p className="text-xs text-orange-300">
              Message from the review team — {new Date(r.requested_at).toLocaleString()}
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

      {(requestedSections.length > 0 || requestedDocuments.length > 0) && (

        <div className="grid gap-3 sm:grid-cols-2">
          {requestedSections.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
              <p className="text-xs text-muted-foreground">Sections to update</p>
              <ul className="list-inside list-disc">
                {requestedSections.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {requestedDocuments.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
              <p className="text-xs text-muted-foreground">Documents to replace</p>
              <ul className="list-inside list-disc">
                {requestedDocuments.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
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

      {outstanding.length > 0 ? (
        <div className="rounded-lg border border-orange-500/40 bg-orange-500/10 p-3 text-sm">
          <p className="flex items-center gap-2 font-medium text-orange-300">
            <AlertTriangle className="h-4 w-4" /> Still incomplete
          </p>
          <ul className="mt-1 list-inside list-disc">
            {outstanding.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4" /> Everything we asked for looks complete.
        </p>
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

      <button onClick={() => void resubmit()} disabled={busy} className="btn-gold w-full sm:w-auto">
        <Send className="h-4 w-4" /> {busy ? "Resubmitting…" : "Resubmit application"}
      </button>
    </section>
  );
}

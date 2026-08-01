import { useEffect, useState } from "react";
import { Loader2, MessageSquareWarning, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { INFO_DOCUMENTS, INFO_SECTIONS } from "@/components/application/info-requests";
import { createRequestItems } from "@/components/application/request-items";

import { REVIEW_CHECKS } from "@/components/admin/guided-review-model";

export type InfoPrefill = { sections: string[]; documents: string[]; message: string; nonce: number };

export function RequestMoreInfo({
  applicationId,
  onRequested,
  prefill,
}: {
  applicationId: string;
  onRequested?: () => void;
  prefill?: InfoPrefill | null;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sections, setSections] = useState<string[]>([]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!prefill) return;
    setOpen(true);
    setDone(false);
    setSections((prev) => [...new Set([...prev, ...prefill.sections])]);
    setDocuments((prev) => [...new Set([...prev, ...prefill.documents])]);
    if (prefill.message) setMessage((prev) => (prev.trim().length > 0 ? prev : prefill.message));
  }, [prefill]);

  const toggle = (list: string[], set: (v: string[]) => void, key: string) =>
    set(list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);

  const reset = () => {
    setMessage("");
    setSections([]);
    setDocuments([]);
    setDueDate("");
    setConfirming(false);
    setError(null);
  };

  const submit = async () => {
    const text = message.trim();
    if (!text) {
      setError("Please write a message for the contractor.");
      setConfirming(false);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("no user");

      const { data: inserted, error: reqErr } = await db
        .from("application_info_requests")
        .insert({
          application_id: applicationId,
          message: text,
          requested_sections: sections,
          requested_documents: documents,
          requested_by: uid,
          due_date: dueDate || null,
          status: "open",
        })
        .select("id")
        .single();
      if (reqErr) throw new Error(reqErr.message);

      await createRequestItems({
        requestId: (inserted as { id: string }).id,
        applicationId,
        sections,
        documents,
      });


      const { error: statusErr } = await db
        .from("contractor_applications")
        .update({ status: "more_info_required" })
        .eq("id", applicationId);
      if (statusErr) throw new Error(statusErr.message);

      const { error: histErr } = await db.from("application_status_history").insert({
        application_id: applicationId,
        status: "more_info_required",
        reason: text,
        changed_by: uid,
      });
      if (histErr) throw new Error(histErr.message);

      // Mark related review checklist items as Needs Information
      const relatedKeys = REVIEW_CHECKS.filter(
        (c) =>
          (c.infoSection && sections.includes(c.infoSection)) ||
          (c.infoDocument && documents.includes(c.infoDocument)),
      ).map((c) => c.key);
      if (relatedKeys.length > 0) {
        const { data: existing } = await db
          .from("application_review_checks")
          .select("id,check_key")
          .eq("application_id", applicationId)
          .in("check_key", relatedKeys);
        const existingKeys = new Set(((existing as { check_key: string }[]) ?? []).map((r) => r.check_key));
        const stamp = { review_state: "needs_info", reviewed_by: uid, reviewed_at: new Date().toISOString() };
        if (existingKeys.size > 0) {
          await db
            .from("application_review_checks")
            .update(stamp)
            .eq("application_id", applicationId)
            .in("check_key", [...existingKeys]);
        }
        const missing = relatedKeys.filter((k) => !existingKeys.has(k));
        if (missing.length > 0) {
          await db.from("application_review_checks").insert(
            missing.map((k) => ({
              application_id: applicationId,
              check_key: k,
              completed: false,
              ...stamp,
            })),
          );
        }
      }

      setDone(true);
      setOpen(false);
      reset();
      onRequested?.();
    } catch {
      setError("The request could not be sent. Please try again.");
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card-panel space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Request more information</h2>
        {!open && (
          <button className="btn-gold" onClick={() => { setOpen(true); setDone(false); }}>
            <MessageSquareWarning className="h-4 w-4" /> Request more information
          </button>
        )}
      </div>

      {done && !open && (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-2 text-sm text-emerald-300">
          The request was sent and the application is now marked More Information Required.
        </p>
      )}

      {!open && !done && (
        <p className="text-sm text-muted-foreground">
          Ask the contractor to update sections or replace documents before a decision is made.
        </p>
      )}

      {open && (
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="info-message" className="text-sm font-medium">
              Message to the contractor
            </label>
            <textarea
              id="info-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Explain clearly what the contractor needs to do."
              className="w-full rounded-lg border border-white/15 bg-white/5 p-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Sections that need updating</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {INFO_SECTIONS.map((s) => (
                <label key={s.key} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[color:var(--color-gold)]"
                    checked={sections.includes(s.key)}
                    onChange={() => toggle(sections, setSections, s.key)}
                  />
                  <span className="min-w-0 break-words">{s.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Documents that need replacing</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {INFO_DOCUMENTS.map((d) => (
                <label key={d.key} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[color:var(--color-gold)]"
                    checked={documents.includes(d.key)}
                    onChange={() => toggle(documents, setDocuments, d.key)}
                  />
                  <span className="min-w-0 break-words">{d.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="space-y-1">
            <label htmlFor="info-due" className="text-sm font-medium">
              Response deadline (optional)
            </label>
            <input
              id="info-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-white/5 p-2 text-sm outline-none focus:border-[color:var(--color-gold)] sm:w-auto"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <button
              className="btn-gold"
              disabled={busy || message.trim().length === 0}
              onClick={() => setConfirming(true)}
            >
              <Send className="h-4 w-4" /> Send request
            </button>
            <button className="btn-outline" disabled={busy} onClick={() => { setOpen(false); reset(); }}>
              <X className="h-4 w-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm space-y-3 rounded-xl border border-white/15 bg-[color:var(--color-navy,#0b1220)] p-4">
            <h3 className="font-semibold">Confirm request</h3>
            <p className="text-sm text-muted-foreground">
              This will set the application status to More Information Required and send your message to the
              contractor.
            </p>
            <div className="flex flex-wrap gap-2">
              <button className="btn-gold" disabled={busy} onClick={() => void submit()}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Confirm
              </button>
              <button className="btn-outline" disabled={busy} onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

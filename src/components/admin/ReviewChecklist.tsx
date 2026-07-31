import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { ProgressBar } from "@/components/application/shared";

type CheckDef = { key: string; label: string; optional?: boolean };

const CHECKS: CheckDef[] = [
  { key: "contact_details", label: "Contact details checked" },
  { key: "business_information", label: "Business information checked" },
  { key: "services", label: "Services checked" },
  { key: "areas", label: "Areas covered checked" },
  { key: "business_description", label: "Business description checked" },
  { key: "work_photos", label: "Work photos checked" },
  { key: "insurance_status", label: "Insurance status checked" },
  { key: "insurance_document", label: "Insurance document checked" },
  { key: "insurance_expiry", label: "Insurance expiry date checked" },
  { key: "qualifications", label: "Qualifications checked where relevant", optional: true },
  { key: "qualification_documents", label: "Qualification documents checked where relevant", optional: true },
  { key: "references", label: "References or review links checked" },
  { key: "community_rules", label: "Community rules accepted" },
  { key: "accuracy_confirmation", label: "Accuracy confirmation checked" },
  { key: "information_complete", label: "Application information complete" },
];

type CheckRow = {
  check_key: string;
  completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
};

export function ReviewChecklist({
  applicationId,
  qualifications,
}: {
  applicationId: string;
  qualifications: string | null;
}) {
  const [rows, setRows] = useState<Record<string, CheckRow>>({});
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const qualsRelevant = !!(qualifications && qualifications.trim().length > 0);
  const applicable = CHECKS.filter((c) => !(c.optional && !qualsRelevant));

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const { data, error } = await db
        .from("application_review_checks")
        .select("check_key,completed,completed_by,completed_at")
        .eq("application_id", applicationId);
      if (error) {
        setFailed(true);
        return;
      }
      const map: Record<string, CheckRow> = {};
      for (const r of (data as CheckRow[]) ?? []) map[r.check_key] = r;
      setRows(map);

      const ids = [...new Set(Object.values(map).map((r) => r.completed_by).filter(Boolean))] as string[];
      if (ids.length > 0) {
        const { data: profs } = await db.from("profiles").select("id,full_name,email").in("id", ids);
        const nm: Record<string, string> = {};
        for (const p of (profs as { id: string; full_name: string | null; email: string | null }[]) ?? []) {
          nm[p.id] = p.full_name?.trim() || p.email || p.id;
        }
        setNames(nm);
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

  const toggle = async (key: string, next: boolean) => {
    setSaving(key);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id ?? null;
    const payload = {
      application_id: applicationId,
      check_key: key,
      completed: next,
      completed_by: next ? uid : null,
      completed_at: next ? new Date().toISOString() : null,
    };
    const { error } = await db
      .from("application_review_checks")
      .upsert(payload, { onConflict: "application_id,check_key" });
    if (!error) {
      setRows((prev) => ({ ...prev, [key]: payload as CheckRow }));
      if (next && uid && !names[uid]) {
        const { data: p } = await db.from("profiles").select("full_name,email").eq("id", uid).maybeSingle();
        const nm = (p as { full_name?: string | null; email?: string | null } | null) ?? null;
        setNames((prev) => ({ ...prev, [uid]: nm?.full_name?.trim() || nm?.email || uid }));
      }
    }
    setSaving(null);
  };

  if (loading) {
    return (
      <section className="card-panel space-y-3">
        <div className="h-5 w-1/3 animate-pulse rounded bg-white/10" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded bg-white/10" />
        ))}
      </section>
    );
  }

  if (failed) {
    return (
      <section className="card-panel space-y-3">
        <h2 className="font-semibold">Review checklist</h2>
        <p className="text-sm text-muted-foreground">The review checklist could not be loaded.</p>
        <button className="btn-gold w-fit" onClick={() => void load()}>
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </section>
    );
  }

  const total = applicable.length;
  const done = applicable.filter((c) => rows[c.key]?.completed).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const overall = done === 0 ? "Not Started" : done === total ? "Complete" : "In Progress";
  const overallTone =
    overall === "Complete"
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      : overall === "In Progress"
        ? "bg-amber-400/15 text-amber-300 border-amber-400/30"
        : "bg-white/5 text-muted-foreground border-white/10";

  return (
    <section className="card-panel space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Review Checklist</h2>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${overallTone}`}>{overall}</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {done} of {total} review checks completed
          </span>
          <span className="font-semibold">{percent}%</span>
        </div>
        <ProgressBar percent={percent} />
      </div>

      <ul className="space-y-2">
        {CHECKS.map((c) => {
          const notRequired = c.optional && !qualsRelevant;
          const row = rows[c.key];
          const checked = !!row?.completed;
          const who = row?.completed_by ? names[row.completed_by] ?? row.completed_by : null;
          return (
            <li
              key={c.key}
              className={`rounded-xl border p-3 ${
                notRequired
                  ? "border-white/10 bg-white/[0.02] opacity-70"
                  : checked
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-white/10 bg-white/5"
              }`}
            >
              <label className="flex w-full cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-0.5 h-5 w-5 shrink-0 accent-amber-400"
                  checked={checked}
                  disabled={notRequired || saving === c.key}
                  onChange={(e) => void toggle(c.key, e.target.checked)}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="break-words">{c.label}</span>
                    {notRequired && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-muted-foreground">
                        Not Required
                      </span>
                    )}
                    {saving === c.key && <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-300" />}
                    {checked && !notRequired && saving !== c.key && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    )}
                  </span>
                  {checked && row?.completed_at && (
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Completed {new Date(row.completed_at).toLocaleString()}
                      {who ? ` by ${who}` : ""}
                    </span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-muted-foreground">
        Completing this checklist does not change the contractor's application status.
      </p>
    </section>
  );
}

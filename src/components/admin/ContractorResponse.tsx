import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Circle, FileCheck2, RefreshCw } from "lucide-react";
import { db } from "@/lib/db";
import { type InfoRequestRow } from "@/components/application/info-requests";
import {
  ITEM_STATUS_LABEL,
  ITEM_STATUS_TONE,
  itemLabel,
  itemStatus,
  loadSnapshotSource,
  type RequestItemRow,
  type SnapshotSource,
} from "@/components/application/request-items";

type ReplacementDoc = {
  id: string;
  kind: string;
  original_name: string | null;
  created_at: string;
  replaced_at: string | null;
  is_active: boolean;
};

/** Admin-side summary of what the contractor changed in response to a request. */
export function ContractorResponse({ applicationId }: { applicationId: string }) {
  const [requests, setRequests] = useState<InfoRequestRow[]>([]);
  const [items, setItems] = useState<RequestItemRow[]>([]);
  const [src, setSrc] = useState<SnapshotSource | null>(null);
  const [docs, setDocs] = useState<ReplacementDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const { data, error } = await db
        .from("application_info_requests")
        .select(
          "id,application_id,message,requested_sections,requested_documents,requested_by,requested_at,due_date,status,completed_at,response_message,responded_at,resubmitted_at",
        )
        .eq("application_id", applicationId)
        .not("responded_at", "is", null)
        .order("responded_at", { ascending: false });
      if (error) throw new Error(error.message);
      const rows = (data as (InfoRequestRow & { resubmitted_at?: string | null })[]) ?? [];
      setRequests(rows);
      if (rows.length > 0) {
        const [{ data: itemRows }, snapshot, { data: docRows }] = await Promise.all([
          db
            .from("application_info_request_items")
            .select("id,request_id,application_id,item_type,item_key,snapshot")
            .eq("request_id", rows[0]!.id),
          loadSnapshotSource(applicationId),
          db
            .from("contractor_documents")
            .select("id,kind,original_name,created_at,replaced_at,is_active")
            .eq("application_id", applicationId)
            .order("created_at", { ascending: false }),
        ]);
        setItems((itemRows as RequestItemRow[]) ?? []);
        setSrc(snapshot);
        setDocs((docRows as ReplacementDoc[]) ?? []);
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
        <h2 className="font-semibold">Contractor response</h2>
        <p className="text-sm text-muted-foreground">This response could not be loaded.</p>
        <button className="btn-outline w-fit" onClick={() => void load()}>
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </section>
    );
  }

  if (requests.length === 0) return null;

  const latest = requests[0]! as InfoRequestRow & { resubmitted_at?: string | null };
  const replaced = docs.filter((d) => d.replaced_at);
  const newDocs = docs.filter((d) => d.is_active && latest.requested_at && d.created_at > latest.requested_at);

  return (
    <section className="card-panel space-y-3 border-emerald-500/40">
      <h2 className="font-semibold">Contractor response</h2>

      <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
        <p className="text-xs text-emerald-300">
          Responded {latest.responded_at ? new Date(latest.responded_at).toLocaleString() : "—"}
          {latest.resubmitted_at
            ? ` · Resubmitted ${new Date(latest.resubmitted_at).toLocaleString()}`
            : ""}
        </p>
        <p className="mt-1 whitespace-pre-wrap break-words">
          {latest.response_message || "No message was left by the contractor."}
        </p>
      </div>

      {items.length > 0 && src && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Requested items</h3>
          <ul className="space-y-2">
            {items.map((item) => {
              const status = itemStatus(item, src);
              return (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 p-2 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {status === "not_updated" ? (
                      <Circle className="h-4 w-4 shrink-0 text-orange-300" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    )}
                    <span className="min-w-0 break-words">{itemLabel(item)}</span>
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${ITEM_STATUS_TONE[status]}`}>
                    {ITEM_STATUS_LABEL[status]}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {(newDocs.length > 0 || replaced.length > 0) && (
        <div className="space-y-1 text-sm">
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <FileCheck2 className="h-4 w-4" /> Replacement documents
          </h3>
          <ul className="list-inside list-disc">
            {newDocs.map((d) => (
              <li key={d.id}>
                {d.original_name ?? d.kind} — uploaded {new Date(d.created_at).toLocaleString()}
              </li>
            ))}
            {replaced.map((d) => (
              <li key={d.id} className="text-muted-foreground">
                {d.original_name ?? d.kind} — replaced {new Date(d.replaced_at!).toLocaleString()} (kept for
                history)
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

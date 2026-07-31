import { useCallback, useEffect, useState } from "react";
import { CalendarClock, FileWarning, MessageSquareWarning, RefreshCw } from "lucide-react";
import { db } from "@/lib/db";
import {
  INFO_DOCUMENTS,
  INFO_SECTIONS,
  labelFor,
  type InfoRequestRow,
} from "@/components/application/info-requests";

export function InfoRequestList({
  applicationId,
  role,
  refreshKey = 0,
}: {
  applicationId: string;
  role: "admin" | "contractor";
  refreshKey?: number;
}) {
  const [rows, setRows] = useState<InfoRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

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
        .order("requested_at", { ascending: false });
      if (error) {
        setFailed(true);
        return;
      }
      setRows((data as InfoRequestRow[]) ?? []);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

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
        <h2 className="font-semibold">Information requests</h2>
        <p className="text-sm text-muted-foreground">These requests could not be loaded.</p>
        <button className="btn-outline w-fit" onClick={() => void load()}>
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </section>
    );
  }

  return (
    <section className="card-panel space-y-3">
      <h2 className="font-semibold">
        {role === "admin" ? "Information requests sent" : "Information we need from you"}
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">
          {role === "admin"
            ? "No information has been requested from this contractor yet."
            : "There are no outstanding information requests."}
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="space-y-2 rounded-lg border border-orange-500/40 bg-orange-500/10 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <MessageSquareWarning className="h-4 w-4 text-orange-400" />
                <span className="text-sm font-medium text-orange-300">
                  {r.status === "completed" ? "Request completed" : "More information required"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.requested_at).toLocaleString()}
                </span>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm">{r.message}</p>
              {(r.requested_sections?.length ?? 0) > 0 && (
                <div className="text-sm">
                  <p className="text-xs text-muted-foreground">Sections to update</p>
                  <ul className="list-inside list-disc">
                    {r.requested_sections!.map((s) => (
                      <li key={s}>{labelFor(INFO_SECTIONS, s)}</li>
                    ))}
                  </ul>
                </div>
              )}
              {(r.requested_documents?.length ?? 0) > 0 && (
                <div className="text-sm">
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FileWarning className="h-3.5 w-3.5" /> Documents to replace
                  </p>
                  <ul className="list-inside list-disc">
                    {r.requested_documents!.map((d) => (
                      <li key={d}>{labelFor(INFO_DOCUMENTS, d)}</li>
                    ))}
                  </ul>
                </div>
              )}
              {r.due_date && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" /> Please respond by{" "}
                  {new Date(r.due_date).toLocaleDateString()}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

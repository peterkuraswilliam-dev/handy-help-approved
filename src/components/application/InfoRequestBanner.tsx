import { useEffect, useState } from "react";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { db } from "@/lib/db";
import {
  INFO_DOCUMENTS,
  INFO_SECTIONS,
  labelFor,
  type InfoRequestRow,
} from "@/components/application/info-requests";

/**
 * High-visibility banner shown to a contractor whenever the review team has
 * asked for more information. Rendered above the tabs so it is impossible to miss.
 */
export function InfoRequestBanner({
  applicationId,
  refreshKey = 0,
  onGoToMessages,
}: {
  applicationId: string;
  refreshKey?: number;
  onGoToMessages?: () => void;
}) {
  const [rows, setRows] = useState<InfoRequestRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await db
        .from("application_info_requests")
        .select(
          "id,application_id,message,requested_sections,requested_documents,requested_by,requested_at,due_date,status,completed_at",
        )
        .eq("application_id", applicationId)
        .eq("status", "open")
        .order("requested_at", { ascending: false });
      if (!cancelled) setRows((data as InfoRequestRow[]) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [applicationId, refreshKey]);

  if (rows.length === 0) return null;

  const sections = Array.from(new Set(rows.flatMap((r) => r.requested_sections ?? []))).map((k) =>
    labelFor(INFO_SECTIONS, k),
  );
  const documents = Array.from(new Set(rows.flatMap((r) => r.requested_documents ?? []))).map((k) =>
    labelFor(INFO_DOCUMENTS, k),
  );

  return (
    <section className="space-y-3 rounded-xl border-2 border-orange-500 bg-orange-500/15 p-4 shadow-lg">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-400" />
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-orange-200">
            More information is required before your application review can continue.
          </h2>
          <p className="text-xs text-muted-foreground">
            Requested {new Date(rows[0]!.requested_at).toLocaleString()}
          </p>
        </div>
      </div>

      {rows.map((r) => (
        <div key={r.id} className="rounded-lg border border-orange-500/40 bg-black/20 p-3">
          <p className="whitespace-pre-wrap break-words text-sm">{r.message}</p>
          {r.due_date && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-orange-200">
              <CalendarClock className="h-3.5 w-3.5" /> Please respond by{" "}
              {new Date(r.due_date).toLocaleDateString()}
            </p>
          )}
        </div>
      ))}

      {(sections.length > 0 || documents.length > 0) && (
        <div className="grid gap-2 sm:grid-cols-2">
          {sections.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-sm">
              <p className="text-xs text-muted-foreground">Sections to update</p>
              <ul className="list-inside list-disc">
                {sections.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {documents.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-sm">
              <p className="text-xs text-muted-foreground">Documents to replace</p>
              <ul className="list-inside list-disc">
                {documents.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {onGoToMessages && (
        <button className="btn-gold w-full sm:w-auto" onClick={onGoToMessages}>
          View request and respond
        </button>
      )}
    </section>
  );
}

import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { db } from "@/lib/db";

type Event = { id: string; reason: string; public_message: string | null; created_at: string };

export function SuspendedNotice({
  applicationId,
  contractorMessage,
}: {
  applicationId: string;
  contractorMessage?: string | null;
}) {
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await db
        .from("contractor_status_events")
        .select("id,reason,public_message,created_at")
        .eq("application_id", applicationId)
        .eq("action", "suspend")
        .order("created_at", { ascending: false })
        .limit(1);
      if (!cancelled) setEvent(((data as Event[]) ?? [])[0] ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  const message = event?.public_message ?? contractorMessage ?? null;

  return (
    <section className="card-panel space-y-3 border-red-500/40 bg-red-500/10">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/15 px-3 py-1 text-xs font-medium text-red-300">
          <ShieldAlert className="h-3.5 w-3.5" /> Suspended
        </span>
        {event?.created_at && (
          <span className="text-xs text-muted-foreground">
            Suspended on {new Date(event.created_at).toLocaleDateString()}
          </span>
        )}
      </div>
      <p className="text-sm">
        Your Approved Contractor profile is currently suspended. Please review the information provided and contact
        Handy Help Aberdeenshire if required.
      </p>
      {message && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
          <p className="text-xs font-medium text-muted-foreground">Message from Handy Help Aberdeenshire</p>
          <p className="mt-1 whitespace-pre-wrap">{message}</p>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Your public profile and Approved Contractor badge are hidden while suspended. Your application, documents and
        photos are all kept safely.
      </p>
    </section>
  );
}

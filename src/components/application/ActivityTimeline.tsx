import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  CheckCircle2,
  Eye,
  FilePlus2,
  FileText,
  Image as ImageIcon,
  MessageSquareWarning,
  Pencil,
  PlusCircle,
  RefreshCw,
  Send,
  ShieldAlert,
  X,
  XCircle,
} from "lucide-react";
import { db } from "@/lib/db";
import { STATUS_LABEL, type AppStatus } from "@/lib/application-helpers";

type Tone = "neutral" | "gold" | "green" | "orange" | "red";

export type TimelineEvent = {
  id: string;
  at: string;
  title: string;
  description: string;
  actor?: string | null;
  tone: Tone;
  icon: React.ComponentType<{ className?: string }>;
  request?: string | null;
  fromStatus?: AppStatus | null;
  toStatus?: AppStatus | null;
  kind: "status" | "document" | "photo" | "system";
};

type HistoryRow = {
  id: string;
  status: AppStatus;
  reason: string | null;
  created_at: string;
  changed_by: string | null;
};

type DocRow = { id: string; kind: string; original_name: string | null; created_at: string };
type PhotoRow = { id: string; created_at: string };

const TONE_RING: Record<Tone, string> = {
  neutral: "border-white/15 text-primary",
  gold: "border-[color:var(--color-gold)] text-[color:var(--color-gold)]",
  green: "border-emerald-500/50 text-emerald-400",
  orange: "border-orange-500/50 text-orange-400",
  red: "border-destructive/60 text-destructive",
};

const STATUS_META: Record<
  AppStatus,
  {
    adminTitle: string;
    adminDesc: string;
    contractorTitle: string;
    contractorDesc: string;
    tone: Tone;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  draft: {
    adminTitle: "Application returned to draft",
    adminDesc: "The application was moved back to draft.",
    contractorTitle: "Application started",
    contractorDesc: "You started your application.",
    tone: "neutral",
    icon: Pencil,
  },
  submitted: {
    adminTitle: "Application submitted",
    adminDesc: "The application was submitted for review.",
    contractorTitle: "Application submitted",
    contractorDesc: "You submitted your application for review.",
    tone: "gold",
    icon: Send,
  },
  under_review: {
    adminTitle: "Status changed to Under Review",
    adminDesc: "The application moved into review.",
    contractorTitle: "Under review",
    contractorDesc: "We are reviewing your application.",
    tone: "gold",
    icon: Eye,
  },
  more_info_required: {
    adminTitle: "More information requested",
    adminDesc: "More information was requested from the contractor.",
    contractorTitle: "We need some more information",
    contractorDesc: "We asked for some additional information.",
    tone: "orange",
    icon: MessageSquareWarning,
  },
  approved: {
    adminTitle: "Application approved",
    adminDesc: "The contractor was approved.",
    contractorTitle: "Your application has been approved",
    contractorDesc: "You are now an approved contractor.",
    tone: "green",
    icon: CheckCircle2,
  },
  rejected: {
    adminTitle: "Application rejected",
    adminDesc: "The application was rejected.",
    contractorTitle: "Your application was not approved",
    contractorDesc: "Your application has been rejected.",
    tone: "red",
    icon: XCircle,
  },
  suspended: {
    adminTitle: "Contractor suspended",
    adminDesc: "The contractor was suspended.",
    contractorTitle: "Your listing is suspended",
    contractorDesc: "Your approved listing is currently suspended.",
    tone: "red",
    icon: ShieldAlert,
  },
};

function fmt(at: string) {
  return new Date(at).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildEvents(opts: {
  role: "admin" | "contractor";
  createdAt: string | null;
  ownerUserId: string | null;
  history: HistoryRow[];
  docs: DocRow[];
  photos: PhotoRow[];
}): TimelineEvent[] {
  const { role, createdAt, ownerUserId, history, docs, photos } = opts;
  const admin = role === "admin";
  const events: TimelineEvent[] = [];

  const hasDraftEvent = history.some((h) => h.status === "draft");
  if (createdAt && !hasDraftEvent) {
    events.push({
      id: `created-${createdAt}`,
      at: createdAt,
      title: "Application created",
      description: admin ? "The contractor started a new application." : "You started your application.",
      actor: admin ? "System" : null,
      tone: "green",
      icon: PlusCircle,
      kind: "system",
    });
  }

  const chronological = [...history].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  chronological.forEach((h, i) => {
    const meta = STATUS_META[h.status];
    const prev = i > 0 ? chronological[i - 1].status : null;
    const byOwner = !!ownerUserId && h.changed_by === ownerUserId;
    const resubmitted = h.status === "submitted" && !!prev;
    events.push({
      id: h.id,
      at: h.created_at,
      title: resubmitted
        ? admin
          ? "Application resubmitted"
          : "Application resubmitted"
        : admin
          ? meta.adminTitle
          : meta.contractorTitle,
      description: resubmitted
        ? admin
          ? "The application was resubmitted after updates."
          : "You resubmitted your application."
        : admin
          ? meta.adminDesc
          : meta.contractorDesc,
      actor: admin ? (byOwner ? "Contractor" : h.changed_by ? "Admin" : "System") : null,
      tone: meta.tone,
      icon: resubmitted ? Send : meta.icon,
      request: h.status === "more_info_required" ? h.reason : admin ? h.reason : null,
      fromStatus: prev,
      toStatus: h.status,
      kind: "status",
    });
  });

  for (const d of docs) {
    const qualification = d.kind === "qualification";
    events.push({
      id: `doc-${d.id}`,
      at: d.created_at,
      title: admin ? (qualification ? "Qualification added" : "Document uploaded") : "Document uploaded",
      description: admin
        ? `${d.original_name?.trim() || "A document"} was uploaded${qualification ? "" : ` (${d.kind})`}.`
        : "You uploaded a document.",
      actor: admin ? "Contractor" : null,
      tone: qualification ? "neutral" : "gold",
      icon: qualification ? Award : FileText,
      kind: "document",
    });
  }

  if (admin) {
    for (const p of photos) {
      events.push({
        id: `photo-${p.id}`,
        at: p.created_at,
        title: "Work photo uploaded",
        description: "A previous work photo was added to the gallery.",
        actor: "Contractor",
        tone: "neutral",
        icon: ImageIcon,
        kind: "photo",
      });
    }
  }

  return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

function EventCard({ event, admin }: { event: TimelineEvent; admin: boolean }) {
  const [openRequest, setOpenRequest] = useState(false);
  const Icon = event.icon;
  const showRequest = event.toStatus === "more_info_required" && !!event.request;

  return (
    <li className="relative pl-10">
      <span
        className={`absolute left-0 top-3 grid h-7 w-7 place-items-center rounded-full border bg-card ${TONE_RING[event.tone]}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div
        className={`rounded-lg border bg-white/5 p-3 ${
          event.tone === "orange"
            ? "border-orange-500/40"
            : event.tone === "red"
              ? "border-destructive/40"
              : "border-white/10"
        }`}
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <p className="min-w-0 break-words text-sm font-semibold">{event.title}</p>
          <p className="shrink-0 text-xs text-muted-foreground sm:text-right">{fmt(event.at)}</p>
        </div>
        <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <p className="min-w-0 break-words text-sm text-muted-foreground">{event.description}</p>
          {admin && event.actor && (
            <p className="shrink-0 text-xs text-muted-foreground sm:text-right">{event.actor}</p>
          )}
        </div>
        {admin && event.kind === "status" && event.fromStatus && event.toStatus && (
          <p className="mt-1 text-xs text-muted-foreground">
            {STATUS_LABEL[event.fromStatus]} → {STATUS_LABEL[event.toStatus]}
          </p>
        )}
        {showRequest && (
          <>
            {admin ? (
              <p className="mt-2 break-words rounded-md border border-orange-500/30 bg-orange-500/10 p-2 text-sm">
                {event.request}
              </p>
            ) : (
              <button className="btn-gold mt-2 w-full sm:w-auto" onClick={() => setOpenRequest(true)}>
                <MessageSquareWarning className="h-4 w-4" /> View Request
              </button>
            )}
          </>
        )}
      </div>

      {openRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Information request"
        >
          <div className="w-full max-w-md space-y-3 rounded-xl border border-white/10 bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold">Information request</p>
              <button className="btn-ghost" onClick={() => setOpenRequest(false)} aria-label="Close request">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">{fmt(event.at)}</p>
            <p className="break-words text-sm">{event.request}</p>
            <button className="btn-ghost w-full" onClick={() => setOpenRequest(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export function ActivityTimeline({
  applicationId,
  role,
  createdAt,
  ownerUserId = null,
}: {
  applicationId: string;
  role: "admin" | "contractor";
  createdAt: string | null;
  ownerUserId?: string | null;
}) {
  const admin = role === "admin";
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<"all" | "status" | "document" | "photo">("all");

  const load = useCallback(async () => {
    if (!applicationId) return;
    setLoading(true);
    setFailed(false);
    try {
      const [hist, doc, gal] = await Promise.all([
        db
          .from("application_status_history")
          .select("id,status,reason,created_at,changed_by")
          .eq("application_id", applicationId)
          .order("created_at", { ascending: false }),
        db
          .from("contractor_documents")
          .select("id,kind,original_name,created_at")
          .eq("application_id", applicationId),
        db.from("contractor_gallery").select("id,created_at").eq("application_id", applicationId),
      ]);
      if (hist.error || doc.error || gal.error) {
        setFailed(true);
        return;
      }
      setHistory((hist.data as HistoryRow[]) ?? []);
      setDocs((doc.data as DocRow[]) ?? []);
      setPhotos((gal.data as PhotoRow[]) ?? []);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const events = useMemo(
    () => buildEvents({ role, createdAt, ownerUserId, history, docs, photos }),
    [role, createdAt, ownerUserId, history, docs, photos],
  );

  const visible = filter === "all" ? events : events.filter((e) => e.kind === filter);

  return (
    <section className="card-panel space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-semibold">{admin ? "Application Activity Timeline" : "Application Updates"}</h2>
          <p className="text-xs text-muted-foreground">
            {admin
              ? "Full timeline of all important events and updates."
              : "A timeline of updates on your application."}
          </p>
        </div>
        {admin && !loading && !failed && events.length > 0 && (
          <label className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
            <span className="sr-only">Filter events</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="w-full rounded-md border border-white/15 bg-secondary px-2 py-1.5 text-sm text-foreground sm:w-auto"
            >
              <option value="all">All events</option>
              <option value="status">Status events</option>
              <option value="document">Documents</option>
              <option value="photo">Photos</option>
            </select>
          </label>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-white/10" />
          ))}
        </div>
      ) : failed ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Application activity could not be loaded.</p>
          <button className="btn-gold" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">
          {events.length === 0
            ? admin
              ? "No application activity has been recorded yet."
              : "Your application updates will appear here."
            : "No events match this filter."}
        </p>
      ) : (
        <ol className="relative space-y-3 before:absolute before:bottom-3 before:left-[13px] before:top-3 before:w-px before:bg-white/10">
          {visible.map((e) => (
            <EventCard key={e.id} event={e} admin={admin} />
          ))}
        </ol>
      )}

      {admin && !loading && !failed && (
        <p className="flex items-center gap-1.5 border-t border-white/10 pt-3 text-xs text-muted-foreground">
          <FilePlus2 className="h-3.5 w-3.5" /> Times are shown in your local time.
        </p>
      )}
    </section>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  BellOff,
  CalendarClock,
  Clock,
  FileText,
  Mail,
  ShieldAlert,
  Users,
} from "lucide-react";
import { getAdminAttentionQueue, sendFollowUpReminder, type AttentionItem, type AttentionQueue } from "@/lib/admin-operations.functions";
import { EmptyPanel, ErrorPanel, LoadingCards } from "@/components/ui/states";

import { STATUS_PILL_CLASS } from "@/lib/application-helpers";

export const Route = createFileRoute("/_authenticated/admin/operations")({
  head: () => ({
    meta: [
      { title: "Operations — Handy Help Aberdeenshire" },
      {
        name: "description",
        content: "Admin operations centre for Handy Help Aberdeenshire contractor onboarding.",
      },
      { property: "og:title", content: "Operations — Handy Help Aberdeenshire" },
      {
        property: "og:description",
        content: "Prioritised admin follow-ups for contractor applications and renewals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminOperations,
});

const SNOOZE_KEY = "hh-ops-snooze";
const SNOOZE_MS = 24 * 60 * 60 * 1000;

type SnoozeMap = Record<string, number>;

function readSnoozes(): SnoozeMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SNOOZE_KEY);
    return raw ? (JSON.parse(raw) as SnoozeMap) : {};
  } catch {
    return {};
  }
}

function writeSnoozes(map: SnoozeMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SNOOZE_KEY, JSON.stringify(map));
}

function isSnoozed(map: SnoozeMap, id: string) {
  const until = map[id];
  if (!until) return false;
  return Date.now() < until;
}

function snoozeId(id: string) {
  const map = readSnoozes();
  map[id] = Date.now() + SNOOZE_MS;
  writeSnoozes(map);
}

const ICONS: Record<AttentionItem["type"], typeof Clock> = {
  stuck_application: Clock,
  info_request_due: FileText,
  insurance_expiring: ShieldAlert,
  invitation_pending: Mail,
};

const TONE: Record<AttentionItem["type"], string> = {
  stuck_application: "border-warning/40 bg-warning/10 text-warning-soft",
  info_request_due: "border-[color:var(--color-gold)]/50 bg-[color:var(--color-gold)]/10 text-[color:var(--color-gold)]",
  insurance_expiring: "border-destructive/40 bg-destructive/10 text-destructive-soft",
  invitation_pending: "border-info/40 bg-info/10 text-info-soft",
};

function UrgencyDot({ urgency }: { urgency: number }) {
  if (urgency === 1) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive-soft">
        <AlertTriangle className="h-3.5 w-3.5" />
        Critical
      </span>
    );
  }
  if (urgency === 2) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[color:var(--color-gold)]">
        <CalendarClock className="h-3.5 w-3.5" />
        Urgent
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      Soon
    </span>
  );
}

function CountCard({
  label,
  count,
  icon: Icon,
  tone,
  onClick,
}: {
  label: string;
  count: number;
  icon: typeof Clock;
  tone: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`card-panel flex items-center justify-between gap-3 text-left transition hover:border-[color:var(--color-gold)]/40 ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold tracking-tight">{count}</p>
      </div>
      <div className={`rounded-lg border p-2.5 ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
    </button>
  );
}

function ReminderForm({
  item,
  onSent,
  onCancel,
}: {
  item: AttentionItem;
  onSent: () => void;
  onCancel: () => void;
}) {
  const sendReminder = useServerFn(sendFollowUpReminder);
  const [message, setMessage] = useState(() => defaultReminderMessage(item));
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || !item.recipientId) return;
    setBusy(true);
    try {
      await sendReminder({
        data: {
          itemId: item.id,
          type: item.type,
          applicationId: item.actionUrl.split("/")[3] ?? "",
          recipientId: item.recipientId,
          message: message.trim(),
        },
      });
      toast.success("Reminder sent");
      onSent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reminder");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 rounded-lg border border-border/60 bg-secondary/40 p-3">
      <label htmlFor={`reminder-${item.id}`} className="text-sm font-medium">
        Message to contractor
      </label>
      <textarea
        id={`reminder-${item.id}`}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
        className="min-h-[4.5rem] text-sm"
      />
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy || !message.trim() || !item.recipientId} className="btn-gold text-sm">
          <Bell className="h-4 w-4" />
          {busy ? "Sending…" : "Send reminder"}
        </button>
        <button type="button" onClick={onCancel} className="btn-outline text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}

function defaultReminderMessage(item: AttentionItem) {
  switch (item.type) {
    case "stuck_application":
      return "Your application has been waiting for an update. Please check your dashboard and submit anything missing so we can continue the review.";
    case "info_request_due":
      return "We are still waiting for the information requested. Please upload the missing details before the due date so we can complete your review.";
    case "insurance_expiring":
      return "Your public liability insurance is expiring or has expired. Please upload current insurance evidence to keep your approved profile active.";
    default:
      return "Please review your Handy Help application dashboard.";
  }
}

function ActionItemRow({
  item,
  onSnooze,
}: {
  item: AttentionItem;
  onSnooze: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const Icon = ICONS[item.type];

  return (
    <li className={`card-panel space-y-3 border-l-4 ${TONE[item.type].split(" ")[0].replace("border-", "border-l-")}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`shrink-0 rounded-lg border p-2 ${TONE[item.type]}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{item.title}</h3>
              <UrgencyDot urgency={item.urgency} />
            </div>
            <p className="text-sm font-medium">{item.businessName}</p>
            <p className="text-sm text-muted-foreground">{item.summary}</p>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Link to={item.actionUrl} className="btn-outline text-sm">
            Open
          </Link>
          {item.recipientId && (
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="btn-outline text-sm"
              aria-expanded={showForm}
            >
              <Bell className="h-4 w-4" />
              Remind
            </button>
          )}
          <button
            type="button"
            onClick={() => onSnooze(item.id)}
            className="btn-ghost text-sm"
            title="Hide for 24 hours"
          >
            <Snooze className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Snooze</span>
          </button>
        </div>
      </div>

      {showForm && (
        <ReminderForm
          item={item}
          onSent={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}
    </li>
  );
}

function AdminOperations() {
  const fetchQueue = useServerFn(getAdminAttentionQueue);
  const [queue, setQueue] = useState<ReturnType<typeof getAdminAttentionQueue> extends Promise<infer T> ? T : never | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [snoozes, setSnoozes] = useState<SnoozeMap>({});
  const [filter, setFilter] = useState<AttentionItem["type"] | "all">("all");

  useEffect(() => {
    setSnoozes(readSnoozes());
  }, []);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchQueue();
      setQueue(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load operations queue");
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function handleSnooze(id: string) {
    snoozeId(id);
    const map = readSnoozes();
    setSnoozes(map);
    toast.success("Hidden for 24 hours");
  }

  const visibleItems =
    queue?.items.filter((item) => !isSnoozed(snoozes, item.id) && (filter === "all" || item.type === filter)) ?? [];

  return (
    <div className="shell space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/admin" className="btn-ghost inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Admin
        </Link>
        <h1 className="font-display text-2xl text-[color:var(--color-gold)]">Operations centre</h1>
      </div>

      <p className="max-w-2xl text-sm text-muted-foreground">
        A prioritised queue of follow-up actions. Items are sorted by urgency, and snoozed items reappear after 24
        hours.
      </p>

      {loading && <LoadingCards count={3} label="Loading operations queue…" />}

      {!loading && error && <ErrorPanel title="Operations queue could not load" onRetry={() => void load()} />}

      {!loading && !error && queue && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <CountCard
              label="Stuck applications"
              count={queue.counts.stuck}
              icon={Clock}
              tone="border-warning/40 bg-warning/10 text-warning-soft"
              onClick={() => setFilter("stuck_application")}
            />
            <CountCard
              label="Info requests due"
              count={queue.counts.infoRequests}
              icon={FileText}
              tone="border-[color:var(--color-gold)]/50 bg-[color:var(--color-gold)]/10 text-[color:var(--color-gold)]"
              onClick={() => setFilter("info_request_due")}
            />
            <CountCard
              label="Insurance expiring"
              count={queue.counts.insurance}
              icon={ShieldAlert}
              tone="border-destructive/40 bg-destructive/10 text-destructive-soft"
              onClick={() => setFilter("insurance_expiring")}
            />
            <CountCard
              label="Pending invitations"
              count={queue.counts.invitations}
              icon={Mail}
              tone="border-info/40 bg-info/10 text-info-soft"
              onClick={() => setFilter("invitation_pending")}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["all", "All"],
                ["stuck_application", "Stuck"],
                ["info_request_due", "Info requests"],
                ["insurance_expiring", "Insurance"],
                ["invitation_pending", "Invitations"],
              ] as [AttentionItem["type"] | "all", string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={
                  filter === value
                    ? "btn-gold text-xs"
                    : "btn-outline text-xs"
                }
              >
                {label}
              </button>
            ))}
            {filter !== "all" && (
              <button type="button" onClick={() => setFilter("all")} className="btn-ghost text-xs">
                Clear filter
              </button>
            )}
          </div>

          {visibleItems.length === 0 ? (
            <EmptyPanel
              icon={Users}
              title="All caught up"
              message="No follow-up actions need your attention right now. Snoozed items will reappear after 24 hours."
              action={
                filter !== "all" && (
                  <button type="button" onClick={() => setFilter("all")} className="btn-outline text-xs">
                    Show all
                  </button>
                )
              }
            />
          ) : (
            <ul className="space-y-3">
              {visibleItems.map((item) => (
                <ActionItemRow key={item.id} item={item} onSnooze={handleSnooze} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

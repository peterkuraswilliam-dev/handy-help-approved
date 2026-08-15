import { useEffect, useRef, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, FileWarning, ShieldCheck } from "lucide-react";
import { STATUS_LABEL, STATUS_PILL_CLASS, type AppStatus } from "@/lib/application-helpers";

export type TabDef = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
};

export function StatusBadge({ status }: { status: AppStatus }) {
  return (
    <span className={STATUS_PILL_CLASS[status]}>
      {status === "approved" && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
      {STATUS_LABEL[status]}
    </span>
  );
}


export function NeedsAttentionBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-gold)] px-2.5 py-1 text-xs font-semibold text-[color:var(--color-gold)]">
      <AlertTriangle className="h-3.5 w-3.5" /> Needs Attention
    </span>
  );
}

export function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
      <div
        className="h-full bg-[color:var(--color-gold)] transition-all"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function MetricCard({
  icon: Icon,
  tone = "neutral",
  value,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone?: "neutral" | "warning" | "success" | "gold";
  value: ReactNode;
  label: string;
  children?: ReactNode;
}) {
  const toneClass =
    tone === "warning"
      ? "text-warning"
      : tone === "success"
        ? "text-success"
        : tone === "gold"
          ? "text-[color:var(--color-gold)]"
          : "text-primary";
  return (
    <div className="card-panel space-y-2">
      <div className="flex items-start gap-2">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${toneClass}`} />
        <div className="min-w-0">
          <p className="text-lg font-bold leading-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export function MissingInfoCard({ items }: { items: string[] }) {
  return (
    <MetricCard
      icon={items.length ? AlertTriangle : CheckCircle2}
      tone={items.length ? "warning" : "success"}
      value={items.length ? items.length : "Complete"}
      label={items.length ? "Information missing" : "Required information complete"}
    >
      {items.length > 0 && (
        <ul className="ml-4 list-disc space-y-0.5 text-xs text-muted-foreground">
          {items.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}
    </MetricCard>
  );
}

export function MissingDocsCard({ items }: { items: string[] }) {
  return (
    <MetricCard
      icon={items.length ? FileWarning : CheckCircle2}
      tone={items.length ? "warning" : "success"}
      value={items.length ? items.length : "Complete"}
      label={items.length ? "Documents missing" : "Required documents complete"}
    >
      {items.length > 0 && (
        <ul className="ml-4 list-disc space-y-0.5 text-xs text-muted-foreground">
          {items.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}
    </MetricCard>
  );
}

export function InsuranceCard({ status }: { status: string | null }) {
  const provided = !!status && /yes|valid|provided|insur/i.test(status) && !/no\b|none/i.test(status);
  return (
    <MetricCard
      icon={ShieldCheck}
      tone={provided ? "success" : "warning"}
      value={status?.trim() || "Not provided"}
      label="Insurance status"
    />
  );
}

export function ProgressCard({ percent }: { percent: number }) {
  return (
    <MetricCard icon={ClipboardList} tone="gold" value={`${percent}%`} label="Application progress">
      <ProgressBar percent={percent} />
    </MetricCard>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card-panel space-y-1 text-center">
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TabNav({
  tabs,
  active,
  onSelect,
}: {
  tabs: TabDef[];
  active: string;
  onSelect: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [active]);

  const enabled = tabs.filter((t) => !t.disabled);

  function onKeyDown(e: React.KeyboardEvent) {
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const i = enabled.findIndex((t) => t.id === active);
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? enabled.length - 1
          : (i + (e.key === "ArrowRight" ? 1 : -1) + enabled.length) % enabled.length;
    const target = enabled[next];
    if (target) onSelect(target.id);
  }

  return (
    <div ref={ref} className="tab-scroll -mx-1 overflow-x-auto px-1 pb-1">
      <div
        role="tablist"
        aria-label="Application sections"
        onKeyDown={onKeyDown}
        className="flex w-max gap-1 border-b border-border"
      >
        {tabs.map((t) => {
          const isActive = t.id === active;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              disabled={t.disabled}
              title={t.disabled ? `${t.label} (available once approved)` : t.label}
              onClick={() => onSelect(t.id)}
              className={`flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "border-[color:var(--color-gold)] font-semibold text-[color:var(--color-gold)]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              } ${t.disabled ? "cursor-not-allowed opacity-40" : ""}`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ApplicationHeader({
  logo,
  businessName,
  contactName,
  applicationId,
  status,
  submittedAt,
  updatedAt,
  percent,
  back,
  needsAttention,
  aside,
}: {
  logo: ReactNode;
  businessName: string;
  contactName: string | null;
  applicationId: string;
  status: AppStatus;
  submittedAt: string | null;
  updatedAt: string | null;
  percent: number;
  back?: ReactNode;
  needsAttention?: boolean;
  aside?: ReactNode;
}) {
  return (
    <header className="space-y-3">
      {back}
      <div className="card-panel space-y-3">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
            {logo}
          </div>
          <div className="min-w-0 space-y-1">
            <h1 className="break-words text-xl font-bold sm:text-2xl">{businessName}</h1>
            <p className="truncate text-sm text-muted-foreground">
              Contact: {contactName?.trim() || "Not provided"}
            </p>
            <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              Ref HH-{applicationId.slice(0, 8)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <StatusBadge status={status} />
          {needsAttention && <NeedsAttentionBadge />}
        </div>

        <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
          <p>Submitted: {submittedAt ? new Date(submittedAt).toLocaleDateString() : "Not submitted"}</p>
          <p>Last updated: {updatedAt ? new Date(updatedAt).toLocaleString() : "—"}</p>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-[color:var(--color-gold)]">{percent}%</span>
          </div>
          <ProgressBar percent={percent} />
        </div>

        {aside}
      </div>
    </header>
  );
}

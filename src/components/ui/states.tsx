import type { ComponentType, ReactNode } from "react";
import { AlertTriangle, Inbox } from "lucide-react";

/**
 * Shared loading / empty / error presentation so every list in the app
 * (admin queue, notifications, directory, application panels) looks and
 * reads the same way.
 */

export function LoadingCards({
  count = 3,
  label = "Loading…",
  className = "space-y-3",
}: {
  count?: number;
  label?: string;
  className?: string;
}) {
  return (
    <div className={className} aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-panel space-y-3" aria-hidden="true">
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-3 w-1/3" />
          <div className="flex gap-2">
            <div className="skeleton h-5 w-20 rounded-full" />
            <div className="skeleton h-5 w-28 rounded-full" />
          </div>
          <div className="skeleton h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

export function EmptyPanel({
  icon: Icon = Inbox,
  title,
  message,
  action,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <section className="state-panel space-y-2">
      <Icon className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
      <h2 className="text-base font-semibold">{title}</h2>
      {message && (
        <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">{message}</p>
      )}
      {action && <div className="flex flex-wrap justify-center gap-2 pt-2">{action}</div>}
    </section>
  );
}

export function ErrorPanel({
  title = "That could not be loaded",
  message = "Please check your connection and try again.",
  onRetry,
  retryLabel = "Try again",
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <section className="state-panel space-y-2" role="alert">
      <AlertTriangle
        className="mx-auto h-6 w-6 text-[color:var(--color-warning)]"
        aria-hidden="true"
      />
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">{message}</p>
      {onRetry && (
        <div className="pt-2">
          <button type="button" className="btn-outline" onClick={onRetry}>
            {retryLabel}
          </button>
        </div>
      )}
    </section>
  );
}

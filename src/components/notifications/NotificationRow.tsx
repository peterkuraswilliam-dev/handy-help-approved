import { useRouter } from "@tanstack/react-router";
import { Circle } from "lucide-react";
import type { AppNotification } from "@/lib/notifications";
import { formatWhen, notificationMeta } from "@/lib/notifications";

export function NotificationRow({
  item,
  onOpen,
  compact = false,
}: {
  item: AppNotification;
  onOpen: (item: AppNotification) => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const meta = notificationMeta(item.notification_type);
  const Icon = meta.icon;

  const open = () => {
    onOpen(item);
    if (item.action_url) void router.navigate({ to: item.action_url as never });
  };

  return (
    <button
      type="button"
      onClick={open}
      className={`flex w-full items-start gap-3 border-b border-border/50 px-4 text-left transition hover:bg-white/5 ${
        compact ? "py-3" : "py-4"
      } ${item.is_read ? "" : "bg-white/[0.04]"}`}
    >
      <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border ${meta.tone}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={`min-w-0 truncate text-sm ${item.is_read ? "font-medium" : "font-semibold"}`}>
            {item.title}
          </span>
          {!item.is_read && (
            <Circle className="h-2 w-2 shrink-0 fill-[color:var(--color-gold)] text-[color:var(--color-gold)]" />
          )}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground line-clamp-2">{item.message}</span>
        <span className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className={`rounded-full border px-2 py-0.5 ${meta.tone}`}>{meta.label}</span>
          <span>{formatWhen(item.created_at)}</span>
        </span>
      </span>
    </button>
  );
}

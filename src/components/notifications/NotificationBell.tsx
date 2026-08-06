import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationRow } from "@/components/notifications/NotificationRow";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { items, unread, readOne, readAll } = useNotifications();
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const latest = items.slice(0, 6);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        className="btn-outline relative inline-flex items-center px-2.5"
        onClick={() => {
          if (isMobile) void navigate({ to: "/notifications" });
          else setOpen((v) => !v);
        }}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-[color:var(--color-gold)] px-1 text-[10px] font-bold text-[color:var(--color-primary-foreground)]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && !isMobile && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            ref={panelRef}
            className="absolute right-0 z-50 mt-2 w-[22rem] overflow-hidden rounded-lg border border-border/60 bg-[color:var(--color-background)] shadow-xl"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
              <p className="text-sm font-semibold">Notifications</p>
              {unread > 0 && (
                <button type="button" onClick={() => void readAll()} className="btn-ghost text-xs">
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-[26rem] overflow-y-auto">
              {latest.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">You have no notifications yet.</p>
              ) : (
                latest.map((n) => (
                  <NotificationRow
                    key={n.id}
                    item={n}
                    compact
                    onOpen={(item) => {
                      setOpen(false);
                      if (!item.is_read) void readOne(item.id);
                    }}
                  />
                ))
              )}
            </div>
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-border/60 px-4 py-3 text-center text-sm text-[color:var(--color-gold)] hover:bg-white/5"
            >
              View all notifications
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

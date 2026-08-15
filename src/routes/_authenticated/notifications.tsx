import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationRow } from "@/components/notifications/NotificationRow";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Handy Help Aberdeenshire" },
      {
        name: "description",
        content:
          "Your Handy Help Aberdeenshire notifications: application updates, information requests, documents and insurance reminders.",
      },
      { property: "og:title", content: "Notifications — Handy Help Aberdeenshire" },
      {
        property: "og:description",
        content: "Application updates, information requests, documents and insurance reminders in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotificationsPage,
});

type Filter = "all" | "unread" | "read";

function NotificationsPage() {
  const { items, unread, loading, readOne, readAll } = useNotifications();
  const [filter, setFilter] = useState<Filter>("all");

  const shown = items.filter((n) =>
    filter === "all" ? true : filter === "unread" ? !n.is_read : n.is_read,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Bell className="h-5 w-5 text-[color:var(--color-gold)]" /> Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            {unread > 0 ? `${unread} unread` : "You are all caught up"}
          </p>
        </div>
        {unread > 0 && (
          <button type="button" className="btn-outline text-sm" onClick={() => void readAll()}>
            <CheckCheck className="h-4 w-4" /> Mark all as read
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {(["all", "unread", "read"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={filter === f ? "btn-gold text-xs capitalize" : "btn-outline text-xs capitalize"}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="card-panel overflow-hidden !p-0">
        {loading ? (
          <div className="p-4">
            <LoadingCards count={2} label="Loading your notifications…" />
          </div>
        ) : shown.length === 0 ? (
          <EmptyPanel
            icon={Bell}
            title={filter === "unread" ? "No unread notifications" : "No notifications yet"}
            message={
              filter === "unread"
                ? "You have read everything for now."
                : "Updates about your application, information requests and documents will appear here."
            }
          />
        ) : (

          shown.map((n) => (
            <div key={n.id} className="relative">
              <NotificationRow item={n} onOpen={(item) => !item.is_read && void readOne(item.id)} />
              {!n.is_read && (
                <button
                  type="button"
                  onClick={() => void readOne(n.id)}
                  className="absolute right-3 top-3 rounded-full border border-border/60 px-2 py-1 text-[11px] text-muted-foreground hover:text-[color:var(--color-gold)]"
                >
                  Mark as read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  FileText,
  MessageCircleQuestion,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { db } from "@/lib/db";

export type NotificationType =
  | "application"
  | "information_request"
  | "document"
  | "insurance"
  | "approval"
  | "rejection"
  | "suspension"
  | "profile";

export type AppNotification = {
  id: string;
  application_id: string | null;
  notification_type: NotificationType | string;
  audience: string;
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

type Meta = { label: string; icon: typeof Bell; tone: string };

const DEFAULT_META: Meta = {
  label: "Update",
  icon: Bell,
  tone: "border-white/15 bg-white/5 text-muted-foreground",
};

export const NOTIFICATION_META: Record<string, Meta> = {
  application: {
    label: "Application",
    icon: FileText,
    tone: "border-white/20 bg-white/5 text-foreground",
  },
  information_request: {
    label: "Information request",
    icon: MessageCircleQuestion,
    tone: "border-orange-400/40 bg-orange-400/10 text-orange-300",
  },
  document: {
    label: "Document",
    icon: FileText,
    tone: "border-sky-400/40 bg-sky-400/10 text-sky-300",
  },
  insurance: {
    label: "Insurance",
    icon: ShieldCheck,
    tone: "border-[color:var(--color-gold)]/50 bg-[color:var(--color-gold)]/10 text-[color:var(--color-gold)]",
  },
  approval: {
    label: "Approval",
    icon: BadgeCheck,
    tone: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  },
  rejection: {
    label: "Rejection",
    icon: XCircle,
    tone: "border-destructive/50 bg-destructive/10 text-destructive",
  },
  suspension: {
    label: "Suspension",
    icon: ShieldAlert,
    tone: "border-red-500/40 bg-red-500/10 text-red-300",
  },
  profile: {
    label: "Profile",
    icon: UserRound,
    tone: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  },
  warning: { label: "Alert", icon: AlertTriangle, tone: DEFAULT_META.tone },
};

export function notificationMeta(type: string): Meta {
  return NOTIFICATION_META[type] ?? DEFAULT_META;
}

export function formatWhen(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatExact(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function fetchNotifications(limit = 100): Promise<AppNotification[]> {
  const { data } = await db
    .from("notifications")
    .select("id,application_id,notification_type,audience,title,message,action_url,is_read,read_at,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as AppNotification[]) ?? [];
}

export async function markRead(ids: string[]) {
  if (ids.length === 0) return;
  await db
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .in("id", ids);
}

export async function markAllRead() {
  await db
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("is_read", false);
}

/** Tops up insurance expiry reminders. Safe to call repeatedly: the database de-duplicates. */
export async function syncInsuranceNotifications() {
  await db.rpc("sync_insurance_notifications");
}

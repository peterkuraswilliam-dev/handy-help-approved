import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { ADMIN_ATTENTION_THRESHOLDS } from "@/lib/site-config";
import { STATUS_LABEL } from "@/lib/application-helpers";

const THRESHOLDS = ADMIN_ATTENTION_THRESHOLDS;

export type ActionItemType =
  | "stuck_application"
  | "info_request_due"
  | "insurance_expiring"
  | "invitation_pending";

export type AttentionItem = {
  id: string;
  type: ActionItemType;
  title: string;
  businessName: string;
  summary: string;
  days: number;
  urgency: 1 | 2 | 3;
  actionUrl: string;
  recipientId: string | null;
  meta: Record<string, string>;
};

export type AttentionQueue = {
  items: AttentionItem[];
  counts: {
    stuck: number;
    infoRequests: number;
    insurance: number;
    invitations: number;
    total: number;
  };
  thresholds: typeof THRESHOLDS;
};

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error("We could not complete that request.");
  if (!data) throw new Error("You do not have permission to do this.");
}

function daysBetween(date: string): number {
  const now = new Date();
  const then = new Date(date);
  const diff = then.getTime() - now.getTime();
  return Math.ceil(diff / 86_400_000);
}

function daysSince(date: string): number {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();
  return Math.ceil(diff / 86_400_000);
}

export const getAdminAttentionQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AttentionQueue> => {
    await assertAdmin(context.supabase, context.userId);

    const cutoffs = {
      stuck: new Date(Date.now() - THRESHOLDS.stuckDays * 86_400_000).toISOString(),
      dueSoon: new Date(Date.now() + THRESHOLDS.dueSoonDays * 86_400_000).toISOString(),
      insurance: new Date(Date.now() + THRESHOLDS.insuranceWarningDays * 86_400_000).toISOString(),
      invitations: new Date(Date.now() + THRESHOLDS.invitationExpiryDays * 86_400_000).toISOString(),
    };

    const [stuckRes, infoRes, insuranceRes, invitationsRes] = await Promise.all([
      context.supabase
        .from("contractor_applications")
        .select("id, business_name, contact_name, status, updated_at, user_id")
        .in("status", ["submitted", "under_review", "more_info_required"])
        .lte("updated_at", cutoffs.stuck)
        .order("updated_at", { ascending: true }),
      context.supabase
        .from("application_info_requests")
        .select("id, application_id, message, due_date, status, requested_at")
        .eq("status", "open")
        .lte("due_date", cutoffs.dueSoon)
        .order("due_date", { ascending: true }),
      context.supabase
        .from("contractor_applications")
        .select("id, business_name, contact_name, insurance_expiry_date, user_id")
        .eq("status", "approved")
        .not("insurance_expiry_date", "is", null)
        .lte("insurance_expiry_date", cutoffs.insurance)
        .order("insurance_expiry_date", { ascending: true }),
      context.supabase
        .from("contractor_invitations")
        .select("id, email, created_at, expires_at")
        .is("accepted_at", null)
        .is("revoked_at", null)
        .lte("expires_at", cutoffs.invitations)
        .order("expires_at", { ascending: true }),
    ]);

    if (stuckRes.error) throw new Error("Could not load stuck applications.");
    if (infoRes.error) throw new Error("Could not load information requests.");
    if (insuranceRes.error) throw new Error("Could not load insurance reminders.");
    if (invitationsRes.error) throw new Error("Could not load pending invitations.");

    const stuck = (stuckRes.data ?? []) as any[];
    const infoRequests = (infoRes.data ?? []) as any[];
    const insurance = (insuranceRes.data ?? []) as any[];
    const invitations = (invitationsRes.data ?? []) as any[];

    // Resolve business names for info requests in a single follow-up query.
    const applicationIds = Array.from(new Set(infoRequests.map((r) => r.application_id)));
    let infoAppMap: Map<string, { business_name: string | null; contact_name: string | null; user_id: string }> =
      new Map();
    if (applicationIds.length > 0) {
      const { data: appRows, error: appErr } = await context.supabase
        .from("contractor_applications")
        .select("id, business_name, contact_name, user_id")
        .in("id", applicationIds);
      if (!appErr) {
        for (const a of (appRows ?? []) as any[]) {
          infoAppMap.set(a.id, a);
        }
      }
    }

    const items: AttentionItem[] = [];

    for (const a of stuck) {
      const days = daysSince(a.updated_at);
      items.push({
        id: `stuck:${a.id}`,
        type: "stuck_application",
        title: "Application stuck",
        businessName: a.business_name || a.contact_name || "Unnamed application",
        summary: `${STATUS_LABEL[a.status as keyof typeof STATUS_LABEL] ?? a.status} — no update for ${days} day${days === 1 ? "" : "s"}`,
        days,
        urgency: days > 14 ? 1 : days > 10 ? 2 : 3,
        actionUrl: `/admin/applications/${a.id}`,
        recipientId: a.user_id,
        meta: { status: a.status },
      });
    }

    for (const r of infoRequests) {
      const days = daysBetween(r.due_date);
      const app = infoAppMap.get(r.application_id);
      const isOverdue = days < 0;
      items.push({
        id: `info:${r.id}`,
        type: "info_request_due",
        title: "Information request due",
        businessName: app?.business_name || app?.contact_name || "Unnamed application",
        summary: isOverdue
          ? `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`
          : `Due in ${days} day${days === 1 ? "" : "s"}`,
        days,
        urgency: isOverdue ? 1 : days <= 2 ? 2 : 3,
        actionUrl: `/admin/applications/${r.application_id}?tab=messages`,
        recipientId: app?.user_id ?? null,
        meta: { dueDate: r.due_date, requestId: r.id },
      });
    }

    for (const a of insurance) {
      const days = daysBetween(a.insurance_expiry_date);
      const isExpired = days < 0;
      items.push({
        id: `insurance:${a.id}`,
        type: "insurance_expiring",
        title: "Insurance expiring",
        businessName: a.business_name || a.contact_name || "Unnamed application",
        summary: isExpired
          ? `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`
          : `Expires in ${days} day${days === 1 ? "" : "s"}`,
        days,
        urgency: isExpired ? 1 : days <= 7 ? 2 : 3,
        actionUrl: `/admin/applications/${a.id}?tab=documents`,
        recipientId: a.user_id,
        meta: { expiryDate: a.insurance_expiry_date },
      });
    }

    for (const i of invitations) {
      const days = daysBetween(i.expires_at);
      const isExpired = days < 0;
      items.push({
        id: `invite:${i.id}`,
        type: "invitation_pending",
        title: "Invitation expiring",
        businessName: i.email,
        summary: isExpired
          ? `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`
          : `Expires in ${days} day${days === 1 ? "" : "s"}`,
        days,
        urgency: isExpired ? 1 : days <= 3 ? 2 : 3,
        actionUrl: `/admin/invitations`,
        recipientId: null,
        meta: { email: i.email },
      });
    }

    // Sort by urgency (ascending), then by absolute deadline distance.
    items.sort((a, b) => a.urgency - b.urgency || Math.abs(a.days) - Math.abs(b.days));

    return {
      items,
      counts: {
        stuck: stuck.length,
        infoRequests: infoRequests.length,
        insurance: insurance.length,
        invitations: invitations.length,
        total: items.length,
      },
      thresholds: THRESHOLDS,
    };
  });

export const sendFollowUpReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        itemId: z.string(),
        type: z.enum(["stuck_application", "info_request_due", "insurance_expiring"]),
        applicationId: z.string().uuid(),
        recipientId: z.string().uuid().nullable(),
        message: z.string().min(1).max(500),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { type, applicationId, recipientId, message } = data;

    if (recipientId) {
      const dedupe = `ops-reminder-${applicationId}-${new Date().toISOString().slice(0, 10)}`;
      const { error: notifyErr } = await context.supabase.rpc("notify_user", {
        _recipient: recipientId,
        _application: applicationId,
        _audience: "contractor",
        _type: type === "insurance_expiring" ? "insurance" : "information_request",
        _title: "Reminder from Handy Help",
        _message: message,
        _action_url: "/dashboard",
        _dedupe: dedupe,
      });
      if (notifyErr) throw new Error("We could not send the notification.");
    }

    if (type === "info_request_due") {
      // Touch the request so it shows recent activity; status stays open.
      await context.supabase
        .from("application_info_requests")
        .update({ updated_at: new Date().toISOString() })
        .eq("application_id", applicationId)
        .eq("status", "open");
    } else {
      await context.supabase.from("application_status_history").insert({
        application_id: applicationId,
        status: type === "stuck_application" ? "submitted" : "approved",
        reason: `Admin reminder sent: ${message}`,
        changed_by: context.userId,
      });
    }

    return { ok: true };
  });

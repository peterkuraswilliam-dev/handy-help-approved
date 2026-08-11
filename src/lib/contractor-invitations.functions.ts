import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .email()
  .max(255)
  .transform((value) => value.toLowerCase());
const tokenSchema = z.string().regex(/^[a-f0-9]{64}$/i);
const passwordSchema = z.string().min(8).max(72);

async function assertAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error("We could not complete that request.");
  if (!data) throw new Error("You do not have permission to do this.");
}

export const listContractorInvitations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("contractor_invitations")
      .select("id,email,created_at,expires_at,revoked_at,revoked_by,accepted_at,accepted_by")
      .order("created_at", { ascending: false });
    if (error) throw new Error("We could not load contractor invitations.");
    return data ?? [];
  });

export const createContractorInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ email: emailSchema }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: rows, error } = await context.supabase.rpc("create_contractor_invitation", {
      _email: data.email,
    });
    if (error) {
      if (error.message.includes("pending invitation limit reached")) {
        throw new Error("You already have 20 pending invitations.");
      }
      if (error.message.includes("active invitation already exists")) {
        throw new Error("An active invitation already exists for that email address.");
      }
      throw new Error("We could not create that invitation.");
    }
    const invitation = rows?.[0];
    if (!invitation) throw new Error("We could not create that invitation.");
    return invitation;
  });

export const revokeContractorInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ invitationId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.rpc("revoke_contractor_invitation", {
      _invitation_id: data.invitationId,
    });
    if (error) throw new Error("That invitation could not be revoked.");
    return { ok: true };
  });

export const createInvitedContractorAccount = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        token: tokenSchema,
        email: emailSchema,
        password: passwordSchema,
        fullName: z.string().trim().min(1).max(100),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const reservationId = crypto.randomUUID();
    const { data: invitationId, error: reserveError } = await supabaseAdmin.rpc(
      "reserve_contractor_invitation",
      {
        _token: data.token,
        _email: data.email,
        _reservation_id: reservationId,
      },
    );
    if (reserveError || !invitationId) {
      throw new Error(
        "This invitation is invalid, expired, already used or does not match that email address.",
      );
    }

    let userId: string | undefined;
    try {
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        app_metadata: {
          contractor_invitation_id: invitationId,
          contractor_invitation_reservation_id: reservationId,
        },
        user_metadata: { full_name: data.fullName },
      });
      if (createError || !created.user) {
        throw new Error(
          createError?.message.toLowerCase().includes("already")
            ? "An account already exists for this email. Sign in and accept the invitation instead."
            : "We could not create your account.",
        );
      }
      userId = created.user.id;

      const { error: completeError } = await supabaseAdmin.rpc("complete_contractor_invitation", {
        _invitation_id: invitationId,
        _reservation_id: reservationId,
        _user_id: userId,
      });
      if (completeError) throw new Error("We could not finish accepting your invitation.");
      return { ok: true };
    } catch (error) {
      if (userId) await supabaseAdmin.auth.admin.deleteUser(userId);
      await supabaseAdmin.rpc("release_contractor_invitation", {
        _invitation_id: invitationId,
        _reservation_id: reservationId,
      });
      throw error;
    }
  });

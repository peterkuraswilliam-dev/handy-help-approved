import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { createInvitedContractorAccount } from "@/lib/contractor-invitations.functions";

export const Route = createFileRoute("/invite/$token")({
  head: () => ({
    meta: [
      { title: "Accept contractor invitation — Handy Help Aberdeenshire" },
      { name: "robots", content: "noindex,nofollow,noarchive" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: AcceptInvitation,
});

const emailSchema = z.string().email("Enter the email address that was invited.").max(255);
const passwordSchema = z.string().min(8, "Use at least 8 characters.").max(72);

function AcceptInvitation() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const createAccount = useServerFn(createInvitedContractorAccount);
  const [existingEmail, setExistingEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setExistingEmail(data.user?.email ?? null);
      setAuthChecked(true);
    });
  }, []);

  async function acceptExisting() {
    setLoading(true);
    try {
      const { error } = await supabase.rpc("accept_contractor_invitation", { _token: token });
      if (error) throw error;
      toast.success("Invitation accepted. You can now begin your application.");
      void navigate({ to: "/application" });
    } catch {
      toast.error(
        "This invitation is invalid, expired, already used or belongs to another email address.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) return toast.error(emailResult.error.issues[0].message);
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) return toast.error(passwordResult.error.issues[0].message);
    setLoading(true);
    try {
      await createAccount({ data: { token, email, password, fullName } });
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Account created. You can now begin your application.");
      void navigate({ to: "/application" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We could not accept this invitation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="card-panel space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Accept contractor invitation</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This invitation is single-use and works only with the email address your Handy Help
            admin invited.
          </p>
        </div>

        {!authChecked ? (
          <p className="text-sm text-muted-foreground">Checking your account…</p>
        ) : existingEmail ? (
          <div className="space-y-3">
            <p className="text-sm">
              Signed in as <strong>{existingEmail}</strong>.
            </p>
            <button
              type="button"
              className="btn-gold w-full"
              disabled={loading}
              onClick={acceptExisting}
            >
              {loading ? "Accepting…" : "Accept invitation"}
            </button>
            <p className="text-xs text-muted-foreground">
              If this is not the invited email, sign out and use the correct account.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label htmlFor="invite-name">Contact name</label>
              <input
                id="invite-name"
                autoComplete="name"
                required
                maxLength={100}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="invite-email">Invited email</label>
              <input
                id="invite-email"
                type="email"
                autoComplete="email"
                required
                maxLength={255}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="invite-password">Create password</label>
              <input
                id="invite-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <button className="btn-gold w-full" disabled={loading}>
              {loading ? "Creating account…" : "Create account and accept"}
            </button>
          </form>
        )}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/auth" search={{ mode: "signin" }} className="underline">
          Sign in
        </Link>
        , then reopen this invitation link.
      </p>
    </div>
  );
}

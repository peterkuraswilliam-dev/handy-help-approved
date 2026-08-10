import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { friendlyMessage } from "@/lib/errors";
import { SITE_NAME } from "@/lib/site-config";
import { StatusPage } from "@/components/StatusPage";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: `Reset your password — ${SITE_NAME}` },
      { name: "description", content: `Choose a new password for your ${SITE_NAME} contractor account.` },
      { property: "og:title", content: `Reset your password — ${SITE_NAME}` },
      { property: "og:description", content: "Set a new password for your contractor account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

const passwordSchema = z.string().min(8, "At least 8 characters").max(72);

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
  }, []);

  if (ready === null) {
    return <div className="mx-auto h-32 max-w-md animate-pulse rounded-lg bg-white/5" />;
  }

  if (!ready) {
    return (
      <StatusPage
        title="This reset link has expired"
        message="Password reset links can only be used once and expire after a short time. Please request a new one from the sign-in page."
      />
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const ok = passwordSchema.safeParse(password);
    if (!ok.success) return toast.error(ok.error.issues[0].message);
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. You're signed in.");
      void navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(friendlyMessage(err, "We could not update your password."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card-panel">
        <h1 className="text-xl font-semibold">Choose a new password</h1>
        <form onSubmit={save} className="mt-4 space-y-3">
          <div>
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              aria-describedby="new-password-hint"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p id="new-password-hint" className="mt-1 text-xs text-muted-foreground">
              At least 8 characters.
            </p>
          </div>
          <button type="submit" className="btn-gold w-full" disabled={loading}>
            {loading ? "Saving…" : "Save new password"}
          </button>
        </form>
      </div>
    </div>
  );
}

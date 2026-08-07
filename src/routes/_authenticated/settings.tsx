import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Handy Help Aberdeenshire" },
      { name: "description", content: "Manage your Handy Help Aberdeenshire account settings and sign out of your account." },
      { property: "og:title", content: "Settings — Handy Help Aberdeenshire" },
      { property: "og:description", content: "Manage your Handy Help Aberdeenshire account settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      setEmail(user?.email ?? null);
      if (user) {
        const { data: role } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
        setIsAdmin(!!role);
      }
    });
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl text-[color:var(--color-gold)]">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account.</p>
      </header>

      <section className="rounded-lg border border-border/60 p-4 space-y-2">
        <h2 className="font-semibold">Account</h2>
        <p className="text-sm text-muted-foreground">Signed in as</p>
        <p className="text-sm break-all">{email ?? "Not provided"}</p>
      </section>

      {isAdmin && (
        <section className="rounded-lg border border-border/60 p-4 space-y-3">
          <h2 className="font-semibold">Admin</h2>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin" className="btn-outline">Applications dashboard</Link>
            <Link to="/admin/roles" className="btn-outline">Role management</Link>
          </div>
        </section>
      )}

      <section className="rounded-lg border border-border/60 p-4 space-y-3">
        <h2 className="font-semibold">Session</h2>
        <button
          className="btn-gold"
          onClick={async () => {
            await queryClient.cancelQueries();
            queryClient.clear();
            await supabase.auth.signOut();
            void navigate({ to: "/", replace: true });
          }}
        >
          Sign out
        </button>
      </section>
    </div>
  );
}

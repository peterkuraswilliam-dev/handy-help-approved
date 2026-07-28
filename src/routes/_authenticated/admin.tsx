import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Handy Help Aberdeenshire" },
      { name: "description", content: "Admin dashboard for reviewing contractor applications." },
    ],
  }),
  beforeLoad: async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) throw redirect({ to: "/auth" });
    const { data, error } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
    if (error || !data) throw redirect({ to: "/dashboard" });
  },
  component: Admin,
});

function Admin() {
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <Link to="/" className="btn-ghost -ml-2">
          <ArrowLeft className="h-4 w-4" /> Back to main app
        </Link>
      </div>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Contractor Applications</h1>
        <p className="text-muted-foreground">
          Review and manage contractor applications for Handy Help Aberdeenshire.
        </p>
      </header>

      <div className="rounded-md border border-[color:var(--color-gold)]/40 bg-[color:var(--color-gold)]/10 px-4 py-3 text-sm font-medium">
        Free while the Handy Help Aberdeenshire application is being developed.
      </div>

      <section className="card-panel text-center py-12">
        <h2 className="text-lg font-semibold text-[color:var(--color-gold)]">
          Application queue coming next
        </h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          Contractor applications will appear here once the application queue is connected.
        </p>
      </section>
    </div>
  );
}

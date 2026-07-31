import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute(
  "/_authenticated/admin/applications/$applicationId",
)({
  head: () => ({
    meta: [{ title: "Contractor Application — Handy Help Aberdeenshire" }],
  }),
  beforeLoad: async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) throw redirect({ to: "/auth", search: { mode: "signin" } });

    const { data, error } = await supabase.rpc("has_role", {
      _user_id: uid,
      _role: "admin",
    });
    if (error || !data) throw redirect({ to: "/dashboard" });
  },
  component: ApplicationDetail,
});

function ApplicationDetail() {
  const { applicationId } = Route.useParams();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/admin" className="btn-ghost -ml-2 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Applications
      </Link>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Contractor Application</h1>
        <p className="break-all text-sm text-muted-foreground">
          Application ID: <span className="font-mono">{applicationId}</span>
        </p>
      </header>
    </div>
  );
}

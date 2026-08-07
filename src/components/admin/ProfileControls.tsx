import { useCallback, useEffect, useState } from "react";
import { friendlyMessage } from "@/lib/errors";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Eye, EyeOff, ExternalLink, Mail, Phone, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";

type Profile = {
  id: string;
  slug: string;
  status: string;
  approval_date: string | null;
  phone_public: boolean;
  email_public: boolean;
};

export function ProfileControls({ applicationId }: { applicationId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await db
      .from("contractor_profiles")
      .select("id,slug,status,approval_date,phone_public,email_public")
      .eq("application_id", applicationId)
      .maybeSingle();
    setProfile((data as Profile | null) ?? null);
    setLoading(false);
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <div className="card-panel h-28 animate-pulse" />;

  if (!profile) {
    return (
      <section className="card-panel text-sm text-muted-foreground">
        No public profile exists yet. A profile is created automatically when this application is approved.
      </section>
    );
  }

  const setStatus = async (status: "active" | "hidden" | "suspended") => {
    setBusy(true);
    const { error } = await db.from("contractor_profiles").update({ status }).eq("id", profile.id);
    if (error) toast.error(friendlyMessage(error));
    else {
      toast.success(
        status === "active" ? "Public profile reactivated" : status === "hidden" ? "Public profile hidden" : "Public profile suspended",
      );
      await load();
    }
    setBusy(false);
  };

  const label = profile.status === "active" ? "Active" : profile.status === "hidden" ? "Hidden" : "Suspended";

  return (
    <section className="card-panel space-y-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold">Public profile</h2>
          <p className="truncate text-xs text-muted-foreground">/contractors/{profile.slug}</p>
        </div>
        <span className={profile.status === "active" ? "badge-approved shrink-0" : "badge-status shrink-0"}>
          {label}
        </span>
      </div>

      <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
        <p className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          Approved: {profile.approval_date ? new Date(profile.approval_date).toLocaleDateString() : "—"}
        </p>
        <p className="flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5" /> Phone public: {profile.phone_public ? "Yes" : "No"}
        </p>
        <p className="flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5" /> Email public: {profile.email_public ? "Yes" : "No"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          to="/contractors/$contractorSlug"
          params={{ contractorSlug: profile.slug }}
          className="btn-outline"
          target="_blank"
        >
          <ExternalLink className="h-4 w-4" /> Preview public profile
        </Link>
        {profile.status === "active" ? (
          <>
            <button type="button" className="btn-ghost" disabled={busy} onClick={() => void setStatus("hidden")}>
              <EyeOff className="h-4 w-4" /> Hide profile
            </button>
            <button type="button" className="btn-ghost" disabled={busy} onClick={() => void setStatus("suspended")}>
              <ShieldCheck className="h-4 w-4" /> Suspend profile
            </button>
          </>
        ) : (
          <button type="button" className="btn-gold" disabled={busy} onClick={() => void setStatus("active")}>
            <Eye className="h-4 w-4" /> Reactivate profile
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Hidden and suspended profiles are not publicly accessible. Profile history and application records are kept.
      </p>
    </section>
  );
}

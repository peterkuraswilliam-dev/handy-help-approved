import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { CheckCircle2, ArrowLeft, Globe, Facebook, MapPin } from "lucide-react";

export const Route = createFileRoute("/contractors/$id")({
  head: () => ({
    meta: [
      { title: "Approved Contractor — Handy Help Aberdeenshire" },
      { name: "description", content: "View this Approved Contractor's public profile on Handy Help Aberdeenshire." },
      { property: "og:title", content: "Approved Contractor — Handy Help Aberdeenshire" },
      { property: "og:description", content: "Approved Contractor profile on Handy Help Aberdeenshire." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Profile,
});

type App = {
  id: string;
  business_name: string | null;
  main_area: string | null;
  description: string | null;
  website: string | null;
  facebook: string | null;
  approved_at: string | null;
  status: string;
};

function Profile() {
  const { id } = Route.useParams();
  const [app, setApp] = useState<App | null>(null);
  const [services, setServices] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await db
        .from("contractor_applications")
        .select("id,business_name,main_area,description,website,facebook,approved_at,status")
        .eq("id", id)
        .eq("status", "approved")
        .maybeSingle();
      if (!data) { setMissing(true); setLoading(false); return; }
      setApp(data as App);
      const [{ data: s }, { data: a }] = await Promise.all([
        db.from("contractor_services").select("service").eq("application_id", id),
        db.from("contractor_areas").select("area").eq("application_id", id),
      ]);
      setServices(((s as { service: string }[]) ?? []).map((r) => r.service));
      setAreas(((a as { area: string }[]) ?? []).map((r) => r.area));
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <p className="text-muted-foreground">Loading…</p>;
  if (missing || !app) {
    return (
      <div className="max-w-md mx-auto card-panel text-center">
        <h1 className="text-xl font-semibold">Profile unavailable</h1>
        <p className="text-sm text-muted-foreground mt-1">This contractor profile isn't publicly available.</p>
        <Link to="/contractors" className="btn-outline mt-4">Browse contractors</Link>
      </div>
    );
  }

  const website = normalizeUrl(app.website);
  const facebook = normalizeUrl(app.facebook);

  return (
    <article className="max-w-3xl mx-auto space-y-5">
      <Link to="/contractors" className="btn-ghost -ml-2 w-fit"><ArrowLeft className="h-4 w-4" /> All contractors</Link>

      <header className="card-panel space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">{app.business_name ?? "Approved contractor"}</h1>
            {app.main_area && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3.5 w-3.5" /> {app.main_area}
              </p>
            )}
          </div>
          <span className="badge-approved"><CheckCircle2 className="h-4 w-4" /> Approved Contractor</span>
        </div>
        {app.approved_at && (
          <p className="text-xs text-muted-foreground">Approved {new Date(app.approved_at).toLocaleDateString()}</p>
        )}
      </header>

      {app.description && (
        <section className="card-panel">
          <h2 className="font-semibold mb-2">About</h2>
          <p className="text-sm whitespace-pre-line text-muted-foreground">{app.description}</p>
        </section>
      )}

      {(services.length > 0 || areas.length > 0) && (
        <section className="grid sm:grid-cols-2 gap-3">
          {services.length > 0 && (
            <div className="card-panel">
              <h2 className="font-semibold mb-2">Services</h2>
              <ul className="flex flex-wrap gap-1.5">
                {services.map((s) => <li key={s} className="badge-status">{s}</li>)}
              </ul>
            </div>
          )}
          {areas.length > 0 && (
            <div className="card-panel">
              <h2 className="font-semibold mb-2">Areas covered</h2>
              <ul className="flex flex-wrap gap-1.5">
                {areas.map((a) => <li key={a} className="badge-status">{a}</li>)}
              </ul>
            </div>
          )}
        </section>
      )}

      {(website || facebook) && (
        <section className="card-panel">
          <h2 className="font-semibold mb-2">Links</h2>
          <div className="flex flex-wrap gap-2">
            {website && (
              <a href={website} target="_blank" rel="noopener noreferrer nofollow" className="btn-outline">
                <Globe className="h-4 w-4" /> Website
              </a>
            )}
            {facebook && (
              <a href={facebook} target="_blank" rel="noopener noreferrer nofollow" className="btn-outline">
                <Facebook className="h-4 w-4" /> Facebook
              </a>
            )}
          </div>
        </section>
      )}

      <p className="text-xs text-muted-foreground border-t border-border pt-3">
        The Approved Contractor badge means this business has supplied the requested information and
        agreed to follow our community standards. Customers should still carry out their own checks —
        including insurance and references — before agreeing to any work.
      </p>
    </article>
  );
}

function normalizeUrl(u: string | null): string | null {
  if (!u) return null;
  const trimmed = u.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

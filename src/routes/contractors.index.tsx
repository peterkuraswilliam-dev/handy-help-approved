import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listPublicProfiles } from "@/lib/public-profile.functions";
import { ContractorFallbackCover } from "@/components/ContractorFallbackCover";
import { ArrowRight, CheckCircle2, MapPin, Search, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/contractors/")({
  head: () => ({
    meta: [
      { title: "Approved Contractors — Handy Help Aberdeenshire" },
      { name: "description", content: "Browse Approved Contractors across Aberdeenshire — vetted local trades with the Handy Help Approved badge." },
      { property: "og:title", content: "Approved Contractors — Handy Help Aberdeenshire" },
      { property: "og:description", content: "Browse local Approved Contractors across Aberdeenshire." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Directory,
});

type Row = {
  slug: string;
  businessName: string | null;
  mainArea: string | null;
  description: string | null;
  approvalDate: string | null;
  services: string[];
  areas: string[];
  logoUrl: string | null;
  coverUrl: string | null;
};

function initials(name: string | null) {
  if (!name) return "HH";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function Directory() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    void (async () => {
      const data = await listPublicProfiles();
      setRows((data as Row[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    const hay = `${r.businessName ?? ""} ${r.mainArea ?? ""} ${r.description ?? ""} ${r.services.join(" ")} ${(r.areas ?? []).join(" ")}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <div className="profile-cinematic max-w-5xl mx-auto space-y-6">
      <header className="directory-hero relative overflow-hidden rounded-2xl px-5 py-8 sm:px-8 sm:py-12">
        <span className="cinematic-admin-orb cinematic-admin-orb-one" aria-hidden />
        <span className="cinematic-admin-orb cinematic-admin-orb-two" aria-hidden />
        <div className="relative">
          <span className="profile-chip">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Vetted local trades
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">Approved Contractors</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Local trades who have completed our review and agreed to our community standards across
            Aberdeenshire.
          </p>

          <div className="relative mt-5 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, area or service…"
              className="w-full rounded-full border border-border bg-secondary/50 py-2.5 pl-9 pr-3 text-sm outline-none backdrop-blur focus:border-[color:var(--color-gold)]"
            />
          </div>
        </div>
      </header>

      {loading ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="directory-card h-56 animate-pulse" />
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <div className="profile-card text-center text-sm text-muted-foreground">
          {rows.length === 0 ? "No approved contractors yet — check back soon." : "No matches for that search."}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {filtered.map((r) => (
            <li key={r.slug}>
              <Link
                to="/contractors/$contractorSlug"
                params={{ contractorSlug: r.slug }}
                className="directory-card group block h-full overflow-hidden"
              >
                <div className="directory-cover relative">
                  {r.coverUrl ? (
                    <img
                      src={r.coverUrl}
                      alt={`Work by ${r.businessName ?? "approved contractor"}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <ContractorFallbackCover name={r.businessName} />
                  )}
                  <span className="directory-cover-veil absolute inset-0" aria-hidden />
                  <span className="badge-approved absolute right-3 top-3">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                  </span>
                </div>

                <div className="relative -mt-8 flex items-end gap-3 px-4">
                  <div className="directory-logo">
                    {r.logoUrl ? (
                      <img src={r.logoUrl} alt={`${r.businessName ?? "Contractor"} logo`} loading="lazy" className="h-full w-full object-contain p-1.5" />
                    ) : (
                      <ContractorFallbackCover name={r.businessName} size="logo" />
                    )}
                  </div>
                </div>

                <div className="space-y-2 px-4 pb-4 pt-3">
                  <h2 className="text-base font-semibold leading-tight">{r.businessName ?? "Approved contractor"}</h2>
                  {r.mainArea && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /> {r.mainArea}
                    </p>
                  )}
                  {r.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
                  )}
                  {r.services.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {r.services.slice(0, 3).map((s) => (
                        <span key={s} className="directory-tag">{s}</span>
                      ))}
                      {r.services.length > 3 && (
                        <span className="directory-tag">+{r.services.length - 3}</span>
                      )}
                    </div>
                  )}
                  <span className="inline-flex items-center gap-1 pt-1 text-xs font-semibold text-[color:var(--color-gold)]">
                    View profile
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="profile-disclaimer rounded-xl px-4 py-3 text-xs text-muted-foreground">
        Approval confirms that the contractor has supplied the requested information and agreed to
        follow our community standards. Customers should still carry out their own checks before
        agreeing to any work.
      </p>
    </div>
  );
}

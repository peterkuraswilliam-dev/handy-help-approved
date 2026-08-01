import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listPublicProfiles } from "@/lib/public-profile.functions";
import { CheckCircle2, Search } from "lucide-react";

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
};

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
    const hay = `${r.businessName ?? ""} ${r.mainArea ?? ""} ${r.description ?? ""} ${r.services.join(" ")}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-3xl font-bold">Approved Contractors</h1>
        <p className="text-sm text-muted-foreground">
          Local trades who have completed our review and agreed to our community standards.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, area or service…"
          className="w-full pl-9 pr-3 py-2 rounded-md bg-secondary/40 border border-border text-sm outline-none focus:border-[color:var(--color-gold)]"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="card-panel text-center text-sm text-muted-foreground">
          {rows.length === 0 ? "No approved contractors yet — check back soon." : "No matches for that search."}
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-3">
          {filtered.map((r) => (
            <li key={r.slug}>
              <Link
                to="/contractors/$contractorSlug"
                params={{ contractorSlug: r.slug }}
                className="card-panel block hover:border-[color:var(--color-gold)] transition-colors h-full"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold">{r.businessName ?? "Approved contractor"}</h2>
                  <span className="badge-approved shrink-0"><CheckCircle2 className="h-3.5 w-3.5" /> Approved</span>
                </div>
                {r.mainArea && <p className="text-xs text-muted-foreground mt-1">{r.mainArea}</p>}
                {r.description && <p className="text-sm mt-2 line-clamp-3 text-muted-foreground">{r.description}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground border-t border-border pt-3">
        Approval confirms that the contractor has supplied the requested information and agreed to
        follow our community standards. Customers should still carry out their own checks before
        agreeing to any work.
      </p>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/community-rules")({
  head: () => ({
    meta: [
      { title: "Community Rules — Handy Help Aberdeenshire" },
      { name: "description", content: "Standards that Approved Contractors on Handy Help Aberdeenshire agree to follow." },
      { property: "og:title", content: "Community Rules" },
      { property: "og:description", content: "The standards Approved Contractors agree to follow." },
    ],
  }),
  component: Rules,
});

const RULES: [string, string][] = [
  ["Be honest", "Only supply information you can back up. Never misrepresent qualifications or insurance."],
  ["Treat customers fairly", "Communicate clearly, arrive when you say you will, and respect people's homes."],
  ["Quote transparently", "Explain costs before you start. If the job changes, agree the change in writing."],
  ["Keep insurance current", "Maintain valid public liability insurance while listed as an Approved Contractor."],
  ["Work safely and legally", "Follow relevant regulations for your trade, including gas, electrical and building rules."],
  ["Handle complaints properly", "Respond to concerns promptly and try to put things right."],
  ["Respect the community", "No discrimination, harassment or abusive behaviour towards customers or other contractors."],
];

function Rules() {
  return (
    <div className="shell-prose space-y-4">
      <h1 className="text-3xl font-bold">Community Rules</h1>
      <p className="text-muted-foreground text-sm">
        All Approved Contractors agree to follow these standards. Breaches may lead to suspension.
      </p>
      <ol className="space-y-3">
        {RULES.map(([t, d], i) => (
          <li key={i} className="card-panel">
            <div className="flex items-start gap-3">
              <span className="h-7 w-7 shrink-0 rounded-full bg-[color:var(--color-gold)] text-[color:var(--color-primary-foreground)] grid place-items-center font-bold text-sm">{i + 1}</span>
              <div>
                <h2 className="font-semibold">{t}</h2>
                <p className="text-sm text-muted-foreground mt-1">{d}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

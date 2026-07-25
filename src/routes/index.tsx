import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ShieldCheck, Users, Sparkles, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Handy Help Aberdeenshire — Become an Approved Contractor" },
      { name: "description", content: "Join our growing network of local contractors and connect with customers across Aberdeenshire." },
      { property: "og:title", content: "Become an Approved Contractor — Handy Help Aberdeenshire" },
      { property: "og:description", content: "Apply now to join the Handy Help Aberdeenshire contractor network." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="space-y-14">
      <section className="pt-6 sm:pt-10 text-center">
        <span className="badge-status mb-4">Now accepting contractor applications</span>
        <h1 className="text-3xl sm:text-5xl font-bold leading-tight">
          Become an <span className="text-[color:var(--color-gold)]">Approved Contractor</span>
          <br /> with Handy Help Aberdeenshire
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
          Join our growing network of local contractors and prepare to connect with customers across Aberdeenshire.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/become-approved" className="btn-gold">Apply Now</Link>
          <Link to="/auth" className="btn-outline">Contractor Sign In</Link>
        </div>
      </section>

      <Section title="How approval works" icon={<ClipboardList className="h-5 w-5" />}>
        <ol className="grid sm:grid-cols-2 gap-3 text-sm">
          {[
            "Create a contractor account",
            "Complete the application",
            "Upload supporting information",
            "Submit for review",
            "Our admin team reviews your application",
            "Approved contractors receive an Approved Contractor badge",
          ].map((s, i) => (
            <li key={i} className="card-panel flex gap-3">
              <span className="h-7 w-7 shrink-0 rounded-full bg-[color:var(--color-gold)] text-[color:var(--color-primary-foreground)] grid place-items-center font-bold text-sm">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Information you'll need" icon={<ShieldCheck className="h-5 w-5" />}>
        <ul className="grid sm:grid-cols-2 gap-2 text-sm">
          {["Business or trading name","Contact details","Areas covered","Services offered","Business logo","Photos of previous work","Public liability insurance evidence","Qualifications or certifications","Customer references or reviews"].map((f) => (
            <li key={f} className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-[color:var(--color-gold)] mt-0.5" /> {f}</li>
          ))}
        </ul>
      </Section>

      <Section title="Benefits of joining early" icon={<Sparkles className="h-5 w-5" />}>
        <ul className="grid sm:grid-cols-2 gap-2 text-sm">
          {["Free launch period — no fees","Founding-contractor status","Early access to new features","Approved Contractor badge on your profile","Priority visibility as customers arrive"].map((b) => (
            <li key={b} className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-[color:var(--color-gold)] mt-0.5" /> {b}</li>
          ))}
        </ul>
      </Section>

      <Section title="Community standards" icon={<Users className="h-5 w-5" />}>
        <p className="text-sm text-muted-foreground">
          Approved contractors agree to treat customers fairly, provide accurate information, honour quoted work, and follow our{" "}
          <Link to="/community-rules" className="text-[color:var(--color-gold)] underline underline-offset-2">community rules</Link>.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-3">
        <span className="text-[color:var(--color-gold)]">{icon}</span> {title}
      </h2>
      {children}
    </section>
  );
}

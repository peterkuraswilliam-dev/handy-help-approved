import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Information — Handy Help Aberdeenshire" },
      {
        name: "description",
        content:
          "How Handy Help Aberdeenshire collects, uses and protects contractor information during the approval process.",
      },
      { property: "og:title", content: "Privacy Information — Handy Help Aberdeenshire" },
      { property: "og:description", content: "How we handle contractor information and documents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacy,
});

const SECTIONS: [string, string[]][] = [
  [
    "What we collect",
    [
      "Your account email and contact name.",
      "Business details you enter in your application, such as trading name, phone number, areas covered and services offered.",
      "Documents and images you upload, such as your logo, insurance evidence, qualifications and photos of previous work.",
    ],
  ],
  [
    "How we use it",
    [
      "To review your application and decide whether you meet our community standards.",
      "To contact you about your application, including requests for more information and the outcome.",
      "To build your public Approved Contractor profile once your application is approved.",
    ],
  ],
  [
    "What is public",
    [
      "Only the details shown on your Approved Contractor profile are public, and only after approval.",
      "You choose which work photos appear publicly.",
      "Uploaded documents such as insurance and qualification evidence are never public. They are visible only to you and our review team.",
    ],
  ],
  [
    "Storage and security",
    [
      "Information is stored securely and access is restricted so contractors can only see their own records.",
      "Documents are served through short-lived private links rather than public URLs.",
    ],
  ],
  [
    "Your choices",
    [
      "You can update your application details and uploads at any time before a decision is made.",
      "You can ask us to remove your account and application data by contacting us.",
    ],
  ],
];

function Privacy() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-3xl font-bold">Privacy Information</h1>
      <p className="text-sm text-muted-foreground">
        Handy Help Aberdeenshire only collects the information needed to review contractor applications
        and to publish approved contractor profiles.
      </p>

      {SECTIONS.map(([title, points]) => (
        <section key={title} className="card-panel space-y-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground">
            {points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>
      ))}

      <section className="card-panel space-y-2">
        <h2 className="text-lg font-semibold">Approval disclaimer</h2>
        <p className="text-sm text-muted-foreground">
          Approval confirms that the contractor has supplied the requested information and agreed to
          follow our community standards. Customers should still carry out their own checks before
          agreeing to any work.
        </p>
        <p className="text-sm text-muted-foreground">
          You can read the standards contractors agree to in our{" "}
          <Link to="/community-rules" className="text-[color:var(--color-gold)] underline underline-offset-2">
            community rules
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

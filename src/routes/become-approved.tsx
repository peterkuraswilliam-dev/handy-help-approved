import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/become-approved")({
  head: () => ({
    meta: [
      { title: "Become an Approved Contractor — Handy Help Aberdeenshire" },
      { name: "description", content: "Everything you need to know about applying to become an Approved Contractor with Handy Help Aberdeenshire." },
      { property: "og:title", content: "Become an Approved Contractor" },
      { property: "og:description", content: "Apply now to join Handy Help Aberdeenshire's contractor network." },
    ],
  }),
  component: BecomeApproved,
});

function BecomeApproved() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Become an Approved Contractor</h1>
      <p className="text-muted-foreground">
        Apply once. Get reviewed by our team. Show customers you meet our community standards
        with the Approved Contractor badge on your public profile.
      </p>
      <div className="card-panel space-y-3">
        <h2 className="text-lg font-semibold">Ready to apply?</h2>
        <ol className="list-decimal ml-5 space-y-1 text-sm">
          <li>Create a contractor account.</li>
          <li>Fill in your business details.</li>
          <li>Upload your logo, insurance and qualification evidence.</li>
          <li>Submit for review — we'll email you when the outcome is ready.</li>
        </ol>
        <div className="flex gap-3 pt-2">
          <Link to="/auth" search={{ mode: "signup" as const }} className="btn-gold">Create account</Link>
          <Link to="/auth" className="btn-outline">Sign in</Link>
        </div>
      </div>
      <div className="card-panel">
        <h2 className="text-lg font-semibold mb-2">What we ask for</h2>
        <ul className="text-sm grid sm:grid-cols-2 gap-1 list-disc ml-5">
          <li>Business / trading name</li>
          <li>Contact name, email, phone</li>
          <li>Main operating area &amp; areas covered</li>
          <li>Services offered</li>
          <li>Short business description</li>
          <li>Website &amp; Facebook (optional)</li>
          <li>Business logo</li>
          <li>Photos of previous work</li>
          <li>Public liability insurance evidence</li>
          <li>Qualifications / certifications</li>
          <li>Customer references or review links</li>
          <li>Agreement to community rules</li>
        </ul>
      </div>
      <p className="text-xs text-muted-foreground">
        Approval confirms that the contractor has supplied the requested information and agreed to
        follow our community standards. Customers should still carry out their own checks before
        agreeing to any work.
      </p>
    </div>
  );
}

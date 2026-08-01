import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Facebook,
  Globe,
  Images,
  Info,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  X,
} from "lucide-react";
import { getPublicProfile, type PublicPhoto, type PublicProfile } from "@/lib/public-profile.functions";
import { ContractorFallbackCover } from "@/components/ContractorFallbackCover";

export const Route = createFileRoute("/contractors/$contractorSlug")({
  loader: async ({ params }) => getPublicProfile({ data: { slug: params.contractorSlug } }),
  head: ({ loaderData }) => {
    const name = loaderData?.businessName ?? "Approved Contractor";
    const title = `${name} — Approved Contractor | Handy Help Aberdeenshire`;
    const description =
      loaderData?.description?.slice(0, 155) ??
      "An Approved Contractor on Handy Help Aberdeenshire — local, checked and committed to our community standards.";
    if (!loaderData) {
      return {
        meta: [
          { title: "Profile unavailable — Handy Help Aberdeenshire" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ProfilePage,
});

const DISCLAIMER =
  "Approval confirms that the contractor has supplied the requested information and agreed to follow our community standards. Customers should still carry out their own checks before agreeing to any work.";

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function normalizeUrl(u: string | null): string | null {
  if (!u) return null;
  const t = u.trim();
  if (!t) return null;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

function ProfilePage() {
  const profile = Route.useLoaderData() as PublicProfile | null;

  if (!profile) {
    return (
      <div className="mx-auto max-w-md card-panel text-center">
        <h1 className="text-xl font-semibold">Profile unavailable</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This contractor profile isn't publicly available at the moment.
        </p>
        <Link to="/contractors" className="btn-outline mt-4">Browse approved contractors</Link>
      </div>
    );
  }

  const website = normalizeUrl(profile.website);
  const facebook = normalizeUrl(profile.facebook);
  const approved = formatDate(profile.approvalDate);
  const featured =
    profile.photos.find((p) => p.id === profile.featuredPhotoId) ?? profile.photos[0] ?? null;
  const insured = (profile.insuranceStatus ?? "").toLowerCase().includes("valid");
  const qualificationLines = (profile.qualifications ?? "")
    .split(/\r?\n|,(?![^()]*\))/)
    .map((q) => q.trim())
    .filter(Boolean);

  return (
    <div className="profile-cinematic mx-auto w-full max-w-5xl space-y-6 pb-4">
      <Link to="/contractors" className="btn-ghost -ml-2 w-fit">
        <ArrowLeft className="h-4 w-4" /> All approved contractors
      </Link>

      {/* Cinematic hero */}
      <header className="profile-hero relative overflow-hidden rounded-2xl border border-border">
        {featured?.url ? (
          <>
            <img
              src={featured.url}
              alt={`Featured work by ${profile.businessName ?? "this contractor"}`}
              className="absolute inset-0 h-full w-full object-cover opacity-40"
            />
            <div className="profile-hero-veil absolute inset-0" />
          </>
        ) : (
          <div className="absolute inset-0">
            <ContractorFallbackCover name={profile.businessName} size="hero" />
          </div>
        )}
        <div className="relative grid gap-6 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0 space-y-4">
            <div className="flex min-w-0 items-center gap-4">
              {profile.logoUrl ? (
                <img
                  src={profile.logoUrl}
                  alt={`${profile.businessName ?? "Contractor"} logo`}
                  className="h-16 w-16 shrink-0 rounded-full border border-white/15 bg-background/70 object-contain p-2 sm:h-20 sm:w-20"
                />
              ) : (
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-white/15 bg-background/70 sm:h-20 sm:w-20">
                  <ContractorFallbackCover name={profile.businessName} size="logo" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold sm:text-4xl">
                  {profile.businessName ?? "Approved contractor"}
                </h1>
                {profile.mainArea && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" /> {profile.mainArea}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="badge-approved text-sm">
                <CheckCircle2 className="h-4 w-4" /> Approved Contractor
              </span>
              {approved && <span className="text-xs text-muted-foreground">Approved on {approved}</span>}
            </div>

            {profile.description && (
              <p className="max-w-2xl text-sm leading-relaxed text-foreground/85 sm:text-base">
                {profile.description.length > 260
                  ? `${profile.description.slice(0, 260).trim()}…`
                  : profile.description}
              </p>
            )}

            {profile.services.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {profile.services.slice(0, 5).map((s) => (
                  <li key={s} className="profile-chip">{s}</li>
                ))}
                {profile.services.length > 5 && (
                  <li className="profile-chip">+{profile.services.length - 5} more</li>
                )}
              </ul>
            )}
          </div>
        </div>
      </header>

      {/* Trust summary */}
      <section className="profile-trust grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <TrustItem icon={ShieldCheck} label="Approved" value={approved ?? "Verified"} tone="success" />
        <TrustItem
          icon={ShieldCheck}
          label="Insurance"
          value={insured ? "Valid" : (profile.insuranceStatus ?? "Not stated")}
          tone={insured ? "success" : "neutral"}
        />
        <TrustItem
          icon={Award}
          label="Qualifications"
          value={qualificationLines.length > 0 ? `${qualificationLines.length} listed` : "Not listed"}
        />
        <TrustItem icon={MapPin} label="Main area" value={profile.mainArea ?? "Aberdeenshire"} />
        <TrustItem
          icon={Globe}
          label="Areas covered"
          value={profile.areas.length > 0 ? `${profile.areas.length} areas` : "Aberdeenshire"}
        />
        <TrustItem icon={Images} label="Public photos" value={`${profile.photos.length}`} />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* About */}
        <section className="profile-card space-y-4">
          <h2 className="text-lg font-semibold">
            About {profile.businessName ?? "this business"}
          </h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {profile.description ?? "This contractor hasn't added a description yet."}
          </p>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Main operating area</dt>
              <dd className="mt-0.5">{profile.mainArea ?? "Aberdeenshire"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Areas covered</dt>
              <dd className="mt-0.5">{profile.areas.length > 0 ? profile.areas.join(", ") : "Aberdeenshire"}</dd>
            </div>
          </dl>
          {(website || facebook) && (
            <div className="flex flex-wrap gap-2 pt-1">
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
          )}
        </section>

        {/* Services */}
        <section className="profile-card space-y-4">
          <h2 className="text-lg font-semibold">Services</h2>
          {profile.services.length === 0 ? (
            <p className="text-sm text-muted-foreground">No services listed yet.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {profile.services.map((s) => (
                <li key={s} className="profile-service">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[color:var(--color-gold)]" />
                  <span className="text-sm font-medium">{s}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <WorkGallery photos={profile.photos} featuredId={profile.featuredPhotoId} name={profile.businessName} />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Credentials */}
        <section className="profile-card space-y-4">
          <h2 className="text-lg font-semibold">Insurance &amp; qualifications</h2>
          <div className="flex items-start gap-3">
            {insured ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            ) : (
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-semibold">Public liability insurance</p>
              <p className="text-sm text-muted-foreground">
                {insured ? "Confirmed and valid at the time of approval." : (profile.insuranceStatus ?? "Not stated")}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">Qualifications &amp; certifications</p>
            {qualificationLines.length === 0 ? (
              <p className="text-sm text-muted-foreground">No qualifications listed.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {qualificationLines.map((q) => (
                  <li key={q} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Award className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-gold)]" />
                    {q}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Supporting documents are held privately by Handy Help Aberdeenshire and are never published.
          </p>
        </section>

        {/* Contact */}
        <section className="profile-card space-y-4">
          <h2 className="text-lg font-semibold">Contact</h2>
          {!profile.phone && !profile.email && !website && !facebook ? (
            <p className="text-sm text-muted-foreground">
              This contractor has chosen not to publish contact details.
            </p>
          ) : (
            <ul className="space-y-3 text-sm">
              {profile.phone && (
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-[color:var(--color-gold)]" />
                  <a href={`tel:${profile.phone.replace(/\s+/g, "")}`} className="hover:underline">{profile.phone}</a>
                </li>
              )}
              {profile.email && (
                <li className="flex min-w-0 items-center gap-3">
                  <Mail className="h-4 w-4 shrink-0 text-[color:var(--color-gold)]" />
                  <a href={`mailto:${profile.email}`} className="truncate hover:underline">{profile.email}</a>
                </li>
              )}
              {website && (
                <li className="flex min-w-0 items-center gap-3">
                  <Globe className="h-4 w-4 shrink-0 text-[color:var(--color-gold)]" />
                  <a href={website} target="_blank" rel="noopener noreferrer nofollow" className="truncate hover:underline">
                    {website.replace(/^https?:\/\//, "")}
                  </a>
                </li>
              )}
              {facebook && (
                <li className="flex min-w-0 items-center gap-3">
                  <Facebook className="h-4 w-4 shrink-0 text-[color:var(--color-gold)]" />
                  <a href={facebook} target="_blank" rel="noopener noreferrer nofollow" className="truncate hover:underline">
                    {facebook.replace(/^https?:\/\//, "")}
                  </a>
                </li>
              )}
            </ul>
          )}
        </section>
      </div>

      <aside className="profile-disclaimer flex items-start gap-3 rounded-xl p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--color-gold)]" />
        <div>
          <p className="text-sm font-semibold text-[color:var(--color-gold)]">Important disclaimer</p>
          <p className="mt-1 text-sm text-muted-foreground">{DISCLAIMER}</p>
        </div>
      </aside>
    </div>
  );
}

function TrustItem({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "neutral" | "success";
}) {
  return (
    <div className="profile-card flex flex-col items-center gap-1 px-3 py-4 text-center">
      <Icon className={`h-5 w-5 ${tone === "success" ? "text-emerald-400" : "text-[color:var(--color-gold)]"}`} />
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-xs text-muted-foreground">{value}</span>
    </div>
  );
}

export function WorkGallery({
  photos,
  featuredId,
  name,
}: {
  photos: PublicPhoto[];
  featuredId: string | null;
  name: string | null;
}) {
  const [index, setIndex] = useState<number | null>(null);

  const ordered = [...photos].sort((a, b) => {
    if (a.id === featuredId) return -1;
    if (b.id === featuredId) return 1;
    return 0;
  });

  const close = useCallback(() => setIndex(null), []);
  const prev = useCallback(
    () => setIndex((v) => ((v ?? 0) - 1 + ordered.length) % ordered.length),
    [ordered.length],
  );
  const next = useCallback(() => setIndex((v) => ((v ?? 0) + 1) % ordered.length), [ordered.length]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, close, prev, next]);

  return (
    <section className="profile-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Previous work</h2>
        {ordered.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {ordered.length} photo{ordered.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {ordered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <Images className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            This contractor hasn't published any work photos yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <button
            type="button"
            onClick={() => setIndex(0)}
            className="profile-photo group relative aspect-[4/3] w-full overflow-hidden rounded-xl"
            aria-label="Open featured work photo"
          >
            <img
              src={ordered[0]?.url ?? ""}
              alt={`Work by ${name ?? "this contractor"} 1`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <span className="absolute right-3 top-3 rounded-full bg-background/80 px-2 py-1 text-xs">
              1 / {ordered.length}
            </span>
          </button>
          <div className="grid grid-cols-3 gap-3 md:grid-cols-2">
            {ordered.slice(1, 7).map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setIndex(i + 1)}
                className="profile-photo aspect-square overflow-hidden rounded-xl"
                aria-label={`Open work photo ${i + 2}`}
              >
                <img
                  src={p.url ?? ""}
                  alt={`Work by ${name ?? "this contractor"} ${i + 2}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.05]"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {index !== null && ordered.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-background/97 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Work photo viewer"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {index + 1} of {ordered.length}
            </span>
            <button className="btn-ghost" onClick={close} aria-label="Close photo viewer">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center overflow-hidden">
            <img
              key={ordered[index]?.id}
              src={ordered[index]?.url ?? ""}
              alt={`Work photo ${index + 1}`}
              className="profile-viewer-image max-h-[75vh] w-auto max-w-full rounded-xl object-contain"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <button className="btn-outline" onClick={prev} disabled={ordered.length < 2}>
              <ChevronLeft className="h-5 w-5" /> Previous
            </button>
            <button className="btn-outline" onClick={next} disabled={ordered.length < 2}>
              Next <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

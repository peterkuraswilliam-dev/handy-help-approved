import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, ImageOff, RefreshCw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { STATUS_LABEL, getSignedUrl, type AppStatus } from "@/lib/application-helpers";

export const Route = createFileRoute(
  "/_authenticated/admin/applications/$applicationId",
)({
  head: () => ({
    meta: [
      { title: "Contractor Application — Handy Help Aberdeenshire" },
      {
        name: "description",
        content:
          "Read-only view of a contractor application submitted to Handy Help Aberdeenshire.",
      },
      { property: "og:title", content: "Contractor Application — Handy Help Aberdeenshire" },
      {
        property: "og:description",
        content: "Admin review of a Handy Help Aberdeenshire contractor application.",
      },
    ],
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

type ApplicationRow = {
  id: string;
  business_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  main_area: string | null;
  description: string | null;
  website: string | null;
  facebook: string | null;
  insurance_status: string | null;
  qualifications: string | null;
  references_text: string | null;
  agreed_rules: boolean | null;
  confirmed_accurate: boolean | null;
  status: AppStatus;
  updated_at: string;
  logo_path: string | null;
};

type GalleryImage = { id: string; url: string | null };

function MediaFallback({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center">
      <ImageOff className="h-5 w-5 text-muted-foreground" />
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function SafeImage({
  url,
  alt,
  className,
}: {
  url: string | null;
  alt: string;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  if (!url || broken) return <MediaFallback label="Image unavailable" />;
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setBroken(true)}
    />
  );
}

function PhotoViewer({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  images: GalleryImage[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Work photo preview"
    >
      <div className="flex w-full max-w-2xl flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {index + 1} of {images.length}
          </span>
          <button className="btn-ghost" onClick={onClose} aria-label="Close photo preview">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative flex min-h-[240px] items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5">
          <SafeImage
            url={images[index]?.url ?? null}
            alt={`Previous work photo ${index + 1}`}
            className="max-h-[65vh] w-full object-contain"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <button
            className="btn-ghost"
            onClick={onPrev}
            disabled={images.length < 2}
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-5 w-5" /> Previous
          </button>
          <button
            className="btn-ghost"
            onClick={onNext}
            disabled={images.length < 2}
            aria-label="Next photo"
          >
            Next <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <button className="btn-gold w-full justify-center" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}


const NOT_PROVIDED = "Not provided";

function BackLink() {
  return (
    <Link to="/admin" className="btn-ghost -ml-2 text-sm">
      <ArrowLeft className="h-4 w-4" /> Back to Applications
    </Link>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  const text = value && value.trim().length > 0 ? value : NOT_PROVIDED;
  const missing = text === NOT_PROVIDED;
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`break-words whitespace-pre-wrap ${missing ? "text-muted-foreground italic" : ""}`}>
        {text}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-panel space-y-3">
      <h2 className="font-semibold">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function ApplicationDetail() {
  const { applicationId } = Route.useParams();
  const [app, setApp] = useState<ApplicationRow | null>(null);
  const [services, setServices] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    setNotFound(false);
    try {
      const [appRes, svcRes, areaRes] = await Promise.all([
        db
          .from("contractor_applications")
          .select(
            "id,business_name,contact_name,email,phone,main_area,description,website,facebook,insurance_status,qualifications,references_text,agreed_rules,confirmed_accurate,status,updated_at",
          )
          .eq("id", applicationId)
          .maybeSingle(),
        db.from("contractor_services").select("service").eq("application_id", applicationId),
        db.from("contractor_areas").select("area").eq("application_id", applicationId),
      ]);

      if (appRes.error || svcRes.error || areaRes.error) {
        setFailed(true);
        return;
      }
      if (!appRes.data) {
        setNotFound(true);
        return;
      }
      setApp(appRes.data as ApplicationRow);
      setServices(((svcRes.data as { service: string }[]) ?? []).map((s) => s.service));
      setAreas(((areaRes.data as { area: string }[]) ?? []).map((a) => a.area));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <div className="h-5 w-40 animate-pulse rounded bg-white/10" />
        <div className="card-panel space-y-3">
          <div className="h-7 w-2/3 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-white/10" />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="card-panel space-y-3">
            <div className="h-5 w-1/3 animate-pulse rounded bg-white/10" />
            <div className="grid gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className="space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
                  <div className="h-4 w-full animate-pulse rounded bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (failed) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <BackLink />
        <div className="card-panel space-y-3">
          <h1 className="text-2xl font-bold">Application could not be loaded</h1>
          <p className="text-sm text-muted-foreground">Please try again.</p>
          <button className="btn-gold" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (notFound || !app) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <BackLink />
        <div className="card-panel space-y-3">
          <h1 className="text-2xl font-bold">Application not found</h1>
          <p className="text-sm text-muted-foreground">
            This contractor application could not be found.
          </p>
          <Link to="/admin" className="btn-gold inline-flex w-fit">
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  const heading = app.business_name?.trim() || app.contact_name?.trim() || "Contractor application";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <BackLink />

      <header className="card-panel space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-bold">{heading}</h1>
            <p className="text-sm text-muted-foreground">
              Contact: {app.contact_name?.trim() || NOT_PROVIDED}
            </p>
          </div>
          <span className="badge-status">{STATUS_LABEL[app.status]}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Last updated: {new Date(app.updated_at).toLocaleString()}
        </p>
        <p className="break-all text-xs text-muted-foreground">
          Application ID: <span className="font-mono">{app.id}</span>
        </p>
      </header>

      <Section title="Business Details">
        <Field label="Business or trading name" value={app.business_name} />
        <Field label="Main operating area" value={app.main_area} />
        <Field label="Website" value={app.website} />
        <Field label="Facebook page" value={app.facebook} />
        <div className="sm:col-span-2">
          <Field label="Short business description" value={app.description} />
        </div>
      </Section>

      <Section title="Contact Details">
        <Field label="Contact name" value={app.contact_name} />
        <Field label="Email address" value={app.email} />
        <Field label="Phone number" value={app.phone} />
      </Section>

      <Section title="Services and Coverage">
        <Field label="Services offered" value={services.join(", ")} />
        <Field label="Areas covered" value={areas.join(", ")} />
      </Section>

      <Section title="Insurance and Qualifications">
        <Field label="Public liability insurance status" value={app.insurance_status} />
        <div className="sm:col-span-2">
          <Field label="Qualifications or certifications" value={app.qualifications} />
        </div>
      </Section>

      <Section title="References and Agreements">
        <div className="sm:col-span-2">
          <Field label="Customer references or review links" value={app.references_text} />
        </div>
        <Field
          label="Community rules agreement"
          value={app.agreed_rules ? "Agreed" : "Not agreed"}
        />
        <Field
          label="Confirmation that all information is accurate"
          value={app.confirmed_accurate ? "Confirmed" : "Not confirmed"}
        />
      </Section>
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { friendlyMessage } from "@/lib/errors";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  Facebook,
  Globe,
  Images,
  Mail,
  Phone,
  Save,
  Star,
} from "lucide-react";
import { db } from "@/lib/db";

type Profile = {
  id: string;
  slug: string;
  status: string;
  business_name: string | null;
  main_area: string | null;
  approval_date: string | null;
  public_description: string | null;
  website: string | null;
  facebook: string | null;
  phone: string | null;
  email: string | null;
  phone_public: boolean;
  email_public: boolean;
  featured_photo_id: string | null;
};

type GalleryItem = { id: string; url: string | null };

export function ApprovedProfilePanel({
  applicationId,
  approved,
  gallery,
}: {
  applicationId: string;
  approved: boolean;
  gallery: GalleryItem[];
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [publicIds, setPublicIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);

  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [facebook, setFacebook] = useState("");
  const [phonePublic, setPhonePublic] = useState(false);
  const [emailPublic, setEmailPublic] = useState(false);
  const [featured, setFeatured] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: p }, { data: g }] = await Promise.all([
      db.from("contractor_profiles").select("*").eq("application_id", applicationId).maybeSingle(),
      db.from("contractor_gallery").select("id,is_public").eq("application_id", applicationId),
    ]);
    const row = (p as Profile | null) ?? null;
    setProfile(row);
    setPublicIds(((g as { id: string; is_public: boolean }[]) ?? []).filter((r) => r.is_public).map((r) => r.id));
    if (row) {
      setDescription(row.public_description ?? "");
      setWebsite(row.website ?? "");
      setFacebook(row.facebook ?? "");
      setPhonePublic(row.phone_public);
      setEmailPublic(row.email_public);
      setFeatured(row.featured_photo_id);
    }
    setLoading(false);
  }, [applicationId]);

  useEffect(() => {
    if (approved) void load();
    else setLoading(false);
  }, [approved, load]);

  if (!approved) {
    return (
      <section className="card-panel text-center">
        <CheckCircle2 className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Your Approved Contractor profile will become available after your application is approved.
        </p>
      </section>
    );
  }

  if (loading) return <div className="card-panel h-40 animate-pulse" />;

  if (!profile) {
    return (
      <section className="card-panel text-sm text-muted-foreground">
        Your public profile is being prepared. Please check back shortly.
      </section>
    );
  }

  const togglePhoto = (id: string) =>
    setPublicIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const save = async () => {
    setBusy(true);
    try {
      const featuredId = featured && publicIds.includes(featured) ? featured : (publicIds[0] ?? null);
      const { error } = await db
        .from("contractor_profiles")
        .update({
          public_description: description.trim() || null,
          website: website.trim() || null,
          facebook: facebook.trim() || null,
          phone_public: phonePublic,
          email_public: emailPublic,
          featured_photo_id: featuredId,
        })
        .eq("id", profile.id);
      if (error) throw new Error(friendlyMessage(error));

      await Promise.all(
        gallery.map((g) =>
          db.from("contractor_gallery").update({ is_public: publicIds.includes(g.id) }).eq("id", g.id),
        ),
      );
      toast.success("Public profile updated");
      await load();
    } catch (e) {
      toast.error(friendlyMessage(e, "Could not save your profile"));
    } finally {
      setBusy(false);
    }
  };

  const statusLabel = profile.status === "active" ? "Active" : profile.status === "hidden" ? "Hidden" : "Suspended";

  return (
    <div className="space-y-4">
      <section className="card-panel space-y-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <h2 className="font-semibold">Your Approved Contractor profile</h2>
            <p className="truncate text-xs text-muted-foreground">/contractors/{profile.slug}</p>
          </div>
          <span className={profile.status === "active" ? "badge-approved shrink-0" : "badge-status shrink-0"}>
            {statusLabel}
          </span>
        </div>
        {profile.approval_date && (
          <p className="text-xs text-muted-foreground">
            Approved on {new Date(profile.approval_date).toLocaleDateString()}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-outline" onClick={() => setPreview((v) => !v)}>
            <Eye className="h-4 w-4" /> {preview ? "Hide preview" : "Preview changes"}
          </button>
          {profile.status === "active" && (
            <Link to="/contractors/$contractorSlug" params={{ contractorSlug: profile.slug }} className="btn-gold">
              <ExternalLink className="h-4 w-4" /> Open public profile
            </Link>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Your approval date, Approved Contractor badge and review details are managed by Handy Help and cannot be
          edited here.
        </p>
      </section>

      {preview && (
        <section className="card-panel space-y-3 border-[color:var(--color-gold)]/40">
          <h3 className="text-sm font-semibold text-[color:var(--color-gold)]">Preview</h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{profile.business_name ?? "Your business"}</span>
            <span className="badge-approved"><CheckCircle2 className="h-3.5 w-3.5" /> Approved Contractor</span>
          </div>
          <p className="whitespace-pre-line text-sm text-muted-foreground">
            {description.trim() || "No description yet."}
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {phonePublic && profile.phone && <li>Phone: {profile.phone}</li>}
            {emailPublic && profile.email && <li>Email: {profile.email}</li>}
            {website.trim() && <li>Website: {website.trim()}</li>}
            {facebook.trim() && <li>Facebook: {facebook.trim()}</li>}
          </ul>
          <p className="text-xs text-muted-foreground">
            {publicIds.length} photo{publicIds.length === 1 ? "" : "s"} will be shown publicly.
          </p>
        </section>
      )}

      <section className="card-panel space-y-4">
        <h2 className="font-semibold">Public business details</h2>
        <div>
          <label htmlFor="public-description">Public business description</label>
          <textarea
            id="public-description"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell customers about your business, experience and the work you do."
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="public-website"><Globe className="mr-1 inline h-3.5 w-3.5" /> Website</label>
            <input
              id="public-website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="www.yourbusiness.co.uk"
            />
          </div>
          <div>
            <label htmlFor="public-facebook"><Facebook className="mr-1 inline h-3.5 w-3.5" /> Facebook page</label>
            <input
              id="public-facebook"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              placeholder="facebook.com/yourbusiness"
            />
          </div>
        </div>
      </section>

      <section className="card-panel space-y-3">
        <h2 className="font-semibold">Public contact details</h2>
        <p className="text-sm text-muted-foreground">
          Choose what customers can see. Hidden details are never shown on your public profile.
        </p>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={phonePublic}
            onChange={(e) => setPhonePublic(e.target.checked)}
          />
          <Phone className="h-4 w-4 text-[color:var(--color-gold)]" />
          Show my phone number{profile.phone ? ` (${profile.phone})` : ""}
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={emailPublic}
            onChange={(e) => setEmailPublic(e.target.checked)}
          />
          <Mail className="h-4 w-4 text-[color:var(--color-gold)]" />
          Show my email address{profile.email ? ` (${profile.email})` : ""}
        </label>
      </section>

      <section className="card-panel space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Public work photos</h2>
          <span className="text-xs text-muted-foreground">{publicIds.length} selected</span>
        </div>
        {gallery.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <Images className="mx-auto h-5 w-5 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              You haven't uploaded any work photos yet. Upload photos in the Photos tab first.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {gallery.map((g) => {
              const isPublic = publicIds.includes(g.id);
              return (
                <li key={g.id} className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => togglePhoto(g.id)}
                    aria-pressed={isPublic}
                    className={`relative block aspect-square w-full overflow-hidden rounded-lg border ${
                      isPublic ? "border-[color:var(--color-gold)]" : "border-border opacity-60"
                    }`}
                  >
                    {g.url ? (
                      <img src={g.url} alt="Work photo" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    ) : (
                      <span className="grid h-full place-items-center text-xs text-muted-foreground">No preview</span>
                    )}
                    {isPublic && (
                      <span className="absolute right-1.5 top-1.5 rounded-full bg-background/80 p-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={!isPublic}
                    onClick={() => setFeatured(g.id)}
                    className={`flex w-full items-center justify-center gap-1 rounded-md py-1 text-xs ${
                      featured === g.id
                        ? "bg-[color:var(--color-gold)] text-[color:var(--color-primary-foreground)] font-semibold"
                        : "text-muted-foreground hover:text-foreground disabled:opacity-40"
                    }`}
                  >
                    <Star className="h-3.5 w-3.5" /> {featured === g.id ? "Featured" : "Make featured"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <button type="button" className="btn-gold w-full sm:w-fit" onClick={() => void save()} disabled={busy}>
        <Save className="h-4 w-4" /> {busy ? "Saving…" : "Save profile changes"}
      </button>
    </div>
  );
}

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type PublicPhoto = { id: string; url: string | null };

export type PublicProfile = {
  slug: string;
  businessName: string | null;
  mainArea: string | null;
  approvalDate: string | null;
  description: string | null;
  services: string[];
  areas: string[];
  website: string | null;
  facebook: string | null;
  phone: string | null;
  email: string | null;
  insuranceStatus: string | null;
  insuranceExpiryDate: string | null;
  qualifications: string | null;
  logoUrl: string | null;
  photos: PublicPhoto[];
  featuredPhotoId: string | null;
};

function publicClient() {
  return createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * Public, unauthenticated read of an ACTIVE approved contractor profile.
 * Only fields explicitly copied to contractor_profiles are returned, and
 * storage paths are never exposed — images come back as short-lived signed URLs.
 */
export const getPublicProfile = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(data))
  .handler(async ({ data }): Promise<PublicProfile | null> => {
    const supabase = publicClient();

    const { data: profile } = await supabase
      .from("contractor_profiles")
      .select(
        "application_id,slug,business_name,main_area,approval_date,public_description,services,areas,website,facebook,phone,email,phone_public,email_public,insurance_status,insurance_expiry_date,qualifications,logo_path,featured_photo_id",
      )
      .eq("slug", data.slug)
      .eq("status", "active")
      .maybeSingle();

    if (!profile) return null;

    const { data: galleryRows } = await supabase
      .from("contractor_gallery")
      .select("id,path,created_at")
      .eq("application_id", profile.application_id)
      .eq("is_public", true)
      .order("created_at", { ascending: true });

    const rows = galleryRows ?? [];

    let logoUrl: string | null = null;
    let photos: PublicPhoto[] = rows.map((r) => ({ id: r.id, url: null }));

    const paths = [
      ...(profile.logo_path ? [profile.logo_path] : []),
      ...rows.map((r) => r.path),
    ];

    if (paths.length > 0) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: signed } = await supabaseAdmin.storage
        .from("contractor-files")
        .createSignedUrls(paths, 60 * 60);
      const byPath = new Map((signed ?? []).map((s) => [s.path ?? "", s.signedUrl ?? null]));
      logoUrl = profile.logo_path ? (byPath.get(profile.logo_path) ?? null) : null;
      photos = rows.map((r) => ({ id: r.id, url: byPath.get(r.path) ?? null }));
    }

    return {
      slug: profile.slug,
      businessName: profile.business_name,
      mainArea: profile.main_area,
      approvalDate: profile.approval_date,
      description: profile.public_description,
      services: profile.services ?? [],
      areas: profile.areas ?? [],
      website: profile.website,
      facebook: profile.facebook,
      phone: profile.phone_public ? profile.phone : null,
      email: profile.email_public ? profile.email : null,
      insuranceStatus: profile.insurance_status,
      insuranceExpiryDate: profile.insurance_expiry_date ?? null,
      qualifications: profile.qualifications,
      logoUrl,
      photos,
      featuredPhotoId: profile.featured_photo_id,
    };
  });

export const listPublicProfiles = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data } = await supabase
    .from("contractor_profiles")
    .select(
      "application_id,slug,business_name,main_area,public_description,approval_date,services,areas,logo_path,featured_photo_id",
    )
    .eq("status", "active")
    .order("approval_date", { ascending: false });

  const profiles = data ?? [];
  if (profiles.length === 0) return [];

  const { data: galleryRows } = await supabase
    .from("contractor_gallery")
    .select("id,application_id,path,created_at")
    .in("application_id", profiles.map((p) => p.application_id))
    .eq("is_public", true)
    .order("created_at", { ascending: true });

  const gallery = galleryRows ?? [];

  const coverPathFor = (appId: string, featuredId: string | null) => {
    const rows = gallery.filter((g) => g.application_id === appId);
    const featured = featuredId ? rows.find((g) => g.id === featuredId) : undefined;
    return (featured ?? rows[0])?.path ?? null;
  };

  const paths = new Set<string>();
  for (const p of profiles) {
    if (p.logo_path) paths.add(p.logo_path);
    const cover = coverPathFor(p.application_id, p.featured_photo_id);
    if (cover) paths.add(cover);
  }

  let byPath = new Map<string, string | null>();
  if (paths.size > 0) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed } = await supabaseAdmin.storage
      .from("contractor-files")
      .createSignedUrls([...paths], 60 * 60);
    byPath = new Map((signed ?? []).map((s) => [s.path ?? "", s.signedUrl ?? null]));
  }

  return profiles.map((r) => {
    const cover = coverPathFor(r.application_id, r.featured_photo_id);
    return {
      slug: r.slug,
      businessName: r.business_name,
      mainArea: r.main_area,
      description: r.public_description,
      approvalDate: r.approval_date,
      services: r.services ?? [],
      areas: r.areas ?? [],
      logoUrl: r.logo_path ? (byPath.get(r.logo_path) ?? null) : null,
      coverUrl: cover ? (byPath.get(cover) ?? null) : null,
    };
  });
});

import { db } from "@/lib/db";
import { INFO_DOCUMENTS, INFO_SECTIONS, labelFor } from "@/components/application/info-requests";

export type ItemType = "section" | "document";

export type RequestItemRow = {
  id: string;
  request_id: string;
  application_id: string;
  item_type: ItemType;
  item_key: string;
  snapshot: Record<string, unknown>;
};

export type ItemStatus = "not_updated" | "updated" | "document_uploaded";

export const ITEM_STATUS_LABEL: Record<ItemStatus, string> = {
  not_updated: "Not Updated",
  updated: "Updated",
  document_uploaded: "Document Uploaded",
};

export const ITEM_STATUS_TONE: Record<ItemStatus, string> = {
  not_updated: "border-orange-400/40 bg-orange-400/10 text-orange-300",
  updated: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  document_uploaded: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
};

/** Which application tab a requested item lives on, so we can deep link. */
export const ITEM_TAB: Record<string, string> = {
  work_photos: "photos",
  insurance_document: "documents",
  qualification_documents: "documents",
  business_logo: "photos",
};

type AppRow = Record<string, unknown>;

export type SnapshotSource = {
  app: AppRow;
  services: string[];
  areas: string[];
  docs: { kind: string; path: string; created_at: string }[];
  gallery: { path: string; created_at: string }[];
};

/** Reads everything needed to fingerprint each requested item. */
export async function loadSnapshotSource(applicationId: string): Promise<SnapshotSource> {
  const [{ data: app }, { data: s }, { data: a }, { data: d }, { data: g }] = await Promise.all([
    db.from("contractor_applications").select("*").eq("id", applicationId).maybeSingle(),
    db.from("contractor_services").select("service").eq("application_id", applicationId),
    db.from("contractor_areas").select("area").eq("application_id", applicationId),
    db
      .from("contractor_documents")
      .select("kind,path,created_at,is_active")
      .eq("application_id", applicationId),
    db.from("contractor_gallery").select("path,created_at").eq("application_id", applicationId),
  ]);
  return {
    app: (app as AppRow) ?? {},
    services: ((s as { service: string }[]) ?? []).map((r) => r.service).sort(),
    areas: ((a as { area: string }[]) ?? []).map((r) => r.area).sort(),
    docs: ((d as { kind: string; path: string; created_at: string; is_active?: boolean }[]) ?? [])
      .filter((r) => r.is_active !== false)
      .map(({ kind, path, created_at }) => ({ kind, path, created_at })),
    gallery: ((g as { path: string; created_at: string }[]) ?? []).map(({ path, created_at }) => ({
      path,
      created_at,
    })),
  };
}

function docFingerprint(src: SnapshotSource, kind: string) {
  const list = src.docs
    .filter((d) => d.kind === kind)
    .map((d) => d.path)
    .sort();
  return { count: list.length, paths: list };
}

/** Deterministic fingerprint of one requested item's current state. */
export function fingerprint(type: ItemType, key: string, src: SnapshotSource): Record<string, unknown> {
  const a = src.app;
  if (type === "document") {
    switch (key) {
      case "insurance_document":
        return { ...docFingerprint(src, "insurance"), evidence: a.insurance_evidence_path ?? null };
      case "qualification_documents":
        return docFingerprint(src, "qualification");
      case "business_logo":
        return { logo: a.logo_path ?? null };
      case "work_photos":
        return { photos: src.gallery.map((g) => g.path).sort() };
      default:
        return {};
    }
  }
  switch (key) {
    case "business_details":
      return {
        business_name: a.business_name ?? null,
        company_registration_number: a.company_registration_number ?? null,
        working_hours: a.working_hours ?? null,
      };
    case "contact_details":
      return { contact_name: a.contact_name ?? null, email: a.email ?? null, phone: a.phone ?? null };
    case "services":
      return { services: src.services };
    case "areas":
      return { areas: src.areas };
    case "business_description":
      return { description: a.description ?? null, main_area: a.main_area ?? null };
    case "website_facebook":
      return { website: a.website ?? null, facebook: a.facebook ?? null };
    case "work_photos":
      return { photos: src.gallery.map((g) => g.path).sort() };
    case "insurance_information":
      return { insurance_status: a.insurance_status ?? null };
    case "qualifications":
      return { qualifications: a.qualifications ?? null };
    case "references":
      return { references_text: a.references_text ?? null };
    default:
      return {};
  }
}

const stable = (v: unknown) => JSON.stringify(v ?? {});

export function itemStatus(item: RequestItemRow, src: SnapshotSource): ItemStatus {
  const now = fingerprint(item.item_type, item.item_key, src);
  if (stable(now) === stable(item.snapshot)) return "not_updated";
  return item.item_type === "document" ? "document_uploaded" : "updated";
}

export function itemLabel(item: { item_type: ItemType; item_key: string }) {
  return item.item_type === "document"
    ? labelFor(INFO_DOCUMENTS, item.item_key)
    : labelFor(INFO_SECTIONS, item.item_key);
}

/** Creates the tracked items (with a "before" snapshot) for a freshly sent request. */
export async function createRequestItems(opts: {
  requestId: string;
  applicationId: string;
  sections: string[];
  documents: string[];
}) {
  const src = await loadSnapshotSource(opts.applicationId);
  const rows = [
    ...opts.sections.map((key) => ({ type: "section" as const, key })),
    ...opts.documents.map((key) => ({ type: "document" as const, key })),
  ].map((i) => ({
    request_id: opts.requestId,
    application_id: opts.applicationId,
    item_type: i.type,
    item_key: i.key,
    snapshot: fingerprint(i.type, i.key, src),
  }));
  if (rows.length === 0) return;
  await db.from("application_info_request_items").insert(rows);
}

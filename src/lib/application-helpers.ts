import { supabase } from "@/integrations/supabase/client";

export type AppStatus = "draft" | "submitted" | "under_review" | "more_info_required" | "approved" | "rejected" | "suspended";

export const STATUS_LABEL: Record<AppStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  more_info_required: "More information required",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};

/** Token-based pill classes so a status looks the same everywhere it appears. */
export const STATUS_PILL_CLASS: Record<AppStatus, string> = {
  draft: "pill-base pill-neutral",
  submitted: "pill-base pill-info",
  under_review: "pill-base pill-gold",
  more_info_required: "pill-base pill-warning",
  approved: "pill-base pill-success",
  rejected: "pill-base pill-danger",
  suspended: "pill-base pill-danger",
};

export const STATUS_ORDER_LIST: AppStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "more_info_required",
  "approved",
  "rejected",
  "suspended",
];


export const REQUIRED_FIELDS = [
  "business_name",
  "contact_name",
  "email",
  "phone",
  "main_area",
  "description",
  "insurance_status",
] as const;

export function completionPercent(app: Record<string, unknown> | null, services: number, areas: number, docs: number): number {
  if (!app) return 0;
  let filled = 0;
  const total = REQUIRED_FIELDS.length + 3; // + services, areas, docs presence
  for (const f of REQUIRED_FIELDS) if ((app as Record<string, unknown>)[f]) filled++;
  if (services > 0) filled++;
  if (areas > 0) filled++;
  if (docs > 0) filled++;
  return Math.round((filled / total) * 100);
}

export function missingFields(app: Record<string, unknown> | null, services: number, areas: number): string[] {
  const missing: string[] = [];
  if (!app) return ["Application not started"];
  const labels: Record<string, string> = {
    business_name: "Business name",
    contact_name: "Contact name",
    email: "Email",
    phone: "Phone",
    main_area: "Main operating area",
    description: "Business description",
    insurance_status: "Insurance status",
  };
  for (const f of REQUIRED_FIELDS) if (!(app as Record<string, unknown>)[f]) missing.push(labels[f]);
  if (services === 0) missing.push("At least one service");
  if (areas === 0) missing.push("At least one area covered");
  if (!(app as Record<string, unknown>).agreed_rules) missing.push("Agreement to community rules");
  if (!(app as Record<string, unknown>).confirmed_accurate) missing.push("Confirmation information is accurate");
  return missing;
}

export async function getSignedUrl(path: string): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from("contractor-files").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export async function uploadFile(userId: string, folder: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("contractor-files").upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

export function insuranceProvided(status: string | null | undefined): boolean {
  const s = (status ?? "").toLowerCase();
  if (!s) return false;
  return !s.includes("no") && !s.includes("none");
}

export function missingDocuments(opts: {
  insuranceStatus: string | null;
  insuranceDocs: number;
  insuranceEvidencePath: string | null;
  qualifications: string | null;
  qualificationDocs: number;
  photos: number;
}): string[] {
  const missing: string[] = [];
  if (insuranceProvided(opts.insuranceStatus) && opts.insuranceDocs === 0 && !opts.insuranceEvidencePath) {
    missing.push("Insurance document");
  }
  if ((opts.qualifications ?? "").trim().length > 0 && opts.qualificationDocs === 0) {
    missing.push("Qualification document");
  }
  if (opts.photos === 0) missing.push("Previous work photos");
  return missing;
}

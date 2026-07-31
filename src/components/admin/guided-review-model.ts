export type ReviewState = "not_reviewed" | "checked" | "needs_info" | "not_applicable";

export type SectionId =
  | "contact"
  | "business"
  | "services"
  | "coverage"
  | "photos"
  | "insurance"
  | "insurance_document"
  | "qualifications"
  | "references"
  | "agreements"
  | "completeness";

export type CheckDef = {
  key: string;
  label: string;
  section: SectionId;
  /** relevant only when the contractor entered qualifications */
  qualificationOnly?: boolean;
  /** prefill keys for the Request More Information feature */
  infoSection?: string;
  infoDocument?: string;
};

export const SECTION_TITLES: Record<SectionId, string> = {
  contact: "Contact Details",
  business: "Business Details",
  services: "Services",
  coverage: "Coverage",
  photos: "Logo & Photos",
  insurance: "Insurance",
  insurance_document: "Insurance Document",
  qualifications: "Qualifications",
  references: "References",
  agreements: "Agreements",
  completeness: "Application Completeness",
};

export const REVIEW_CHECKS: CheckDef[] = [
  { key: "contact_details", label: "Contact details checked", section: "contact", infoSection: "contact_details" },
  {
    key: "business_information",
    label: "Business information checked",
    section: "business",
    infoSection: "business_details",
  },
  { key: "services", label: "Services checked", section: "services", infoSection: "services" },
  { key: "areas", label: "Areas covered checked", section: "coverage", infoSection: "areas" },
  {
    key: "business_description",
    label: "Business description checked",
    section: "business",
    infoSection: "business_description",
  },
  {
    key: "work_photos",
    label: "Work photos checked",
    section: "photos",
    infoSection: "work_photos",
    infoDocument: "work_photos",
  },
  {
    key: "insurance_status",
    label: "Insurance status checked",
    section: "insurance",
    infoSection: "insurance_information",
  },
  {
    key: "insurance_document",
    label: "Insurance document checked",
    section: "insurance_document",
    infoDocument: "insurance_document",
  },
  {
    key: "insurance_expiry",
    label: "Insurance expiry date checked",
    section: "insurance_document",
    infoSection: "insurance_information",
  },
  {
    key: "qualifications",
    label: "Qualifications checked where relevant",
    section: "qualifications",
    qualificationOnly: true,
    infoSection: "qualifications",
  },
  {
    key: "qualification_documents",
    label: "Qualification documents checked where relevant",
    section: "qualifications",
    qualificationOnly: true,
    infoDocument: "qualification_documents",
  },
  {
    key: "references",
    label: "References or review links checked",
    section: "references",
    infoSection: "references",
  },
  { key: "community_rules", label: "Community rules accepted", section: "agreements" },
  { key: "accuracy_confirmation", label: "Accuracy confirmation checked", section: "agreements" },
  { key: "information_complete", label: "Application information complete", section: "completeness" },
];

export const STATE_LABEL: Record<ReviewState, string> = {
  not_reviewed: "Not Reviewed",
  checked: "Checked",
  needs_info: "Needs Information",
  not_applicable: "Not Applicable",
};

export const STATE_TONE: Record<ReviewState, string> = {
  not_reviewed: "border-white/15 bg-white/5 text-muted-foreground",
  checked: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  needs_info: "border-orange-400/40 bg-orange-400/10 text-orange-300",
  not_applicable: "border-white/10 bg-white/[0.03] text-muted-foreground",
};

export function overallStatus(states: ReviewState[]): "Not Started" | "In Progress" | "Needs Information" | "Complete" {
  if (states.length === 0) return "Not Started";
  if (states.some((s) => s === "needs_info")) return "Needs Information";
  if (states.every((s) => s === "checked" || s === "not_applicable")) return "Complete";
  if (states.every((s) => s === "not_reviewed")) return "Not Started";
  return "In Progress";
}

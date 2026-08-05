export const EXPIRING_SOON_DAYS = 30;

export type InsuranceState =
  | "valid"
  | "expiring_soon"
  | "expired"
  | "awaiting_review"
  | "missing_expiry"
  | "not_provided";

export type VerificationState = "awaiting_review" | "verified" | "rejected";

export type InsuranceInput = {
  status: string | null;
  expiryDate: string | null;
  verificationState?: string | null;
  hasDocument?: boolean;
};

export const INSURANCE_LABEL: Record<InsuranceState, string> = {
  valid: "Insurance valid",
  expiring_soon: "Insurance expiring soon",
  expired: "Insurance expired",
  awaiting_review: "Insurance awaiting review",
  missing_expiry: "Insurance expiry date missing",
  not_provided: "No insurance provided",
};

export const INSURANCE_SHORT_LABEL: Record<InsuranceState, string> = {
  valid: "Valid",
  expiring_soon: "Expiring soon",
  expired: "Expired",
  awaiting_review: "Awaiting review",
  missing_expiry: "Expiry missing",
  not_provided: "Not provided",
};

export const INSURANCE_TONE: Record<InsuranceState, string> = {
  valid: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  expiring_soon: "border-[color:var(--color-gold)]/50 bg-[color:var(--color-gold)]/10 text-[color:var(--color-gold)]",
  expired: "border-destructive/50 bg-destructive/10 text-destructive",
  awaiting_review: "border-white/20 bg-white/5 text-muted-foreground",
  missing_expiry: "border-orange-400/40 bg-orange-400/10 text-orange-300",
  not_provided: "border-orange-400/40 bg-orange-400/10 text-orange-300",
};

export const VERIFICATION_LABEL: Record<string, string> = {
  awaiting_review: "Awaiting review",
  verified: "Verified by admin",
  rejected: "Rejected by admin",
};

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Whole days from today until the given date. Negative when in the past. */
export function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.round((startOfDay(parsed) - startOfDay(new Date())) / 86_400_000);
}

export function insuranceDeclared(status: string | null | undefined): boolean {
  const s = (status ?? "").trim().toLowerCase();
  if (!s) return false;
  return !s.includes("none") && !/\bno\b/.test(s) && !s.startsWith("no ");
}

export function insuranceState(input: InsuranceInput): InsuranceState {
  if (!insuranceDeclared(input.status)) return "not_provided";
  const days = daysUntil(input.expiryDate);
  if (days === null) return "missing_expiry";
  if (days < 0) return "expired";
  if ((input.verificationState ?? "awaiting_review") !== "verified") return "awaiting_review";
  if (days <= EXPIRING_SOON_DAYS) return "expiring_soon";
  return "valid";
}

export type InsuranceSummary = {
  state: InsuranceState;
  label: string;
  shortLabel: string;
  tone: string;
  days: number | null;
  expiryText: string;
  detail: string;
};

export function formatExpiry(date: string | null | undefined): string {
  if (!date) return "Not provided";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Not provided";
  return parsed.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

export function insuranceSummary(input: InsuranceInput): InsuranceSummary {
  const state = insuranceState(input);
  const days = daysUntil(input.expiryDate);
  let detail: string;
  switch (state) {
    case "valid":
      detail = days === null ? "Cover is in date." : `${days} day${days === 1 ? "" : "s"} of cover remaining.`;
      break;
    case "expiring_soon":
      detail =
        days === 0
          ? "Cover expires today."
          : `Cover expires in ${days} day${days === 1 ? "" : "s"}.`;
      break;
    case "expired":
      detail = days === null ? "Cover has expired." : `Cover expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago.`;
      break;
    case "awaiting_review":
      detail = "An administrator still needs to verify this insurance.";
      break;
    case "missing_expiry":
      detail = "No expiry date has been provided for this insurance.";
      break;
    default:
      detail = "No public liability insurance has been provided.";
  }
  return {
    state,
    label: INSURANCE_LABEL[state],
    shortLabel: INSURANCE_SHORT_LABEL[state],
    tone: INSURANCE_TONE[state],
    days,
    expiryText: formatExpiry(input.expiryDate),
    detail,
  };
}

/** Insurance states that must block a new approval. */
export function blocksApproval(state: InsuranceState): boolean {
  return state === "expired" || state === "not_provided" || state === "missing_expiry";
}

/** Whether the public profile may advertise insurance. */
export function publiclyDisplayable(state: InsuranceState): boolean {
  return state === "valid" || state === "expiring_soon";
}

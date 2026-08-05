import { ShieldAlert, ShieldCheck, ShieldQuestion, ShieldX } from "lucide-react";
import { insuranceSummary, type InsuranceInput, type InsuranceState } from "@/lib/insurance";

const ICONS: Record<InsuranceState, React.ComponentType<{ className?: string }>> = {
  valid: ShieldCheck,
  expiring_soon: ShieldAlert,
  expired: ShieldX,
  awaiting_review: ShieldQuestion,
  missing_expiry: ShieldAlert,
  not_provided: ShieldX,
};

export function InsuranceBadge({ input, compact = false }: { input: InsuranceInput; compact?: boolean }) {
  const s = insuranceSummary(input);
  const Icon = ICONS[s.state];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${s.tone}`}
      title={s.detail}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {compact ? s.shortLabel : s.label}
    </span>
  );
}

export function InsuranceSummaryLine({ input }: { input: InsuranceInput }) {
  const s = insuranceSummary(input);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <InsuranceBadge input={input} />
      <span className="text-xs text-muted-foreground">
        Expiry: {s.expiryText} — {s.detail}
      </span>
    </div>
  );
}

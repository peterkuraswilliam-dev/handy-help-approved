import { Building2, HardHat } from "lucide-react";

export function ContractorFallbackCover({
  name,
  size = "cover",
}: {
  name: string | null;
  size?: "cover" | "hero" | "logo";
}) {
  const initials = name
    ? name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("")
    : "HH";

  if (size === "logo") {
    return (
      <div className="fallback-cover-logo grid h-full w-full place-items-center">
        <span className="text-lg font-bold tracking-tight text-[color:var(--color-gold)]">
          {initials}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`fallback-cover ${size === "hero" ? "fallback-cover-hero" : ""} grid h-full w-full place-items-center overflow-hidden`}
      aria-label={`${name ?? "Contractor"} placeholder cover`}
    >
      <div className="fallback-cover-inner flex flex-col items-center justify-center gap-2">
        <div className="fallback-cover-icon-ring">
          <HardHat className="h-8 w-8 text-[color:var(--color-gold)]" />
        </div>
        <span className="fallback-cover-initials text-sm font-semibold tracking-widest text-[color:var(--color-gold)]">
          {initials}
        </span>
      </div>
    </div>
  );
}

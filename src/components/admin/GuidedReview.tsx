import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
  MessageSquareWarning,
  PlayCircle,
  RefreshCw,
  StickyNote,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { formatExpiry } from "@/lib/insurance";
import { InsuranceBadge } from "@/components/insurance/InsuranceBadge";
import { ProgressBar } from "@/components/application/shared";
import { ApplicationDocuments } from "@/components/admin/ApplicationDocuments";
import { PhotosPanel } from "@/components/application/PhotosPanel";
import {
  REVIEW_CHECKS,
  SECTION_TITLES,
  STATE_LABEL,
  STATE_TONE,
  overallStatus,
  type CheckDef,
  type ReviewState,
  type SectionId,
} from "@/components/admin/guided-review-model";

type StateRow = {
  check_key: string;
  review_state: ReviewState;
  reviewed_by: string | null;
  reviewed_at: string | null;
  issue_note: string | null;
};

export type GuidedReviewApp = {
  business_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  main_area: string | null;
  description: string | null;
  website: string | null;
  facebook: string | null;
  insurance_status: string | null;
  insurance_expiry_date?: string | null;
  insurance_verification_state?: string | null;
  insurance_evidence_path: string | null;
  qualifications: string | null;
  references_text: string | null;
  agreed_rules: boolean | null;
  confirmed_accurate: boolean | null;
  status?: string | null;
};


const NOT_PROVIDED = "Not provided";

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return desktop;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  const text = value && value.trim().length > 0 ? value : NOT_PROVIDED;
  const missing = text === NOT_PROVIDED;
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`break-words whitespace-pre-wrap text-sm ${missing ? "italic text-muted-foreground" : ""}`}>
        {text}
      </p>
    </div>
  );
}

function StatePill({ state }: { state: ReviewState }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATE_TONE[state]}`}>
      {STATE_LABEL[state]}
    </span>
  );
}

export function GuidedReview({
  applicationId,
  app,
  services,
  areas,
  logoPath,
  logoUrl,
  gallery,
  mediaLoading,
  onPrefillRequest,
  onAddNote,
  decisionSlot,
}: {
  applicationId: string;
  app: GuidedReviewApp;
  services: string[];
  areas: string[];
  logoPath: string | null;
  logoUrl: string | null;
  gallery: { id: string; url: string | null }[];
  mediaLoading: boolean;
  onPrefillRequest: (sections: string[], documents: string[], message: string) => void;
  onAddNote: () => void;
  decisionSlot?: ReactNode;
}) {

  const qualsRelevant = !!(app.qualifications && app.qualifications.trim().length > 0);
  const checks = REVIEW_CHECKS;

  const [rows, setRows] = useState<Record<string, StateRow>>({});
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string>(REVIEW_CHECKS[0].key);
  const [issueDraft, setIssueDraft] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const desktop = useIsDesktop();
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    const { data, error } = await db
      .from("application_review_checks")
      .select("check_key,review_state,reviewed_by,reviewed_at,issue_note")
      .eq("application_id", applicationId);
    if (error) {
      setFailed(true);
      setLoading(false);
      return;
    }
    const map: Record<string, StateRow> = {};
    for (const r of (data as StateRow[]) ?? []) map[r.check_key] = r;
    setRows(map);
    setLoading(false);
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const stateOf = useCallback(
    (key: string): ReviewState => rows[key]?.review_state ?? "not_reviewed",
    [rows],
  );

  const activeCheck = checks.find((c) => c.key === activeKey) ?? checks[0];

  useEffect(() => {
    setIssueDraft(rows[activeKey]?.issue_note ?? "");
  }, [activeKey, rows]);

  const counted = checks.filter((c) => !(c.qualificationOnly && !qualsRelevant));
  const total = counted.length;
  const done = counted.filter((c) => ["checked", "not_applicable"].includes(stateOf(c.key))).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const overall = overallStatus(counted.map((c) => stateOf(c.key)));
  // After a contractor resubmits, pick up from the first item flagged Needs Information.
  const resumeAfterResponse = app.status === "submitted";
  const nextIncomplete = resumeAfterResponse
    ? (counted.find((c) => stateOf(c.key) === "needs_info") ??
      counted.find((c) => stateOf(c.key) === "not_reviewed") ??
      null)
    : (counted.find((c) => stateOf(c.key) === "not_reviewed") ??
      counted.find((c) => stateOf(c.key) === "needs_info") ??
      null);


  const focusSection = useCallback((section: SectionId) => {
    window.requestAnimationFrame(() => {
      sectionRefs.current[section]?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const goTo = useCallback(
    (key: string) => {
      const def = checks.find((c) => c.key === key);
      if (!def) return;
      setActiveKey(key);
      setSheetOpen(false);
      focusSection(def.section);
    },
    [checks, focusSection],
  );

  const save = useCallback(
    async (key: string, state: ReviewState, note?: string | null) => {
      setSaving(key);
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;
      const payload = {
        application_id: applicationId,
        check_key: key,
        review_state: state,
        completed: state === "checked",
        completed_by: state === "checked" ? uid : null,
        completed_at: state === "checked" ? new Date().toISOString() : null,
        reviewed_by: state === "not_reviewed" ? null : uid,
        reviewed_at: state === "not_reviewed" ? null : new Date().toISOString(),
        issue_note: state === "needs_info" ? (note ?? null) : null,
      };
      const { error } = await db
        .from("application_review_checks")
        .upsert(payload, { onConflict: "application_id,check_key" });
      if (!error) {
        setRows((prev) => ({
          ...prev,
          [key]: {
            check_key: key,
            review_state: state,
            reviewed_by: payload.reviewed_by,
            reviewed_at: payload.reviewed_at,
            issue_note: payload.issue_note,
          },
        }));
      }
      setSaving(null);
      return !error;
    },
    [applicationId],
  );

  const saveAndNext = useCallback(
    async (state?: ReviewState) => {
      const current = activeCheck.key;
      const nextState = state ?? stateOf(current);
      await save(current, nextState, issueDraft.trim() || null);
      const order = counted;
      const idx = order.findIndex((c) => c.key === current);
      const after = [...order.slice(idx + 1), ...order.slice(0, idx)];
      const target =
        after.find((c) => {
          const s = c.key === current ? nextState : stateOf(c.key);
          return s === "not_reviewed" || s === "needs_info";
        }) ?? order[Math.min(idx + 1, order.length - 1)];
      if (target) goTo(target.key);
    },
    [activeCheck, counted, goTo, issueDraft, save, stateOf],
  );

  const goPrevious = () => {
    const idx = counted.findIndex((c) => c.key === activeCheck.key);
    const prev = counted[idx - 1] ?? counted[counted.length - 1];
    if (prev) goTo(prev.key);
  };

  if (loading) {
    return (
      <section className="card-panel space-y-3">
        <div className="h-5 w-1/3 animate-pulse rounded bg-white/10" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded bg-white/10" />
        ))}
      </section>
    );
  }

  if (failed) {
    return (
      <section className="card-panel space-y-3">
        <h2 className="font-semibold">Guided review</h2>
        <p className="text-sm text-muted-foreground">The review checklist could not be loaded.</p>
        <button className="btn-gold w-fit" onClick={() => void load()}>
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </section>
    );
  }

  const overallTone =
    overall === "Complete"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
      : overall === "Needs Information"
        ? "border-orange-400/40 bg-orange-400/10 text-orange-300"
        : overall === "In Progress"
          ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
          : "border-white/10 bg-white/5 text-muted-foreground";

  const sectionsToRender: SectionId[] = desktop
    ? (Array.from(new Set(counted.map((c) => c.section))) as SectionId[])
    : [activeCheck.section];

  const renderSectionBody = (section: SectionId) => {
    switch (section) {
      case "contact":
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Contact name" value={app.contact_name} />
            <Field label="Email address" value={app.email} />
            <Field label="Phone number" value={app.phone} />
          </div>
        );
      case "business":
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Business or trading name" value={app.business_name} />
            <Field label="Main operating area" value={app.main_area} />
            <Field label="Website" value={app.website} />
            <Field label="Facebook page" value={app.facebook} />
            <div className="sm:col-span-2">
              <Field label="Short business description" value={app.description} />
            </div>
          </div>
        );
      case "services":
        return <Field label="Services offered" value={services.join(", ")} />;
      case "coverage":
        return <Field label="Areas covered" value={areas.join(", ")} />;
      case "photos":
        return (
          <PhotosPanel
            heading={app.business_name?.trim() || "Contractor"}
            logoPath={logoPath}
            logoUrl={logoUrl}
            gallery={gallery}
            loading={mediaLoading}
          />
        );
      case "insurance":
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Public liability insurance status" value={app.insurance_status} />
            <Field label="Insurance expiry date" value={formatExpiry(app.insurance_expiry_date)} />
            <div className="sm:col-span-2">
              <InsuranceBadge
                input={{
                  status: app.insurance_status,
                  expiryDate: app.insurance_expiry_date ?? null,
                  verificationState: app.insurance_verification_state ?? null,
                }}
              />
            </div>
            <Field
              label="Insurance evidence uploaded"
              value={app.insurance_evidence_path ? "Yes" : "No"}
            />
          </div>
        );
      case "insurance_document":
      case "qualifications":
        return (
          <ApplicationDocuments
            applicationId={applicationId}
            insuranceStatus={app.insurance_status}
            insuranceEvidencePath={app.insurance_evidence_path}
            insuranceExpiryDate={app.insurance_expiry_date ?? null}
            qualifications={app.qualifications}
          />
        );
      case "references":
        return <Field label="Customer references or review links" value={app.references_text} />;
      case "agreements":
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Community rules agreement" value={app.agreed_rules ? "Agreed" : "Not agreed"} />
            <Field
              label="Confirmation that all information is accurate"
              value={app.confirmed_accurate ? "Confirmed" : "Not confirmed"}
            />
          </div>
        );
      case "completeness":
        return (
          <p className="text-sm text-muted-foreground">
            Confirm that the whole application has been reviewed and no information is outstanding.
          </p>
        );
      default:
        return null;
    }
  };

  const controlsFor = (check: CheckDef) => {
    const state = stateOf(check.key);
    const naAllowed = !!check.qualificationOnly && !qualsRelevant;
    return (
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
          <p className="min-w-0 text-sm font-medium break-words">{check.label}</p>
          <StatePill state={state} />
        </div>

        {naAllowed && state === "not_reviewed" && (
          <p className="text-xs text-muted-foreground">
            No qualifications were entered — this item can be marked Not Applicable.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            className={state === "checked" ? "btn-gold" : "btn-outline"}
            disabled={saving === check.key}
            onClick={() => void save(check.key, "checked")}
          >
            <CheckCircle2 className="h-4 w-4" /> Mark Checked
          </button>
          <button
            className={state === "needs_info" ? "btn-gold" : "btn-outline"}
            disabled={saving === check.key}
            onClick={() => void save(check.key, "needs_info", issueDraft.trim() || null)}
          >
            <AlertTriangle className="h-4 w-4" /> Needs Information
          </button>
          <button
            className={state === "not_applicable" ? "btn-gold" : "btn-outline"}
            disabled={saving === check.key}
            onClick={() => void save(check.key, "not_applicable")}
          >
            <Ban className="h-4 w-4" /> Not Applicable
          </button>
          <button className="btn-outline" onClick={onAddNote}>
            <StickyNote className="h-4 w-4" /> Add Private Note
          </button>
          <button
            className="btn-outline"
            onClick={() =>
              onPrefillRequest(
                check.infoSection ? [check.infoSection] : [],
                check.infoDocument ? [check.infoDocument] : [],
                issueDraft.trim(),
              )
            }
          >
            <MessageSquareWarning className="h-4 w-4" /> Request More Information
          </button>
        </div>

        {state === "needs_info" && (
          <div className="space-y-2 rounded-lg border border-orange-400/30 bg-orange-400/5 p-3">
            <label htmlFor={`issue-${check.key}`} className="text-xs font-medium text-orange-300">
              Internal issue description (admin only)
            </label>
            <textarea
              id={`issue-${check.key}`}
              rows={2}
              value={issueDraft}
              onChange={(e) => setIssueDraft(e.target.value)}
              onBlur={() => void save(check.key, "needs_info", issueDraft.trim() || null)}
              placeholder="Describe what is missing or unclear in this section."
              className="w-full rounded-lg border border-white/15 bg-white/5 p-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
            />
            <button
              className="btn-outline"
              onClick={() =>
                onPrefillRequest(
                  check.infoSection ? [check.infoSection] : [],
                  check.infoDocument ? [check.infoDocument] : [],
                  issueDraft.trim(),
                )
              }
            >
              Use in Request More Information
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button className="btn-outline justify-center" onClick={goPrevious}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <button
            className="btn-gold justify-center"
            disabled={saving === check.key}
            onClick={() => void saveAndNext()}
          >
            {saving === check.key ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save &amp; Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  const checklistPanel = (
    <div className="space-y-2">
      {checks.map((c) => {
        const state = stateOf(c.key);
        const dimmed = c.qualificationOnly && !qualsRelevant && state === "not_reviewed";
        const active = c.key === activeCheck.key;
        return (
          <button
            key={c.key}
            onClick={() => goTo(c.key)}
            className={`w-full rounded-xl border p-3 text-left transition ${
              active
                ? "border-[color:var(--color-gold,#f5c542)] bg-amber-400/10"
                : state === "checked"
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : state === "needs_info"
                    ? "border-orange-400/30 bg-orange-400/5"
                    : "border-white/10 bg-white/5"
            } ${dimmed ? "opacity-70" : ""}`}
          >
            <span className="flex flex-wrap items-center justify-between gap-2">
              <span className="min-w-0 break-words text-sm">{c.label}</span>
              <StatePill state={state} />
            </span>
            <span className="mt-1 block text-[11px] text-muted-foreground">{SECTION_TITLES[c.section]}</span>
          </button>
        );
      })}
      <p className="text-xs text-muted-foreground">
        Review states are private to admins and do not change the contractor's application status.
      </p>
    </div>
  );

  return (
    <section className="space-y-4">
      <div className="card-panel space-y-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
          <h2 className="min-w-0 truncate font-semibold">Guided Review</h2>
          <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${overallTone}`}>
            {overall}
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {done} of {total} checks completed
            </span>
            <span className="font-semibold">{percent}%</span>
          </div>
          <ProgressBar percent={percent} />
        </div>
        <p className="text-sm text-muted-foreground">
          Next item:{" "}
          <span className="text-foreground">{nextIncomplete ? nextIncomplete.label : "All items reviewed"}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn-gold"
            disabled={!nextIncomplete}
            onClick={() => nextIncomplete && goTo(nextIncomplete.key)}
          >
            <PlayCircle className="h-4 w-4" /> Continue Review
          </button>
          <button className="btn-outline lg:hidden" onClick={() => setSheetOpen(true)}>
            <ClipboardList className="h-4 w-4" /> View Checklist
          </button>
        </div>
      </div>

      {decisionSlot}


      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          {sectionsToRender.map((section) => {
            const isActive = section === activeCheck.section;
            const sectionChecks = counted.filter((c) => c.section === section);
            const needsAttention = sectionChecks.some((c) => stateOf(c.key) === "needs_info");
            return (
              <div
                key={section}
                ref={(el) => {
                  sectionRefs.current[section] = el;
                }}
                className={`card-panel scroll-mt-24 space-y-3 ${
                  needsAttention
                    ? "border-orange-400/40"
                    : isActive
                      ? "border-[color:var(--color-gold,#f5c542)]/60"
                      : ""
                }`}
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:justify-between">
                  <h3 className="min-w-0 truncate font-semibold">{SECTION_TITLES[section]}</h3>
                  {needsAttention && (
                    <span className="shrink-0 rounded-full border border-orange-400/40 bg-orange-400/10 px-2 py-0.5 text-[11px] text-orange-300">
                      Needs attention
                    </span>
                  )}
                </div>
                {renderSectionBody(section)}
                {isActive
                  ? controlsFor(activeCheck)
                  : sectionChecks.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {sectionChecks.map((c) => (
                          <button
                            key={c.key}
                            className="btn-outline text-xs"
                            onClick={() => goTo(c.key)}
                          >
                            Review: {c.label}
                          </button>
                        ))}
                      </div>
                    )}
              </div>
            );
          })}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] space-y-3 overflow-y-auto pr-1">
            <div className="card-panel space-y-3">
              <h3 className="font-semibold">Review Checklist</h3>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {done} of {total} checks completed
                  </span>
                  <span>{percent}%</span>
                </div>
                <ProgressBar percent={percent} />
              </div>
              {checklistPanel}
            </div>
          </div>
        </aside>
      </div>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70 lg:hidden" onClick={() => setSheetOpen(false)}>
          <div
            className="max-h-[80vh] w-full space-y-3 overflow-y-auto rounded-t-2xl border-t border-white/15 bg-[color:var(--color-navy,#0b1220)] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">Review Checklist</h3>
              <button className="btn-ghost" onClick={() => setSheetOpen(false)} aria-label="Close checklist">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              {done} of {total} checks completed
            </p>
            <ProgressBar percent={percent} />
            {checklistPanel}
          </div>
        </div>
      )}
    </section>
  );
}

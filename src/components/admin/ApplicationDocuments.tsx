import { useCallback, useEffect, useState } from "react";
import { Download, Eye, FileText, RefreshCw, ShieldCheck, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";

type DocRow = {
  id: string;
  kind: "logo" | "insurance" | "qualification" | "other";
  path: string;
  original_name: string | null;
  created_at: string;
};

type ViewerDoc = { name: string; url: string; path: string; kind: "image" | "pdf" | "other" };

const NOT_PROVIDED = "Not provided";

function fileName(doc: DocRow) {
  return doc.original_name?.trim() || doc.path.split("/").pop() || "Document";
}

function extOf(name: string) {
  return (name.split(".").pop() || "").toLowerCase();
}

function previewKind(name: string): ViewerDoc["kind"] {
  const ext = extOf(name);
  if (["png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "svg"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  return "other";
}

async function signed(path: string, download?: string) {
  const { data, error } = await supabase.storage
    .from("contractor-files")
    .createSignedUrl(path, 60 * 10, download ? { download } : undefined);
  if (error || !data?.signedUrl) throw error ?? new Error("No signed URL");
  return data.signedUrl;
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  const text = value && value.trim().length > 0 ? value : NOT_PROVIDED;
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="break-words text-sm">{text}</p>
    </div>
  );
}

function DocumentCard({
  title,
  doc,
  extra,
  onView,
}: {
  title: string;
  doc: DocRow;
  extra?: React.ReactNode;
  onView: (doc: DocRow) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = fileName(doc);

  const download = async () => {
    setBusy(true);
    setError(null);
    try {
      const url = await signed(doc.path, name);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setError("This document could not be opened.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="flex items-start gap-2">
        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="min-w-0 break-words font-medium">{title}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Row label="Document name" value={name} />
        <Row label="Upload date" value={new Date(doc.created_at).toLocaleDateString()} />
        {extra}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button className="btn-gold" onClick={() => onView(doc)}>
          <Eye className="h-4 w-4" /> View Document
        </button>
        <button className="btn-ghost" onClick={() => void download()} disabled={busy}>
          <Download className="h-4 w-4" /> Download Document
        </button>
      </div>
    </div>
  );
}

function DocumentViewer({ doc, onClose }: { doc: ViewerDoc; onClose: () => void }) {
  const [broken, setBroken] = useState(false);

  const download = async () => {
    try {
      const url = await signed(doc.path, doc.name);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      /* ignore — card-level download surfaces errors */
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Document preview"
    >
      <div className="flex w-full max-w-3xl flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 break-words font-semibold">{doc.name}</p>
          <button className="btn-ghost" onClick={onClose} aria-label="Close document preview">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex min-h-[240px] items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5">
          {doc.kind === "image" && !broken ? (
            <img
              src={doc.url}
              alt={doc.name}
              className="max-h-[65vh] w-full object-contain"
              onError={() => setBroken(true)}
            />
          ) : doc.kind === "pdf" && !broken ? (
            <iframe src={doc.url} title={doc.name} className="h-[65vh] w-full bg-white" />
          ) : (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Preview unavailable for this file type
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-gold" onClick={() => void download()}>
            <Download className="h-4 w-4" /> Download Document
          </button>
          <button className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function ApplicationDocuments({
  applicationId,
  insuranceStatus,
  insuranceEvidencePath,
  qualifications,
}: {
  applicationId: string;
  insuranceStatus: string | null;
  insuranceEvidencePath: string | null;
  qualifications: string | null;
}) {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [viewer, setViewer] = useState<ViewerDoc | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const { data, error } = await db
        .from("contractor_documents")
        .select("id,kind,path,original_name,created_at")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: true });
      if (error) {
        setFailed(true);
        return;
      }
      setDocs((data as DocRow[]) ?? []);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openViewer = async (doc: DocRow) => {
    const name = fileName(doc);
    setViewerError(null);
    try {
      const url = await signed(doc.path);
      setViewer({ name, url, path: doc.path, kind: previewKind(name) });
    } catch {
      setViewerError(`“${name}” could not be opened. Other documents are unaffected.`);
    }
  };

  const insuranceDocs = docs.filter((d) => d.kind === "insurance");
  const qualificationDocs = docs.filter((d) => d.kind === "qualification");
  const hasQualificationText = !!qualifications && qualifications.trim().length > 0;

  const legacyInsurance: DocRow | null =
    insuranceDocs.length === 0 && insuranceEvidencePath
      ? {
          id: "legacy-insurance",
          kind: "insurance",
          path: insuranceEvidencePath,
          original_name: insuranceEvidencePath.split("/").pop() ?? null,
          created_at: new Date().toISOString(),
        }
      : null;

  const insuranceList = legacyInsurance ? [legacyInsurance] : insuranceDocs;

  return (
    <section className="card-panel space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">Supporting Documents</h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-white/10" />
          ))}
        </div>
      ) : failed ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Documents could not be loaded</p>
          <button className="btn-gold" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {viewerError && <p className="text-xs text-destructive">{viewerError}</p>}

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-primary">Insurance Documents</h3>
            {insuranceList.length === 0 ? (
              <p className="text-sm italic text-muted-foreground">
                No insurance document uploaded
              </p>
            ) : (
              insuranceList.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  title="Public liability insurance"
                  doc={doc}
                  onView={(d) => void openViewer(d)}
                  extra={
                    <>
                      <Row label="Document type" value="Insurance evidence" />
                      <Row label="Insurance status" value={insuranceStatus} />
                      <Row label="Insurance expiry date" value={null} />
                    </>
                  }
                />
              ))
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-primary">
              Qualifications and Certifications
            </h3>
            {!hasQualificationText && qualificationDocs.length === 0 ? (
              <p className="text-sm italic text-muted-foreground">No qualifications provided</p>
            ) : qualificationDocs.length === 0 ? (
              <div className="space-y-2">
                <Row label="Qualifications provided" value={qualifications} />
                <p className="text-sm italic text-muted-foreground">
                  Qualification document not uploaded
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {hasQualificationText && (
                  <Row label="Qualifications provided" value={qualifications} />
                )}
                {qualificationDocs.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    title={fileName(doc)}
                    doc={doc}
                    onView={(d) => void openViewer(d)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {viewer && <DocumentViewer doc={viewer} onClose={() => setViewer(null)} />}
    </section>
  );
}

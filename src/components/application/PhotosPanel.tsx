import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff, X } from "lucide-react";
import { db } from "@/lib/db";
import { getSignedUrl } from "@/lib/application-helpers";

type GalleryImage = { id: string; url: string | null };

function MediaFallback({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center">
      <ImageOff className="h-5 w-5 text-muted-foreground" />
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function SafeImage({
  url,
  alt,
  className,
}: {
  url: string | null;
  alt: string;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  if (!url || broken) return <MediaFallback label="Image unavailable" />;
  return (
    <img src={url} alt={alt} loading="lazy" className={className} onError={() => setBroken(true)} />
  );
}

function PhotoViewer({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  images: GalleryImage[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Work photo preview"
    >
      <div className="flex w-full max-w-2xl flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {index + 1} of {images.length}
          </span>
          <button className="btn-ghost" onClick={onClose} aria-label="Close photo preview">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative flex min-h-[240px] items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5">
          <SafeImage
            url={images[index]?.url ?? null}
            alt={`Previous work photo ${index + 1}`}
            className="max-h-[65vh] w-full object-contain"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <button className="btn-ghost" onClick={onPrev} disabled={images.length < 2} aria-label="Previous photo">
            <ChevronLeft className="h-5 w-5" /> Previous
          </button>
          <button className="btn-ghost" onClick={onNext} disabled={images.length < 2} aria-label="Next photo">
            Next <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <button className="btn-gold w-full justify-center" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export function useGallery(applicationId: string, logoPath: string | null) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!applicationId) return;
    setLoading(true);
    try {
      const { data } = await db
        .from("contractor_gallery")
        .select("id,path,created_at")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: true });
      const rows = (data as { id: string; path: string }[]) ?? [];
      const [logo, urls] = await Promise.all([
        logoPath ? getSignedUrl(logoPath).catch(() => null) : Promise.resolve(null),
        Promise.all(rows.map(async (g) => ({ id: g.id, url: await getSignedUrl(g.path).catch(() => null) }))),
      ]);
      setLogoUrl(logo);
      setGallery(urls);
    } finally {
      setLoading(false);
    }
  }, [applicationId, logoPath]);

  useEffect(() => {
    void load();
  }, [load]);

  return { logoUrl, gallery, loading };
}

export function PhotosPanel({
  heading,
  logoPath,
  logoUrl,
  gallery,
  loading,
  footer,
}: {
  heading: string;
  logoPath: string | null;
  logoUrl: string | null;
  gallery: GalleryImage[];
  loading: boolean;
  footer?: React.ReactNode;
}) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <section className="card-panel space-y-3">
        <h2 className="font-semibold">Business Logo</h2>
        {loading ? (
          <div className="h-40 w-full max-w-xs animate-pulse rounded-lg bg-white/10" />
        ) : !logoPath ? (
          <p className="text-sm italic text-muted-foreground">No business logo uploaded</p>
        ) : (
          <div className="flex h-40 w-full max-w-xs items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5 p-3">
            <SafeImage url={logoUrl} alt={`${heading} logo`} className="max-h-full max-w-full object-contain" />
          </div>
        )}
      </section>

      <section className="card-panel space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Previous Work</h2>
          {!loading && gallery.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {gallery.length} photo{gallery.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-square animate-pulse rounded-lg bg-white/10" />
            ))}
          </div>
        ) : gallery.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">No previous work photos uploaded</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {gallery.map((g, i) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setViewerIndex(i)}
                className="aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/5"
                aria-label={`View work photo ${i + 1}`}
              >
                <SafeImage url={g.url} alt={`Previous work photo ${i + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
        {footer}
      </section>

      {viewerIndex !== null && gallery.length > 0 && (
        <PhotoViewer
          images={gallery}
          index={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onPrev={() => setViewerIndex((v) => ((v ?? 0) - 1 + gallery.length) % gallery.length)}
          onNext={() => setViewerIndex((v) => ((v ?? 0) + 1) % gallery.length)}
        />
      )}
    </div>
  );
}

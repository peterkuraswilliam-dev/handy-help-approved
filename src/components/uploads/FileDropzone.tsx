import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import { describeTypes, formatBytes, validateFile } from "@/lib/file-validation";

export function FileDropzone({
  accept,
  allowedTypes,
  maxBytes,
  disabled = false,
  hint,
  onFile,
}: {
  accept: string;
  allowedTypes: string[];
  maxBytes: number;
  disabled?: boolean;
  hint?: string;
  onFile: (file: File) => Promise<void> | void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  async function handle(file: File) {
    if (disabled || busy) return;
    setError(null);
    setDone(null);
    const problem = validateFile(file, allowedTypes, maxBytes);
    if (problem) {
      setError(problem);
      return;
    }
    setCurrent(file.name);
    setBusy(true);
    setProgress(6);
    timer.current = setInterval(() => setProgress((p) => (p < 90 ? p + Math.max(1, (90 - p) / 12) : p)), 180);
    try {
      await onFile(file);
      setProgress(100);
      setDone(file.name);
    } catch {
      setError("That upload did not complete. Please try again.");
    } finally {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
      setBusy(false);
      setTimeout(() => setProgress(0), 600);
    }
  }

  return (
    <div className="space-y-fluid-2xs">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label="Upload a file: drag and drop, or press Enter to browse"
        onClick={() => !disabled && !busy && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled && !busy) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => { e.preventDefault(); if (!disabled && !busy) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handle(file);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-fluid-sm text-center transition-colors ${
          disabled || busy ? "cursor-not-allowed opacity-60" : "hover:border-[color:var(--color-gold)]/70"
        } ${dragging ? "border-[color:var(--color-gold)] bg-[color:var(--color-gold)]/10" : "border-white/20 bg-white/5"}`}
      >
        {busy ? (
          <Loader2 className="h-6 w-6 animate-spin text-[color:var(--color-gold)]" />
        ) : (
          <UploadCloud className="h-6 w-6 text-[color:var(--color-gold)]" />
        )}
        <p className="text-sm font-medium">
          {busy ? `Uploading ${current}…` : "Drag and drop a file here, or tap to browse"}
        </p>
        <p className="text-xs text-muted-foreground">
          {hint ?? `${describeTypes(allowedTypes)} · up to ${formatBytes(maxBytes)}`}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void handle(f);
          }}
        />
      </div>

      {progress > 0 && (
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Upload progress"
        >
          <div
            className="h-full rounded-full bg-[color:var(--color-gold)] transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && (
        <p className="flex items-start gap-1.5 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
      {done && !busy && !error && (
        <p className="flex items-start gap-1.5 text-xs text-emerald-400">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> “{done}” uploaded.
        </p>
      )}
    </div>
  );
}

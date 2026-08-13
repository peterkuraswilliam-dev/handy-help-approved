export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10 MB

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
export const DOCUMENT_TYPES = [...IMAGE_TYPES, "application/pdf"];

const EXTENSIONS: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/gif": ["gif"],
  "image/avif": ["avif"],
  "application/pdf": ["pdf"],
};

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function describeTypes(types: string[]): string {
  const exts = types.flatMap((t) => EXTENSIONS[t] ?? []).map((e) => e.toUpperCase());
  return Array.from(new Set(exts)).join(", ");
}

/** Returns an error message, or null when the file is acceptable. */
export function validateFile(file: File, allowed: string[], maxBytes: number): string | null {
  if (file.size === 0) return "That file appears to be empty. Please choose another file.";
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const typeOk =
    allowed.includes(file.type) ||
    (!file.type && allowed.some((t) => (EXTENSIONS[t] ?? []).includes(ext)));
  if (!typeOk) {
    return `“${file.name}” is not a supported file type. Please upload ${describeTypes(allowed)}.`;
  }
  if (file.size > maxBytes) {
    return `“${file.name}” is ${formatBytes(file.size)}. The maximum size is ${formatBytes(maxBytes)}.`;
  }
  return null;
}

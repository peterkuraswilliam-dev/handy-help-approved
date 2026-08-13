/** Human-readable, specific messages for upload failures. */

export const MAX_UPLOAD_ATTEMPTS = 3;

function messageOf(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const anyErr = error as { message?: unknown; error?: unknown; statusCode?: unknown };
    if (typeof anyErr.message === "string" && anyErr.message.trim()) return anyErr.message;
    if (typeof anyErr.error === "string" && anyErr.error.trim()) return anyErr.error;
  }
  return "";
}

/** True when another attempt has a realistic chance of succeeding. */
export function isRetryableUploadError(error: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const raw = messageOf(error).toLowerCase();
  if (!raw) return true;
  const permanent = [
    "payload too large",
    "exceeded the maximum",
    "invalid mime",
    "mime type",
    "not allowed",
    "unauthorized",
    "permission",
    "row-level security",
    "duplicate",
    "already exists",
    "400",
    "401",
    "403",
    "409",
    "413",
    "415",
  ];
  return !permanent.some((p) => raw.includes(p));
}

export function describeUploadError(error: unknown, fileName: string, attempts: number): string {
  const raw = messageOf(error);
  const lower = raw.toLowerCase();
  const tried = attempts > 1 ? ` after ${attempts} attempts` : "";

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return `“${fileName}” could not be uploaded${tried} because your device is offline. Reconnect and try again.`;
  }
  if (lower.includes("payload too large") || lower.includes("413") || lower.includes("exceeded the maximum")) {
    return `“${fileName}” was rejected by the server because it is too large. Please upload a smaller file.`;
  }
  if (lower.includes("mime") || lower.includes("415")) {
    return `“${fileName}” was rejected because that file type is not accepted for this upload.`;
  }
  if (lower.includes("unauthorized") || lower.includes("permission") || lower.includes("row-level security") || lower.includes("401") || lower.includes("403")) {
    return `You do not have permission to upload “${fileName}”. Please sign in again and retry.`;
  }
  if (lower.includes("already exists") || lower.includes("duplicate")) {
    return `A file named “${fileName}” already exists. Rename the file and try again.`;
  }
  if (lower.includes("timeout") || lower.includes("aborted")) {
    return `Uploading “${fileName}” timed out${tried}. Check your connection and try again.`;
  }
  if (lower.includes("failed to fetch") || lower.includes("network")) {
    return `“${fileName}” could not be uploaded${tried} because the connection dropped. Check your connection and try again.`;
  }
  return raw
    ? `“${fileName}” could not be uploaded${tried}: ${raw}`
    : `“${fileName}” could not be uploaded${tried}. Please try again.`;
}

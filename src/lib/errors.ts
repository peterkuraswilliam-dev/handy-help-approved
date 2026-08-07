/**
 * Converts any backend/database error into a safe, human-readable message.
 * Raw database errors, SQL text, internal IDs and stack traces are never
 * shown to users — they are logged to the console for developers instead.
 */

type MaybeError = unknown;

const PERMISSION = "You do not have permission to do this.";
const NOT_FOUND = "We could not find that record. It may have been removed.";
const DUPLICATE = "That has already been done — please refresh the page.";
const OFFLINE = "We could not reach the server. Please check your connection and try again.";
const GENERIC = "Something went wrong. Please try again.";

function codeOf(err: MaybeError): string {
  const e = err as { code?: unknown; status?: unknown } | null;
  if (!e || typeof e !== "object") return "";
  return String(e.code ?? e.status ?? "");
}

function textOf(err: MaybeError): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  const e = err as { message?: unknown };
  return typeof e.message === "string" ? e.message : "";
}

export function friendlyMessage(err: MaybeError, fallback = GENERIC): string {
  const code = codeOf(err);
  const raw = textOf(err);
  const lower = raw.toLowerCase();

  if (import.meta.env.DEV && err) console.error("[handled error]", err);

  // Permission / row level security
  if (
    code === "42501" ||
    code === "401" ||
    code === "403" ||
    lower.includes("row-level security") ||
    lower.includes("row level security") ||
    lower.includes("permission denied") ||
    lower.includes("unauthorized") ||
    lower.includes("not allowed") ||
    lower.includes("only administrators")
  ) {
    // Messages we raise ourselves are already safe and specific.
    if (lower.includes("only administrators") || lower.includes("status change is not allowed")) {
      return raw;
    }
    return PERMISSION;
  }

  // Missing rows
  if (code === "PGRST116" || code === "404" || lower.includes("not found")) return NOT_FOUND;

  // Duplicates / conflicts
  if (code === "23505" || code === "409" || lower.includes("duplicate key")) return DUPLICATE;

  // Foreign key / invalid reference
  if (code === "23503" || code === "23502") return "Some required information is missing.";

  // Expired or invalid signed file links
  if (lower.includes("expired") && (lower.includes("url") || lower.includes("token"))) {
    return "That file link has expired. Please reload the page to view it again.";
  }

  // Network
  if (lower.includes("failed to fetch") || lower.includes("networkerror") || lower.includes("load failed")) {
    return OFFLINE;
  }

  // Auth messages from Supabase are already user-safe and useful.
  if (
    lower.includes("invalid login credentials") ||
    lower.includes("email not confirmed") ||
    lower.includes("password") ||
    lower.includes("already registered")
  ) {
    return raw;
  }

  return fallback;
}

export const ERROR_TEXT = { PERMISSION, NOT_FOUND, DUPLICATE, OFFLINE, GENERIC };

export const UPLOAD_FAILED = "That file could not be uploaded. Please check the file and try again.";

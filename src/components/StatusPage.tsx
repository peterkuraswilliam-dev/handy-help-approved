import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * Production-ready message screen used for every "something isn't available"
 * state: not found, access denied, session expired, unexpected error.
 * Never renders raw errors or stack traces.
 */
export function StatusPage({
  code,
  title,
  message,
  children,
}: {
  code?: string;
  title: string;
  message: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="card-panel w-full max-w-md text-center">
        {code ? (
          <p className="font-display text-5xl font-bold text-[color:var(--color-gold)]">{code}</p>
        ) : null}
        <h1 className="mt-2 text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {children ?? (
            <Link to="/" className="btn-gold">
              Go home
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

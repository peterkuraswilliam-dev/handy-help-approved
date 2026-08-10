import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { friendlyMessage } from "@/lib/errors";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { MainMenu } from "@/components/MainMenu";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { StatusPage } from "@/components/StatusPage";
import { APPROVAL_DISCLAIMER, FREE_NOTICE, SHOW_FREE_NOTICE, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/site-config";

function NotFoundComponent() {
  return (
    <StatusPage
      code="404"
      title="Page not found"
      message="The page you were looking for doesn't exist or has been moved."
    >
      <Link to="/" className="btn-gold">Go home</Link>
      <Link to="/contractors" className="btn-outline">Approved contractors</Link>
    </StatusPage>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "root" }); }, [error]);
  return (
    <StatusPage
      title="Something went wrong"
      message={friendlyMessage(error)}
    >
      <button className="btn-gold" onClick={() => { router.invalidate(); reset(); }}>Try again</button>
      <Link to="/" className="btn-outline">Go home</Link>
    </StatusPage>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: `${SITE_NAME} — ${SITE_TAGLINE}` },
      { name: "description", content: SITE_DESCRIPTION },
      { property: "og:title", content: SITE_NAME },
      { property: "og:description", content: "Join our growing network of approved local contractors across Aberdeenshire." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function Header() {
  const [signedIn, setSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const check = async (uid: string | undefined) => {
      if (!uid) { setIsAdmin(false); return; }
      const { data } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
      setIsAdmin(!!data);
    };
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
      void check(data.session?.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((e, session) => {
      if (e === "SIGNED_IN" || e === "SIGNED_OUT" || e === "USER_UPDATED") {
        setSignedIn(e !== "SIGNED_OUT");
        if (e === "SIGNED_OUT") setIsAdmin(false);
        else void check(session?.user.id);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return (
    <header className="border-b border-border/60 sticky top-0 z-30 backdrop-blur bg-[color:var(--color-background)]/85">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-block h-8 w-8 rounded-md bg-[color:var(--color-gold)] text-[color:var(--color-primary-foreground)] font-bold grid place-items-center">H</span>
          <span className="font-display text-lg leading-tight">
            <span className="text-[color:var(--color-gold)]">Handy Help</span>
            <span className="block text-xs text-muted-foreground -mt-0.5">Aberdeenshire</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {signedIn ? (
            <>
              <NotificationBell />
              <MainMenu isAdmin={isAdmin} />
            </>
          ) : (
            <>
              <Link to="/become-approved" className="btn-ghost hidden sm:inline-flex">Become approved</Link>
              <Link to="/community-rules" className="btn-ghost hidden md:inline-flex">Community rules</Link>
              <Link to="/auth" search={{ mode: "signin" }} className="btn-ghost hidden sm:inline-flex">Sign in</Link>
              <Link to="/become-approved" className="btn-gold sm:hidden">Apply</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}


function Banner() {
  if (!SHOW_FREE_NOTICE) return null;
  return (
    <div className="bg-[color:var(--color-gold)] text-[color:var(--color-primary-foreground)] text-center text-sm font-semibold px-3 py-2">
      {FREE_NOTICE}
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 mt-16">
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-4 text-xs text-muted-foreground">
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link to="/contractors" className="hover:text-[color:var(--color-gold)]">Approved contractors</Link>
          <Link to="/become-approved" className="hover:text-[color:var(--color-gold)]">Become approved</Link>
          <Link to="/community-rules" className="hover:text-[color:var(--color-gold)]">Community rules</Link>
          <Link to="/privacy" className="hover:text-[color:var(--color-gold)]">Privacy information</Link>
        </nav>
        <p className="max-w-2xl leading-relaxed">{APPROVAL_DISCLAIMER}</p>
        <p>© {new Date().getFullYear()} {SITE_NAME}</p>
      </div>
    </footer>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Banner />
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-6 min-h-[70vh]">
        <Outlet />
      </main>
      <Footer />
      <Toaster theme="dark" position="top-center" richColors />
    </QueryClientProvider>
  );
}

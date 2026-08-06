import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-bold text-[color:var(--color-gold)]">404</h1>
        <p className="mt-3 text-muted-foreground">This page doesn't exist.</p>
        <Link to="/" className="btn-gold mt-6">Go home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "root" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button className="btn-gold mt-6" onClick={() => { router.invalidate(); reset(); }}>Try again</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Handy Help Aberdeenshire — Approved Contractor Network" },
      { name: "description", content: "Become an Approved Contractor with Handy Help Aberdeenshire. Free while our contractor application platform is being developed." },
      { property: "og:title", content: "Handy Help Aberdeenshire" },
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
          <Link to="/contractors" className="btn-ghost hidden sm:inline-flex">Contractors</Link>
          {signedIn ? (
            <>
              <NotificationBell />
              <MainMenu isAdmin={isAdmin} />
            </>
          ) : (
            <>
              <Link to="/auth" search={{ mode: "signin" }} className="btn-ghost hidden sm:inline-flex">Sign in</Link>
              <Link to="/become-approved" className="btn-gold">Apply</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}


function Banner() {
  return (
    <div className="bg-[color:var(--color-gold)] text-[color:var(--color-primary-foreground)] text-center text-sm font-semibold px-3 py-2">
      Free while the Handy Help Aberdeenshire application is being developed.
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 mt-16">
      <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-muted-foreground flex flex-wrap gap-3 justify-between">
        <span>© {new Date().getFullYear()} Handy Help Aberdeenshire</span>
        <div className="flex gap-4">
          <Link to="/contractors" className="hover:text-[color:var(--color-gold)]">Contractors</Link>
          <Link to="/community-rules" className="hover:text-[color:var(--color-gold)]">Community rules</Link>
          <Link to="/become-approved" className="hover:text-[color:var(--color-gold)]">Become approved</Link>
        </div>
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

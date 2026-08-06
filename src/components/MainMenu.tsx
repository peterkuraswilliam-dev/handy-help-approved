import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Bell, LayoutDashboard, Menu, Repeat, Settings, Shield, Users, X } from "lucide-react";

type Item = { to: string; label: string; icon: typeof Menu };

const MODE_KEY = "hh-menu-mode";

export function MainMenu({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"admin" | "contractor">("admin");
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(MODE_KEY) : null;
    if (saved === "contractor" || saved === "admin") setMode(saved);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const adminView = isAdmin && mode === "admin";

  const items: Item[] = adminView
    ? [
        { to: "/admin", label: "Applications dashboard", icon: LayoutDashboard },
        { to: "/notifications", label: "Notifications", icon: Bell },
        { to: "/admin/roles", label: "Role management", icon: Users },
        { to: "/settings", label: "Settings", icon: Settings },
      ]
    : [
        { to: "/dashboard", label: "My dashboard", icon: LayoutDashboard },
        { to: "/notifications", label: "Notifications", icon: Bell },
        { to: "/contractors", label: "Approved contractors", icon: BadgeCheck },
        { to: "/settings", label: "Settings", icon: Settings },
      ];

  const switchMode = () => {
    const next = mode === "admin" ? "contractor" : "admin";
    setMode(next);
    if (typeof window !== "undefined") window.localStorage.setItem(MODE_KEY, next);
  };





  return (
    <div className="relative">
      <button
        type="button"
        aria-label={open ? "Close main menu" : "Open main menu"}
        aria-expanded={open}
        className="btn-outline inline-flex items-center gap-2"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        <span className="hidden sm:inline">Menu</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            ref={panelRef}
            className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-lg border border-border/60 bg-[color:var(--color-background)] shadow-xl"
          >
            {isAdmin && (
              <div className="border-b border-border/60 px-4 py-3">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3.5 w-3.5" />
                  {adminView ? "Admin menu" : "Contractor menu"}
                </p>
                <button
                  type="button"
                  onClick={switchMode}
                  className="btn-outline mt-2 inline-flex w-full items-center justify-center gap-2 text-xs"
                >
                  <Repeat className="h-3.5 w-3.5" />
                  Switch to {adminView ? "contractor" : "admin"} menu
                </button>
              </div>
            )}
            <nav className="flex flex-col py-1">
              {items.map(({ to, label, icon: Icon }) => (

                <Link
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  activeProps={{ className: "text-[color:var(--color-gold)]" }}
                  className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 truncate">{label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}

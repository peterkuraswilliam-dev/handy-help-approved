import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { FileText, LayoutDashboard, Menu, Settings, Users, X } from "lucide-react";

type Item = { to: string; label: string; icon: typeof Menu };

export function MainMenu({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const items: Item[] = [
    { to: isAdmin ? "/admin" : "/dashboard", label: "Applications dashboard", icon: LayoutDashboard },
    { to: "/settings", label: "Settings", icon: Settings },
  ];
  if (isAdmin) items.splice(1, 0, { to: "/admin/roles", label: "Role management", icon: Users });

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

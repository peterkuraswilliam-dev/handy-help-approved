import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { listUsersWithRoles, setUserAdmin } from "@/lib/admin-roles.functions";

export const Route = createFileRoute("/_authenticated/admin/roles")({
  head: () => ({ meta: [{ title: "Manage Admins — Handy Help Aberdeenshire" }] }),
  component: AdminRoles,
});

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  roles: string[];
};

function AdminRoles() {
  const list = useServerFn(listUsersWithRoles);
  const setAdmin = useServerFn(setUserAdmin);
  const [rows, setRows] = useState<UserRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      const data = await list();
      setRows(data as UserRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
      setRows([]);
    }
  }

  useEffect(() => { void load(); }, []);

  async function toggle(u: UserRow, makeAdmin: boolean) {
    setBusy(u.id);
    try {
      await setAdmin({ data: { userId: u.id, makeAdmin } });
      toast.success(makeAdmin ? "Admin granted" : "Admin removed");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  const filtered = (rows ?? []).filter((u) => {
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return (
      (u.email ?? "").toLowerCase().includes(needle) ||
      (u.full_name ?? "").toLowerCase().includes(needle)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link to="/admin" className="btn-ghost"><ArrowLeft className="h-4 w-4" /> Admin</Link>
        <h1 className="font-display text-2xl text-[color:var(--color-gold)]">Manage Admins</h1>
      </div>

      {error && (
        <div className="card-panel border-destructive/40">
          <p className="text-sm text-destructive-soft">{error}</p>
        </div>
      )}

      <div className="card-panel">
        <input
          placeholder="Search by name or email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="mb-3"
        />

        {rows === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users found.</p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((u) => {
              const isAdmin = u.roles.includes("admin");
              return (
                <li key={u.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{u.full_name || "(no name)"}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {u.roles.length === 0 ? (
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">no roles</span>
                      ) : u.roles.map((r) => (
                        <span
                          key={r}
                          className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${
                            r === "admin"
                              ? "bg-[color:var(--color-gold)] text-[color:var(--color-primary-foreground)]"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >{r}</span>
                      ))}
                    </div>
                  </div>
                  <button
                    disabled={busy === u.id}
                    onClick={() => toggle(u, !isAdmin)}
                    className={isAdmin ? "btn-outline" : "btn-gold"}
                  >
                    {isAdmin ? (
                      <><ShieldOff className="h-4 w-4" /> Remove admin</>
                    ) : (
                      <><ShieldCheck className="h-4 w-4" /> Make admin</>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Only existing admins can grant or remove admin access.
      </p>
    </div>
  );
}

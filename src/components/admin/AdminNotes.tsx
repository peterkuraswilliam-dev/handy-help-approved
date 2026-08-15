import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";

type NoteRow = {
  id: string;
  note: string;
  admin_id: string;
  created_at: string;
  updated_at: string | null;
};

export function AdminNotes({ applicationId }: { applicationId: string }) {
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const { data: userData } = await supabase.auth.getUser();
      setUid(userData.user?.id ?? null);

      const { data, error: err } = await db
        .from("admin_notes")
        .select("id,note,admin_id,created_at,updated_at")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: false });
      if (err) {
        setFailed(true);
        return;
      }
      const rows = (data as NoteRow[]) ?? [];
      setNotes(rows);

      const ids = [...new Set(rows.map((r) => r.admin_id))];
      if (ids.length > 0) {
        const { data: profs } = await db.from("profiles").select("id,full_name,email").in("id", ids);
        const nm: Record<string, string> = {};
        for (const p of (profs as { id: string; full_name: string | null; email: string | null }[]) ?? []) {
          nm[p.id] = p.full_name?.trim() || p.email || "Admin";
        }
        setNames(nm);
      }
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    const text = draft.trim();
    if (!text || !uid) return;
    setBusy(true);
    setError(null);
    const { data, error: err } = await db
      .from("admin_notes")
      .insert({ application_id: applicationId, admin_id: uid, note: text })
      .select("id,note,admin_id,created_at,updated_at")
      .maybeSingle();
    setBusy(false);
    if (err || !data) {
      setError("The note could not be saved. Please try again.");
      return;
    }
    setNotes((prev) => [data as NoteRow, ...prev]);
    setDraft("");
    setAdding(false);
  };

  const saveEdit = async (id: string) => {
    const text = editDraft.trim();
    if (!text) return;
    setBusy(true);
    setError(null);
    const { data, error: err } = await db
      .from("admin_notes")
      .update({ note: text })
      .eq("id", id)
      .select("id,note,admin_id,created_at,updated_at")
      .maybeSingle();
    setBusy(false);
    if (err || !data) {
      setError("The note could not be updated. Please try again.");
      return;
    }
    setNotes((prev) => prev.map((n) => (n.id === id ? (data as NoteRow) : n)));
    setEditingId(null);
    setEditDraft("");
  };

  const remove = async (id: string) => {
    setBusy(true);
    setError(null);
    const { error: err } = await db.from("admin_notes").delete().eq("id", id);
    setBusy(false);
    if (err) {
      setError("The note could not be deleted. Please try again.");
      return;
    }
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setConfirmId(null);
  };

  if (loading) {
    return (
      <section className="card-panel space-y-3">
        <div className="h-5 w-1/3 animate-pulse rounded bg-white/10" />
        {[0, 1].map((i) => (
          <div key={i} className="h-16 w-full animate-pulse rounded bg-white/10" />
        ))}
      </section>
    );
  }

  if (failed) {
    return (
      <section className="card-panel space-y-3">
        <h2 className="font-semibold">Private Admin Notes</h2>
        <p className="text-sm text-muted-foreground">Private notes could not be loaded.</p>
        <button className="btn-gold w-fit" onClick={() => void load()}>
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </section>
    );
  }

  return (
    <section className="card-panel space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Private Admin Notes</h2>
        {!adding && (
          <button className="btn-gold" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Add Note
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive-soft">{error}</p>
      )}

      {adding && (
        <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
          <textarea
            className="min-h-28 w-full rounded-lg border border-white/10 bg-black/20 p-2 text-sm text-foreground outline-none focus:border-[color:var(--color-gold)]"
            placeholder="Write a private note for other admins…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button className="btn-gold" disabled={!draft.trim() || busy} onClick={() => void save()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save Note
            </button>
            <button
              className="rounded-lg border border-white/15 px-3 py-2 text-sm"
              disabled={busy}
              onClick={() => {
                setAdding(false);
                setDraft("");
                setError(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {notes.length === 0 && !adding ? (
        <p className="text-sm text-muted-foreground">No private admin notes have been added.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => {
            const mine = n.admin_id === uid;
            const edited = n.updated_at && new Date(n.updated_at).getTime() - new Date(n.created_at).getTime() > 1000;
            return (
              <li key={n.id} className="w-full rounded-xl border border-white/10 bg-white/5 p-3">
                {editingId === n.id ? (
                  <div className="space-y-2">
                    <textarea
                      className="min-h-24 w-full rounded-lg border border-white/10 bg-black/20 p-2 text-sm text-foreground outline-none focus:border-[color:var(--color-gold)]"
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button className="btn-gold" disabled={!editDraft.trim() || busy} onClick={() => void saveEdit(n.id)}>
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save Note
                      </button>
                      <button
                        className="rounded-lg border border-white/15 px-3 py-2 text-sm"
                        disabled={busy}
                        onClick={() => {
                          setEditingId(null);
                          setEditDraft("");
                          setError(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap break-words text-sm">{n.note}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {names[n.admin_id] ?? "Admin"} · {new Date(n.created_at).toLocaleString()}
                      {edited ? ` · edited ${new Date(n.updated_at as string).toLocaleString()}` : ""}
                    </p>
                    {mine && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs"
                          onClick={() => {
                            setEditingId(n.id);
                            setEditDraft(n.note);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs text-destructive-soft"
                          onClick={() => setConfirmId(n.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    )}
                    {confirmId === n.id && (
                      <div className="mt-2 space-y-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2">
                        <p className="text-xs text-destructive-soft">Delete this private note? This cannot be undone.</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="inline-flex items-center gap-1.5 rounded-lg bg-destructive/80 px-3 py-1.5 text-xs font-medium text-white"
                            disabled={busy}
                            onClick={() => void remove(n.id)}
                          >
                            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Delete Note
                          </button>
                          <button
                            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs"
                            disabled={busy}
                            onClick={() => setConfirmId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        These notes are private to admins and are never shown to contractors.
      </p>
    </section>
  );
}

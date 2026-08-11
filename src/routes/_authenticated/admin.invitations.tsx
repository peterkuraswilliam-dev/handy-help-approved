import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Clipboard, MailPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createContractorInvitation,
  listContractorInvitations,
  revokeContractorInvitation,
} from "@/lib/contractor-invitations.functions";

export const Route = createFileRoute("/_authenticated/admin/invitations")({
  head: () => ({ meta: [{ title: "Contractor Invitations — Handy Help Aberdeenshire" }] }),
  component: ContractorInvitations,
});

type Invitation = {
  id: string;
  email: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  revoked_by: string | null;
  accepted_at: string | null;
  accepted_by: string | null;
};

function statusOf(invitation: Invitation) {
  if (invitation.accepted_at) return "Accepted";
  if (invitation.revoked_at) return "Revoked";
  if (new Date(invitation.expires_at).getTime() <= Date.now()) return "Expired";
  return "Pending";
}

function ContractorInvitations() {
  const listInvitations = useServerFn(listContractorInvitations);
  const createInvitation = useServerFn(createContractorInvitation);
  const revokeInvitation = useServerFn(revokeContractorInvitation);
  const [rows, setRows] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [newLink, setNewLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows((await listInvitations()) as Invitation[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load invitations.");
    } finally {
      setLoading(false);
    }
  }, [listInvitations]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNewLink(null);
    try {
      const invitation = await createInvitation({ data: { email } });
      const link = `${window.location.origin}/invite/${invitation.token}`;
      setNewLink(link);
      setEmail("");
      toast.success("Invitation created. Copy the link now—it cannot be shown again.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create invitation.");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!newLink) return;
    try {
      await navigator.clipboard.writeText(newLink);
      toast.success("Invitation link copied.");
    } catch {
      toast.error("Copy failed. Select and copy the link manually.");
    }
  }

  async function revoke(invitationId: string) {
    setBusy(true);
    try {
      await revokeInvitation({ data: { invitationId } });
      toast.success("Invitation revoked.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not revoke invitation.");
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shell-prose space-y-6">
      <Link to="/admin" className="btn-ghost -ml-2 inline-flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" /> Admin dashboard
      </Link>
      <header>
        <h1 className="text-3xl font-bold">Contractor invitations</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Invitations are email-bound, single-use and expire after seven days. You may have up to 20
          pending invitations.
        </p>
      </header>

      <form onSubmit={submit} className="card-panel space-y-3">
        <label htmlFor="invitation-email">Contractor email</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="invitation-email"
            type="email"
            autoComplete="email"
            required
            maxLength={255}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="flex-1"
          />
          <button
            className="btn-gold inline-flex items-center justify-center gap-2"
            disabled={busy}
          >
            <MailPlus className="h-4 w-4" /> Create invitation
          </button>
        </div>
      </form>

      {newLink && (
        <section
          className="card-panel space-y-3 border-[color:var(--color-gold)]"
          aria-live="polite"
        >
          <h2 className="font-semibold">Copy this link now</h2>
          <p className="break-all rounded bg-secondary p-3 font-mono text-xs">{newLink}</p>
          <button
            type="button"
            onClick={copyLink}
            className="btn-gold inline-flex items-center gap-2"
          >
            <Clipboard className="h-4 w-4" /> Copy secure link
          </button>
          <p className="text-xs text-muted-foreground">
            Only the token digest is stored, so this link cannot be recovered later.
          </p>
        </section>
      )}

      <section className="card-panel">
        <h2 className="mb-3 text-lg font-semibold">Invitation history</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No invitations yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((invitation) => {
              const status = statusOf(invitation);
              return (
                <li
                  key={invitation.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{invitation.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {status} · created {new Date(invitation.created_at).toLocaleDateString()} ·
                      expires {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  {status === "Pending" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => revoke(invitation.id)}
                      className="btn-outline"
                    >
                      Revoke
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

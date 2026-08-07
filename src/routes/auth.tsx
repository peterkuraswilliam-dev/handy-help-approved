import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { friendlyMessage } from "@/lib/errors";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: (s.mode === "signup" ? "signup" : "signin") as "signin" | "signup",
  }),
  head: () => ({
    meta: [
      { title: "Contractor Sign In — Handy Help Aberdeenshire" },
      { name: "description", content: "Sign in or create a contractor account with Handy Help Aberdeenshire." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().email("Please enter a valid email").max(255);
const passwordSchema = z.string().min(8, "At least 8 characters").max(72);

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const emailOk = emailSchema.safeParse(email);
    if (!emailOk.success) return toast.error(emailOk.error.issues[0].message);
    const passOk = passwordSchema.safeParse(password);
    if (!passOk.success) return toast.error(passOk.error.issues[0].message);
    setLoading(true);
    try {
      if (tab === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin + "/dashboard",
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Account created. You're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      }
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(friendlyMessage(err, "Something went wrong"));
    } finally {
      setLoading(false);
    }
  }

  async function googleSignIn() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      toast.success("Signed in with Google");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(friendlyMessage(err, "Google sign-in failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card-panel">
        <div className="flex mb-4 rounded-md border border-border overflow-hidden">
          <button
            className={`flex-1 py-2 text-sm font-medium ${tab === "signin" ? "bg-[color:var(--color-gold)] text-[color:var(--color-primary-foreground)]" : ""}`}
            onClick={() => setTab("signin")}
          >Sign in</button>
          <button
            className={`flex-1 py-2 text-sm font-medium ${tab === "signup" ? "bg-[color:var(--color-gold)] text-[color:var(--color-primary-foreground)]" : ""}`}
            onClick={() => setTab("signup")}
          >Create account</button>
        </div>

        <button
          type="button"
          onClick={googleSignIn}
          disabled={loading}
          className="w-full mb-3 flex items-center justify-center gap-2 py-2 rounded-md border border-border bg-white text-black font-medium hover:bg-white/90 disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.3-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 16.3 4.5 9.7 8.8 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 43.5c5.2 0 9.8-2 13.3-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.1 2.4-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.1 16.2 43.5 24 43.5z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2c-.4.4 6.6-4.8 6.6-14.7 0-1.2-.1-2.4-.4-3.5z"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-2 my-3 text-xs text-muted-foreground">
          <div className="flex-1 h-px bg-border" /><span>or</span><div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {tab === "signup" && (
            <div>
              <label>Contact name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={100} />
            </div>
          )}
          <div>
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-gold w-full" disabled={loading}>
            {loading ? "Please wait…" : tab === "signup" ? "Create contractor account" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
      toast.error(err instanceof Error ? err.message : "Something went wrong");
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

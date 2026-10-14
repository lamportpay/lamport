import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Lock, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { BrandLogo } from "@/components/site/Layout";
import { supabase } from "@/integrations/supabase/client";
import { getAdminSession } from "@/lib/admin-ops.functions";
import { safeAdminNext } from "@/lib/admin-path";

/**
 * Admin sign-in: its own page, separate from the customer sign-in (/auth).
 * Same Supabase account security; after sign-in the admin role is checked on
 * the server, and a non-admin account is signed straight back out.
 */
export const Route = createFileRoute("/admin/login")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search.next === "string" ? search.next : "/admin",
  }),
  head: () => ({
    meta: [
      { title: "Admin sign in — LamportPay" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLoginPage,
});

const inputClass =
  "mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder:text-white/30 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10";

function AdminLoginPage() {
  const { next } = Route.useSearch();
  const target = useMemo(() => safeAdminNext(next, window.location.origin), [next]);
  const checkSession = useServerFn(getAdminSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resetMode, setResetMode] = useState(false);
  const [codeStep, setCodeStep] = useState(false);
  const [code, setCode] = useState("");

  async function sendCode() {
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/admin/login?next=${encodeURIComponent(target)}`,
      },
    });
    if (otpError) {
      setError("Could not send the verification code. Please wait a minute and try again.");
      return false;
    }
    setMessage(`We emailed a verification code to ${email.trim()}. Enter it below.`);
    return true;
  }

  async function finishAdmin() {
    try {
      const session = await checkSession();
      if (session.isAdmin) {
        window.location.assign(target);
        return;
      }
      await supabase.auth.signOut();
      setError("This account does not have admin access.");
    } catch {
      await supabase.auth.signOut();
      setError("Could not check admin access. Please try again.");
    }
    setBusy(false);
  }

  // Already signed in as an admin: go straight in.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active || !data.session) return;
      try {
        const session = await checkSession();
        if (active && session.isAdmin) window.location.assign(target);
      } catch {
        /* stay on the sign-in form */
      }
    });
    return () => {
      active = false;
    };
  }, [checkSession, target]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    if (resetMode) {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset`,
      });
      setBusy(false);
      if (resetError) {
        setError("Could not send the reset email. Please try again in a few minutes.");
        return;
      }
      setMessage(
        "If an account exists for that email, a password reset link is on its way. Check your inbox and spam folder.",
      );
      return;
    }
    if (codeStep) {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "email",
      });
      if (verifyError) {
        setBusy(false);
        setError("That code is wrong or has expired. Request a new one.");
        return;
      }
      await finishAdmin();
      return;
    }
    const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (result.error || !result.data.session) {
      setBusy(false);
      setError("Email or password is incorrect.");
      return;
    }
    // Password is correct: confirm admin role, then require an emailed code.
    let isAdmin = false;
    try {
      isAdmin = (await checkSession()).isAdmin;
    } catch {
      /* handled below */
    }
    await supabase.auth.signOut();
    if (!isAdmin) {
      setBusy(false);
      setError("This account does not have admin access.");
      return;
    }
    if (await sendCode()) setCodeStep(true);
    setBusy(false);
  }

  return (
    <main className="min-h-screen bg-[#0b0d17] text-white">
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5 py-12">
        <div className="flex items-center gap-3">
          <BrandLogo className="h-7 brightness-0 invert" />
          <span className="rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white/70">
            Admin
          </span>
        </div>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Operations console
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            {resetMode ? "Reset admin password" : "Admin sign in"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-white/60">
            {resetMode
              ? "Enter your admin email and we'll send you a link to choose a new password."
              : "For LamportPay staff only. Every admin action is recorded in the audit log."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-white/80">
              Work email
              <input
                required
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
              />
            </label>
            {codeStep && (
              <label className="block text-sm font-medium text-white/80">
                Verification code
                <input
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6,8}"
                  maxLength={8}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                  className={`${inputClass} tracking-[0.4em]`}
                  placeholder="123456"
                />
                <span className="mt-1 block text-xs text-white/40">
                  Or click the sign-in link in the same email.
                </span>
              </label>
            )}
            {!resetMode && !codeStep && (
              <label className="block text-sm font-medium text-white/80">
                Password
                <input
                  required
                  type="password"
                  minLength={6}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={inputClass}
                />
              </label>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
              >
                {error}
              </p>
            )}
            {message && (
              <p
                role="status"
                className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 font-semibold text-[#0b0d17] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Lock className="h-4 w-4" />
              {busy
                ? "Checking…"
                : resetMode
                  ? "Send reset link"
                  : codeStep
                    ? "Verify code"
                    : "Sign in to admin"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (codeStep) {
                  setCodeStep(false);
                  setCode("");
                  setPassword("");
                  setError(null);
                  setMessage(null);
                  return;
                }
                setResetMode((value) => !value);
                setError(null);
                setMessage(null);
              }}
              className="w-full text-center text-sm text-white/60 hover:text-white"
            >
              {resetMode || codeStep ? "Back to admin sign in" : "Forgot password?"}
            </button>
          </form>
        </section>

        <p className="mt-6 text-center text-xs text-white/40">
          Not staff?{" "}
          <Link to="/pay" className="text-white/70 hover:text-white">
            Go to the LamportPay app
          </Link>
        </p>
      </div>
    </main>
  );
}

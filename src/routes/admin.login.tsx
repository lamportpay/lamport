import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Lock, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import { BrandLogo } from "@/components/site/Layout";
import { supabase } from "@/integrations/supabase/client";
import { getAdminSession } from "@/lib/admin-ops.functions";
import { safeAdminNext } from "@/lib/admin-path";

/**
 * Admin sign-in: its own page, separate from the customer sign-in (/auth).
 * Two factors: the account password, then a code from an authenticator app
 * (TOTP, Supabase MFA). Admin rights need the second factor: the server and the
 * database only treat a session as admin once it reaches assurance level aal2.
 * A first sign-in without an authenticator sets one up here (QR code).
 * A non-admin account is signed straight back out.
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

type Step = "password" | "reset" | "mfa-verify" | "mfa-enroll";
type Enrollment = { factorId: string; qrCode: string; secret: string };

function AdminLoginPage() {
  const { next } = Route.useSearch();
  const target = useMemo(() => safeAdminNext(next, window.location.origin), [next]);
  const checkSession = useServerFn(getAdminSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("password");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");

  /** Admin account signed in with its password: ask for (or set up) the authenticator code. */
  const startMfa = useCallback(async () => {
    const { data, error: listError } = await supabase.auth.mfa.listFactors();
    if (listError) {
      await supabase.auth.signOut();
      setError("Could not start the authenticator step. Please try again.");
      return;
    }
    const verified = data.totp[0];
    if (verified) {
      setFactorId(verified.id);
      setStep("mfa-verify");
      return;
    }
    // Leftovers from an unfinished setup would block a new one.
    for (const factor of data.all) {
      if (factor.factor_type === "totp" && factor.status === "unverified") {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }
    }
    const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `LamportPay admin ${new Date().toISOString().slice(0, 10)}`,
      issuer: "LamportPay Admin",
    });
    if (enrollError || !enrolled) {
      await supabase.auth.signOut();
      setError("Could not set up the authenticator. Please try again.");
      return;
    }
    setFactorId(enrolled.id);
    setEnrollment({
      factorId: enrolled.id,
      qrCode: enrolled.totp.qr_code,
      secret: enrolled.totp.secret,
    });
    setStep("mfa-enroll");
  }, []);

  async function signOutWithError(text: string) {
    await supabase.auth.signOut();
    setStep("password");
    setPassword("");
    setCode("");
    setError(text);
  }

  // Already signed in: go straight in, or continue with the authenticator step.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active || !data.session) return;
      try {
        const session = await checkSession();
        if (!active) return;
        if (session.isAdmin) window.location.assign(target);
        else if (session.mfaRequired) await startMfa();
      } catch {
        /* stay on the sign-in form */
      }
    });
    return () => {
      active = false;
    };
  }, [checkSession, target, startMfa]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (step === "reset") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth/reset`,
        });
        if (resetError) {
          setError("Could not send the reset email. Please try again in a few minutes.");
          return;
        }
        setMessage(
          "If an account exists for that email, a password reset link is on its way. Check your inbox and spam folder.",
        );
        return;
      }
      if (step === "mfa-verify" || step === "mfa-enroll") {
        if (!factorId) return;
        const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
          factorId,
          code: code.trim(),
        });
        if (verifyError) {
          setError("That code is wrong or has expired. Enter the current code from the app.");
          return;
        }
        const session = await checkSession();
        if (session.isAdmin) {
          window.location.assign(target);
          return;
        }
        await signOutWithError("This account does not have admin access.");
        return;
      }
      const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error || !result.data.session) {
        setError("Email or password is incorrect.");
        return;
      }
      const session = await checkSession();
      if (session.isAdmin) {
        window.location.assign(target);
        return;
      }
      if (!session.mfaRequired) {
        await signOutWithError("This account does not have admin access.");
        return;
      }
      await startMfa();
    } catch {
      await signOutWithError("Could not check admin access. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const mfaStep = step === "mfa-verify" || step === "mfa-enroll";
  const title =
    step === "reset"
      ? "Reset admin password"
      : step === "mfa-enroll"
        ? "Set up your authenticator"
        : step === "mfa-verify"
          ? "Authenticator code"
          : "Admin sign in";
  const intro =
    step === "reset"
      ? "Enter your admin email and we'll send you a link to choose a new password."
      : step === "mfa-enroll"
        ? "Admin access needs a second step. Scan this code with an authenticator app (for example Google Authenticator, Microsoft Authenticator or 1Password), then enter the 6-digit code it shows."
        : step === "mfa-verify"
          ? "Enter the 6-digit code from your authenticator app."
          : "For LamportPay staff only. Every admin action is recorded in the audit log.";

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
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-white/60">{intro}</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {!mfaStep && (
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
            )}
            {step === "password" && (
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
            {step === "mfa-enroll" && enrollment && (
              <div className="space-y-3">
                <img
                  src={enrollment.qrCode}
                  alt="QR code for your authenticator app"
                  className="mx-auto h-44 w-44 rounded-lg bg-white p-2"
                />
                <p className="text-xs text-white/50">
                  Can't scan? Add this key in the app instead:{" "}
                  <code className="break-all text-white/80">{enrollment.secret}</code>
                </p>
              </div>
            )}
            {mfaStep && (
              <label className="block text-sm font-medium text-white/80">
                6-digit code
                <input
                  required
                  autoFocus
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                  className={`${inputClass} tracking-[0.4em]`}
                  placeholder="123456"
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
                : step === "reset"
                  ? "Send reset link"
                  : mfaStep
                    ? "Verify code"
                    : "Sign in to admin"}
            </button>
            <button
              type="button"
              onClick={async () => {
                setError(null);
                setMessage(null);
                if (mfaStep) {
                  await supabase.auth.signOut();
                  setStep("password");
                  setCode("");
                  setPassword("");
                  setEnrollment(null);
                  return;
                }
                setStep((value) => (value === "reset" ? "password" : "reset"));
              }}
              className="w-full text-center text-sm text-white/60 hover:text-white"
            >
              {step === "password" ? "Forgot password?" : "Back to admin sign in"}
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

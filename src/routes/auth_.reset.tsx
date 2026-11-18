import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

import { supabase } from "@/integrations/supabase/client";
import { PASSWORD_MIN_LENGTH, passwordBreachCount } from "@/lib/password-check";

export const Route = createFileRoute("/auth_/reset")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Choose a new password — LamportPay" },
      {
        name: "description",
        content: "Set a new password for your LamportPay operations account.",
      },
      { property: "og:title", content: "Choose a new password — LamportPay" },
      {
        property: "og:description",
        content: "Complete your LamportPay password reset and regain access to the console.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [breached, setBreached] = useState(false);

  useEffect(() => {
    let active = true;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    setBreached(query.get("reason") === "breached");
    const linkError = hash.get("error_description") ?? query.get("error_description");
    if (linkError) {
      setError(
        "This reset link has expired or was already used. Request a new one from the sign-in page.",
      );
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setReady(Boolean(data.session));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    const breaches = await passwordBreachCount(password);
    if (breaches) {
      setBusy(false);
      setError(
        "This password has appeared in a known data breach, so it is not safe to use. Please choose a different one.",
      );
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
  }

  return (
    <main className="min-h-screen bg-background px-5 py-12 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-md items-center">
        <section className="w-full rounded-3xl border border-border/60 bg-card p-6 shadow-[var(--shadow-soft)] md:p-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            LamportPay account recovery
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Choose a new password.</h1>

          {done ? (
            <div className="mt-6 space-y-4">
              <p role="status" className="rounded-xl border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                Your password has been updated.
              </p>
              <a
                href="/auth"
                className="block w-full rounded-full bg-foreground px-5 py-3 text-center font-semibold text-background transition hover:opacity-90"
              >
                Continue to sign in
              </a>
            </div>
          ) : (
            <>
              {breached && ready && (
                <p
                  role="alert"
                  className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  The password you signed in with has appeared in a known data breach. Choose a new
                  one to keep your account safe.
                </p>
              )}
              {!ready && (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Open this page from the reset link in your email. If the link has expired, request
                  a new one from the sign-in page.
                </p>
              )}
              <form onSubmit={submit} className="mt-6 space-y-4">
                <label className="block text-sm font-medium">
                  New password
                  <input
                    required
                    type="password"
                    minLength={PASSWORD_MIN_LENGTH}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none transition focus:ring-2 focus:ring-ring"
                  />
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">
                    At least {PASSWORD_MIN_LENGTH} characters, with lowercase and uppercase letters
                    and a number.
                  </span>
                </label>
                <label className="block text-sm font-medium">
                  Confirm new password
                  <input
                    required
                    type="password"
                    minLength={PASSWORD_MIN_LENGTH}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none transition focus:ring-2 focus:ring-ring"
                  />
                </label>

                {error && (
                  <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy || !ready}
                  className="w-full rounded-full bg-foreground px-5 py-3 font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? "Updating..." : "Update password"}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

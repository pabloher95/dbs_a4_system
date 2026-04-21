"use client";

import { useState, useTransition } from "react";
import { createClient } from "../lib/supabase-browser";

export function LoginForm() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    const nextEmail = String(formData.get("email") ?? "").trim();
    setEmail(nextEmail);
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const origin = window.location.origin;
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: nextEmail,
        options: {
          emailRedirectTo: `${origin}/api/auth/callback`
        }
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      setMessage("Magic link sent. Use the email to finish login.");
    });
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="glass-panel relative overflow-hidden px-6 py-8 md:px-8 md:py-10">
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-frost/30 blur-3xl" />
        <div className="section-kicker">Access</div>
        <h1 className="mt-3 max-w-[9ch] font-display text-5xl leading-[0.92] md:text-6xl">
          Login to the weather desk.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-ink/70">
          Use passwordless email auth. Inside, you can build a personal feed and watch live city comparisons update as new readings arrive.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="metric-tile">
            <div className="text-xs uppercase tracking-[0.24em] text-ink/45">Auth</div>
            <div className="mt-2 font-display text-3xl">OTP</div>
          </div>
          <div className="metric-tile">
            <div className="text-xs uppercase tracking-[0.24em] text-ink/45">Sync</div>
            <div className="mt-2 font-display text-3xl">Live</div>
          </div>
          <div className="rounded-[24px] border border-storm/10 bg-signal/15 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-ink/45">Scope</div>
            <div className="mt-2 font-display text-3xl">Yours</div>
          </div>
        </div>
      </div>
      <div className="glass-panel px-6 py-8 md:px-8 md:py-10">
        <div className="section-kicker">Magic link</div>
        <form action={onSubmit} className="mt-6 grid gap-5">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-ink/80">Email address</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-[20px] border border-storm/10 bg-white/85 px-5 py-4 text-base outline-none transition focus:border-storm/40 focus:ring-4 focus:ring-storm/10"
            required
          />
          </label>
          <button className="action-primary w-full" type="submit" disabled={pending}>
            {pending ? "Sending..." : "Send Magic Link"}
          </button>
          {message ? (
            <div className="rounded-[20px] border border-storm/15 bg-storm/10 px-4 py-3 text-sm text-storm">{message}</div>
          ) : null}
          {error ? <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        </form>
      </div>
    </section>
  );
}

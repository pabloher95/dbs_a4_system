"use client";

import { useTransition } from "react";
import { createClient } from "../lib/supabase-browser";

export function SignOutButton() {
  const supabase = createClient();
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="action-secondary"
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await supabase.auth.signOut();
          window.location.href = "/login";
        });
      }}
    >
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}

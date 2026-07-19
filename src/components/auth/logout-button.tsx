"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { logoutSuccessSchema } from "@/lib/auth/schemas";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logout() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      const body: unknown = await response.json();
      if (!response.ok) {
        setError("Sign out failed safely. Try again.");
        return;
      }
      logoutSuccessSchema.parse(body);
      router.push("/login");
      router.refresh();
    } catch {
      setError("Sign out failed safely. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="session-action">
      <button
        className="session-button"
        type="button"
        onClick={logout}
        disabled={pending}
      >
        <span aria-hidden="true">↗</span>
        {pending ? "Signing out…" : "Sign out"}
      </button>
      {error ? <span className="session-error" role="alert">{error}</span> : null}
    </span>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import {
  DEMO_OPERATOR_EMAIL,
  DEMO_OPERATOR_PASSWORD,
} from "@/lib/auth/demo-access";
import { authErrorSchema, loginSuccessSchema } from "@/lib/auth/schemas";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body: unknown = await response.json();

      if (!response.ok) {
        const failure = authErrorSchema.safeParse(body);
        setError(
          failure.success ? failure.data.error : "Sign in failed safely.",
        );
        return;
      }

      const success = loginSuccessSchema.parse(body);
      router.push(success.redirectTo);
      router.refresh();
    } catch {
      setError("Sign in failed safely. Try again.");
    } finally {
      setPending(false);
    }
  }

  function useDemoCredentials() {
    setEmail(DEMO_OPERATOR_EMAIL);
    setPassword(DEMO_OPERATOR_PASSWORD);
    setError(null);
  }

  return (
    <section className="login-card" aria-labelledby="login-title">
      <div className="login-card-heading">
        <span className="section-kicker">SECURE OPERATOR ACCESS</span>
        <h2 id="login-title">Operator sign in</h2>
        <p>
          Enter the protected workspace without changing the public judge path.
        </p>
      </div>

      <form className="login-form" onSubmit={submitLogin}>
        <label htmlFor="operator-email">Operator email</label>
        <input
          id="operator-email"
          name="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label htmlFor="operator-password">Password</label>
        <input
          id="operator-password"
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={12}
          maxLength={128}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <button
          className="button-primary login-submit"
          type="submit"
          disabled={pending}
        >
          {pending ? "Verifying operator…" : "Sign in to workspace"}
        </button>
      </form>

      <div className="demo-access-box">
        <div>
          <span>JUDGE-SAFE DEMO ACCOUNT</span>
          <p>Public credentials unlock simulation data only.</p>
        </div>
        <button type="button" onClick={useDemoCredentials} disabled={pending}>
          Use demo credentials
        </button>
      </div>

      {error ? <p className="login-error" role="alert">{error}</p> : null}

      <Link className="public-sandbox-link" href="/">
        Open public sandbox
      </Link>
    </section>
  );
}

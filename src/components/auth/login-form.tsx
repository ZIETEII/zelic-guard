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
          failure.success ? failure.data.error : "El acceso falló de forma segura.",
        );
        return;
      }

      const success = loginSuccessSchema.parse(body);
      router.push(success.redirectTo);
      router.refresh();
    } catch {
      setError("El acceso falló de forma segura. Inténtalo de nuevo.");
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
        <span className="section-kicker">ACCESO VERIFICADO</span>
        <h2 id="login-title">Entrar como operador</h2>
        <p>
          Abre el espacio protegido sin alterar el recorrido público del jurado.
        </p>
      </div>

      <form className="login-form" onSubmit={submitLogin}>
        <label htmlFor="operator-email">Correo del operador</label>
        <input
          id="operator-email"
          name="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label htmlFor="operator-password">Contraseña</label>
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

        {/* Única acción primaria de esta pantalla — §7.2 */}
        <button
          className="button-primary login-submit"
          type="submit"
          data-activa="true"
          disabled={pending}
        >
          {pending ? "Verificando operador…" : "Entrar al espacio de operador"}
        </button>
      </form>

      <div className="demo-access-box">
        <div>
          <span>CUENTA DE DEMOSTRACIÓN</span>
          <p>Estas credenciales públicas solo abren datos de simulación.</p>
        </div>
        <button type="button" onClick={useDemoCredentials} disabled={pending}>
          Usar credenciales de demo
        </button>
      </div>

      {error ? <p className="login-error" role="alert">{error}</p> : null}

      <Link className="public-sandbox-link" href="/">
        Abrir el sandbox público
      </Link>
    </section>
  );
}

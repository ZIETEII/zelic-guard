import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { BrandMark } from "@/components/guard/brand-mark";
import { ThemeToggle } from "@/components/guard/theme-toggle";
import { getCurrentOperatorSession } from "@/lib/auth/operator-session.server";

export const metadata: Metadata = {
  title: "Acceso de operador — ZELIC Guard by LogVox",
  description:
    "Acceso verificado al espacio de operador de ZELIC Guard. Prototipo funcional, sin operación real.",
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentOperatorSession()) redirect("/workspace");

  return (
    <main className="login-shell">
      <header className="login-topbar">
        <Link className="login-brand" href="/" aria-label="Sandbox público de ZELIC Guard">
          <BrandMark />
          <span><strong>ZELIC Guard</strong><small>by LogVox</small></span>
        </Link>
        <span className="header-badge estado-producto">
          <span aria-hidden="true" /> PROTOTIPO FUNCIONAL
        </span>
        <ThemeToggle />
      </header>

      <div className="login-layout">
        <section className="login-story" aria-labelledby="login-story-title">
          <p className="overline"><span aria-hidden="true" /> LÍMITE DE IDENTIDAD</p>
          <h1 id="login-story-title">La autoridad empieza por la identidad.</h1>
          <p>
            El sandbox público demuestra la compuerta. El espacio de operador
            demuestra que esa misma autoridad aprobada también vive detrás de
            una sesión verificada.
          </p>
          <ul>
            <li><strong>SCRYPT</strong><span>Verificación de contraseña</span></li>
            <li><strong>HMAC-SHA256</strong><span>Sesión a prueba de manipulación</span></li>
            <li><strong>4 HORAS</strong><span>Acceso de operador acotado</span></li>
          </ul>
        </section>

        <LoginForm />
      </div>

      <p className="login-disclosure">
        La autenticación abre únicamente este espacio de simulación. No existe
        correo, pago, dato real de cliente ni cambio en servicios de terceros.
      </p>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { BrandMark } from "@/components/guard/brand-mark";
import { ThemeToggle } from "@/components/guard/theme-toggle";
import { getCurrentOperatorSession } from "@/lib/auth/operator-session.server";

export const metadata: Metadata = {
  title: "Operator Sign In — ZELIC Guard",
  description: "Secure access to the ZELIC Guard operator simulation workspace.",
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentOperatorSession()) redirect("/workspace");

  return (
    <main className="login-shell">
      <header className="login-topbar">
        <Link className="login-brand" href="/" aria-label="ZELIC Guard public sandbox">
          <BrandMark />
          <span><strong>ZELIC Guard</strong><small>Operator access</small></span>
        </Link>
        <span className="header-badge simulation-badge">
          <span aria-hidden="true" /> SIMULATION ONLY
        </span>
        <ThemeToggle />
      </header>

      <div className="login-layout">
        <section className="login-story" aria-labelledby="login-story-title">
          <p className="overline"><span aria-hidden="true" /> IDENTITY BOUNDARY</p>
          <h1 id="login-story-title">Authority starts with identity.</h1>
          <p>
            The public sandbox proves the guard. The operator workspace proves
            that approved authority can also live behind a verified session.
          </p>
          <ul>
            <li><strong>SCRYPT</strong><span>Password verification</span></li>
            <li><strong>HMAC-SHA256</strong><span>Tamper-evident session</span></li>
            <li><strong>4 HOURS</strong><span>Bounded operator access</span></li>
          </ul>
        </section>

        <LoginForm />
      </div>

      <p className="login-disclosure">
        Authentication unlocks only this simulation workspace. No email,
        payment, private customer data, or third-party mutation exists.
      </p>
    </main>
  );
}

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/components/auth/login-form";
import {
  DEMO_OPERATOR_EMAIL,
  DEMO_OPERATOR_PASSWORD,
} from "@/lib/auth/demo-access";

const router = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

describe("operator login form", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    router.push.mockReset();
    router.refresh.mockReset();
  });

  it("fills the public demo account and creates a server session", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: true, redirectTo: "/workspace" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<LoginForm />);

    expect(
      screen.getByRole("heading", { name: "Entrar como operador" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Abrir el sandbox público" }),
    ).toHaveAttribute("href", "/");

    await user.click(screen.getByRole("button", { name: "Usar credenciales de demo" }));
    expect(screen.getByLabelText("Correo del operador")).toHaveValue(DEMO_OPERATOR_EMAIL);
    expect(screen.getByLabelText("Contraseña")).toHaveValue(DEMO_OPERATOR_PASSWORD);

    await user.click(screen.getByRole("button", { name: "Entrar al espacio de operador" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: DEMO_OPERATOR_EMAIL,
          password: DEMO_OPERATOR_PASSWORD,
        }),
      }),
    );
    expect(router.push).toHaveBeenCalledWith("/workspace");
    expect(router.refresh).toHaveBeenCalledOnce();
  });

  it("shows a generic failure and never claims a session was created", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ error: "Invalid credentials." }),
      }),
    );
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Correo del operador"), "judge@zelic.guard");
    await user.type(screen.getByLabelText("Contraseña"), "Incorrect!2026");
    await user.click(screen.getByRole("button", { name: "Entrar al espacio de operador" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid credentials.",
    );
    expect(router.push).not.toHaveBeenCalled();
  });
});

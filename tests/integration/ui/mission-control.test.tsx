import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MissionControl } from "@/components/guard/mission-control";
import { evaluateExecution } from "@/lib/guard/evaluate-execution";
import { createInvoiceScenarioFixtures } from "@/lib/guard/fixtures";
import { REASON_CODES } from "@/lib/guard/reason-codes";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

function jsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function installGuardApiMock(): ReturnType<typeof vi.fn> {
  const fixtures = createInvoiceScenarioFixtures();
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input);
    const body = JSON.parse(String(init?.body));

    if (path === "/api/compile") {
      return jsonResponse({
        contract: fixtures.proposedContract,
        compiler: {
          mode: "deterministic",
          provider: "seeded",
          model: null,
          fallbackReason: "missing_api_key",
        },
      });
    }

    if (path === "/api/approve") {
      return jsonResponse({ contract: fixtures.approvedContract });
    }

    if (path === "/api/revise") {
      return jsonResponse({
        contract: {
          ...body.contract,
          constraints: {
            ...body.contract.constraints,
            ...body.patch,
          },
          status: "proposed",
          fingerprint: `sha256:${"c".repeat(64)}`,
        },
      });
    }

    if (path === "/api/evaluate") {
      const verdict = evaluateExecution(body);
      return jsonResponse({
        verdict,
        nextHistory:
          verdict.verdict === "ALLOW"
            ? {
                successfulRuns: body.history.successfulRuns + 1,
                consumedExecutionIds: [
                  ...body.history.consumedExecutionIds,
                  body.attempt.executionId,
                ],
              }
            : null,
      });
    }

    throw new Error(`Unexpected request: ${path}`);
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("ZELIC Guard mission control", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("moves from locked intent through approval to ALLOW and recipient DENY", async () => {
    const user = userEvent.setup();
    installGuardApiMock();
    render(<MissionControl />);

    expect(screen.getByRole("textbox", { name: /Intención/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Aprobar contrato" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Ejecución válida" })).toBeDisabled();
    expect(
      screen.getByText("Simulación. No se envía ningún correo ni pago."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Compilar contrato" }));

    expect(await screen.findByText("REQUIERE APROBACIÓN")).toBeInTheDocument();
    expect(screen.getByText("send_invoice")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aprobar contrato" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Aprobar contrato" }));

    expect(await screen.findByText("APROBADO")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ejecución válida" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Ejecución válida" }));

    const allowResult = await screen.findByRole("region", {
      name: "Veredicto de ejecución",
    });
    expect(within(allowResult).getByRole("heading", { name: "PERMITIDO" })).toBeInTheDocument();
    expect(within(allowResult).getByText("ALL_RULES_PASSED")).toBeInTheDocument();
    expect(within(allowResult).getAllByText("PASS")).toHaveLength(10);

    for (const failureCode of REASON_CODES.filter(
      (code) => code !== "ALL_RULES_PASSED",
    )) {
      expect(within(allowResult).queryByText(failureCode)).not.toBeInTheDocument();
    }

    await user.click(screen.getByRole("button", { name: "Destinatario no autorizado" }));

    expect(
      await within(allowResult).findByRole("heading", { name: "PROHIBIDO" }),
    ).toBeInTheDocument();
    expect(
      within(allowResult).getAllByText("RECIPIENT_NOT_ALLOWED").length,
    ).toBeGreaterThan(0);

    const failedRecipientRule = within(allowResult)
      .getByText("Falla: destinatario autorizado")
      .closest("li");
    expect(failedRecipientRule).not.toBeNull();
    expect(
      within(failedRecipientRule as HTMLElement).getByText(
        "RECIPIENT_NOT_ALLOWED",
      ),
    ).toBeInTheDocument();
  });

  it("prefers GPT-5.6 automatically and discloses deterministic fallback", async () => {
    const user = userEvent.setup();
    const fetchMock = installGuardApiMock();
    render(<MissionControl />);

    await user.click(screen.getByRole("button", { name: "Compilar contrato" }));

    const compileRequest = fetchMock.mock.calls.find(
      ([path]) => String(path) === "/api/compile",
    );
    expect(JSON.parse(String(compileRequest?.[1]?.body))).toMatchObject({
      intent: expect.any(String),
      mode: "auto",
    });
    expect(await screen.findByText("Respaldo determinista")).toBeInTheDocument();
    expect(screen.getByText(/OPENAI_API_KEY sin configurar/i)).toBeInTheDocument();
  });

  it("runs the complete adversarial suite and proves one allow with four denials", async () => {
    const user = userEvent.setup();
    installGuardApiMock();
    render(<MissionControl />);

    expect(
      screen.getByRole("button", { name: "Ejecutar la suite completa" }),
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Compilar contrato" }));
    await screen.findByText("REQUIERE APROBACIÓN");
    await user.click(screen.getByRole("button", { name: "Aprobar contrato" }));
    await screen.findByText("APROBADO");
    await user.click(
      screen.getByRole("button", { name: "Ejecutar la suite completa" }),
    );

    const report = await screen.findByRole("region", {
      name: "Informe de la suite",
    });
    expect(within(report).getByText("Suite completa")).toBeInTheDocument();
    expect(within(report).getAllByText("DENY")).toHaveLength(4);
    expect(within(report).getAllByText("ALLOW")).toHaveLength(1);
    expect(screen.getByText("Permitidas 1 · Prohibidas 4")).toBeInTheDocument();
    expect(screen.getByText("Suite: 5/5 límites verificados")).toBeInTheDocument();
  });

  it("labels the resettable audit trail as deterministic evidence", () => {
    render(<MissionControl />);

    expect(screen.getByText("EVIDENCIA DETERMINISTA")).toBeInTheDocument();
    expect(screen.queryByText("EVIDENCIA INMUTABLE")).not.toBeInTheDocument();
  });

  it("reissues edited parameters and clears the previous approval evidence", async () => {
    const user = userEvent.setup();
    const fetchMock = installGuardApiMock();
    render(<MissionControl />);

    await user.click(screen.getByRole("button", { name: "Compilar contrato" }));
    await user.click(await screen.findByRole("button", { name: "Aprobar contrato" }));
    await user.click(await screen.findByRole("button", { name: "Ejecución válida" }));
    expect(await screen.findByText("Permitidas 1 · Prohibidas 0")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Destinatario autorizado"));
    await user.type(screen.getByLabelText("Destinatario autorizado"), "ops@northstar.test");
    await user.clear(screen.getByLabelText("Costo máximo (USD)"));
    await user.type(screen.getByLabelText("Costo máximo (USD)"), "0.5");
    await user.click(
      screen.getByRole("button", { name: "Aplicar cambios y pedir aprobación" }),
    );

    const revisionRequest = fetchMock.mock.calls.find(
      ([path]) => String(path) === "/api/revise",
    );
    expect(JSON.parse(String(revisionRequest?.[1]?.body))).toMatchObject({
      patch: {
        allowedRecipients: ["ops@northstar.test"],
        maxCost: 0.5,
      },
    });
    expect(await screen.findByText("Parámetros de autoridad revisados")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ejecución válida" })).toBeDisabled();
    expect(screen.getByText("Permitidas 0 · Prohibidas 0")).toBeInTheDocument();
  });

  it("presents the server API path and public judge sandbox", () => {
    render(<MissionControl />);

    expect(screen.getByText("SANDBOX PÚBLICO")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Acceso de operador" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(
      screen.getByRole("heading", { name: "Conéctalo en tres peticiones" }),
    ).toBeInTheDocument();
    expect(screen.getByText("POST /api/compile")).toBeInTheDocument();
    expect(screen.getByText("POST /api/approve")).toBeInTheDocument();
    expect(screen.getByText("POST /api/evaluate")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver código" })).toHaveAttribute(
      "href",
      "https://github.com/ZIETEII/zelic-guard",
    );
  });

  it("labels the authenticated operator workspace and exposes sign out", () => {
    render(
      <MissionControl
        access={{ kind: "operator", label: "Build Week Operator" }}
      />,
    );

    expect(screen.getByText("ESPACIO DE OPERADOR")).toBeInTheDocument();
    expect(screen.getByText("Build Week Operator")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeInTheDocument();
    expect(screen.queryByText("SANDBOX PÚBLICO")).not.toBeInTheDocument();
  });

  it("shows cost, replay, expiry, counters, JSON, audit order, and pristine reset", async () => {
    const user = userEvent.setup();
    installGuardApiMock();
    render(<MissionControl />);

    await user.click(screen.getByRole("button", { name: "Compilar contrato" }));
    await screen.findByText("REQUIERE APROBACIÓN");
    await user.click(screen.getByRole("button", { name: "Aprobar contrato" }));
    await screen.findByText("APROBADO");

    await user.click(screen.getByRole("button", { name: "Costo sobre el límite" }));
    expect((await screen.findAllByText("COST_LIMIT_EXCEEDED")).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Reintento de ejecución" }));
    expect((await screen.findAllByText("REPLAY_DETECTED")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("MAX_RUNS_EXCEEDED").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Contrato vencido" }));
    expect((await screen.findAllByText("CONTRACT_EXPIRED")).length).toBeGreaterThan(0);
    expect(screen.getByText("Ventana vencida")).toBeInTheDocument();

    const result = screen.getByRole("region", { name: "Veredicto de ejecución" });
    expect(within(result).getAllByRole("listitem")).toHaveLength(10);
    expect(screen.getByText("Permitidas 0 · Prohibidas 3")).toBeInTheDocument();

    await user.click(screen.getByText("Autoridad en JSON"));
    expect(screen.getByText(/"status": "approved"/)).toBeInTheDocument();
    expect(screen.getByText("Contrato compilado").closest("li")).toHaveTextContent(
      /0001.*Contrato compilado/,
    );
    expect(screen.getByText("Contrato vencido: ejecución prohibida").closest("li")).toHaveTextContent(
      /0005.*Contrato vencido: ejecución prohibida/,
    );

    await user.click(screen.getByRole("button", { name: "Reiniciar laboratorio" }));

    expect(screen.getByText("Ningún contrato compilado.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ejecución válida" })).toBeDisabled();
    expect(screen.getByText("Permitidas 0 · Prohibidas 0")).toBeInTheDocument();
    expect(screen.getByText("Laboratorio reiniciado").closest("li")).toHaveTextContent(
      /0001.*Laboratorio reiniciado/,
    );
  });

  it("reports API errors without claiming an external action occurred", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<MissionControl />);

    await user.click(screen.getByRole("button", { name: "Compilar contrato" }));

    expect(
      await screen.findByText("No se pudo compilar el contrato. Revisa la intención e inténtalo de nuevo."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ejecución válida" })).toBeDisabled();
    expect(screen.queryByText(/email sent|payment sent|message delivered|correo enviado|pago enviado|mensaje entregado/i)).not.toBeInTheDocument();
    expect(
      screen.getByText("Simulación. No se envía ningún correo ni pago."),
    ).toBeInTheDocument();
  });
});

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MissionControl } from "@/components/guard/mission-control";
import { evaluateExecution } from "@/lib/guard/evaluate-execution";
import { createInvoiceScenarioFixtures } from "@/lib/guard/fixtures";
import { REASON_CODES } from "@/lib/guard/reason-codes";

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

    expect(screen.getByRole("textbox", { name: /intent/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Approve contract" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Safe run" })).toBeDisabled();
    expect(
      screen.getByText("Simulation only — no email or payment is sent."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Compile contract" }));

    expect(await screen.findByText("PROPOSED")).toBeInTheDocument();
    expect(screen.getByText("send_invoice")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve contract" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Approve contract" }));

    expect(await screen.findByText("APPROVED")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Safe run" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Safe run" }));

    const allowResult = await screen.findByRole("region", {
      name: "Execution verdict",
    });
    expect(within(allowResult).getByRole("heading", { name: "ALLOW" })).toBeInTheDocument();
    expect(within(allowResult).getByText("ALL_RULES_PASSED")).toBeInTheDocument();
    expect(within(allowResult).getAllByText("PASS")).toHaveLength(10);

    for (const failureCode of REASON_CODES.filter(
      (code) => code !== "ALL_RULES_PASSED",
    )) {
      expect(within(allowResult).queryByText(failureCode)).not.toBeInTheDocument();
    }

    await user.click(screen.getByRole("button", { name: "Recipient drift" }));

    expect(
      await within(allowResult).findByRole("heading", { name: "DENY" }),
    ).toBeInTheDocument();
    expect(
      within(allowResult).getAllByText("RECIPIENT_NOT_ALLOWED").length,
    ).toBeGreaterThan(0);

    const failedRecipientRule = within(allowResult)
      .getByText("Fail: recipient allowed")
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

    await user.click(screen.getByRole("button", { name: "Compile contract" }));

    const compileRequest = fetchMock.mock.calls.find(
      ([path]) => String(path) === "/api/compile",
    );
    expect(JSON.parse(String(compileRequest?.[1]?.body))).toMatchObject({
      intent: expect.any(String),
      mode: "auto",
    });
    expect(await screen.findByText("Deterministic fallback")).toBeInTheDocument();
    expect(screen.getByText(/OPENAI_API_KEY not configured/i)).toBeInTheDocument();
  });

  it("runs the complete adversarial suite and proves one allow with four denials", async () => {
    const user = userEvent.setup();
    installGuardApiMock();
    render(<MissionControl />);

    expect(
      screen.getByRole("button", { name: "Run full threat suite" }),
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Compile contract" }));
    await screen.findByText("PROPOSED");
    await user.click(screen.getByRole("button", { name: "Approve contract" }));
    await screen.findByText("APPROVED");
    await user.click(
      screen.getByRole("button", { name: "Run full threat suite" }),
    );

    const report = await screen.findByRole("region", {
      name: "Threat suite report",
    });
    expect(within(report).getByText("Threat suite complete")).toBeInTheDocument();
    expect(within(report).getAllByText("DENY")).toHaveLength(4);
    expect(within(report).getAllByText("ALLOW")).toHaveLength(1);
    expect(screen.getByText("Allowed 1 · Blocked 4")).toBeInTheDocument();
    expect(screen.getByText("Threat suite: 5/5 boundaries verified")).toBeInTheDocument();
  });

  it("labels the resettable audit trail as deterministic evidence", () => {
    render(<MissionControl />);

    expect(screen.getByText("DETERMINISTIC EVIDENCE")).toBeInTheDocument();
    expect(screen.queryByText("IMMUTABLE EVIDENCE")).not.toBeInTheDocument();
  });

  it("presents the server API path and public judge sandbox", () => {
    render(<MissionControl />);

    expect(screen.getByText("PUBLIC JUDGE SANDBOX")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Integrate in three requests" }),
    ).toBeInTheDocument();
    expect(screen.getByText("POST /api/compile")).toBeInTheDocument();
    expect(screen.getByText("POST /api/approve")).toBeInTheDocument();
    expect(screen.getByText("POST /api/evaluate")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View source" })).toHaveAttribute(
      "href",
      "https://github.com/ZIETEII/zelic-guard",
    );
  });

  it("shows cost, replay, expiry, counters, JSON, audit order, and pristine reset", async () => {
    const user = userEvent.setup();
    installGuardApiMock();
    render(<MissionControl />);

    await user.click(screen.getByRole("button", { name: "Compile contract" }));
    await screen.findByText("PROPOSED");
    await user.click(screen.getByRole("button", { name: "Approve contract" }));
    await screen.findByText("APPROVED");

    await user.click(screen.getByRole("button", { name: "Cost overrun" }));
    expect((await screen.findAllByText("COST_LIMIT_EXCEEDED")).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Replay" }));
    expect((await screen.findAllByText("REPLAY_DETECTED")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("MAX_RUNS_EXCEEDED").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Expired contract" }));
    expect((await screen.findAllByText("CONTRACT_EXPIRED")).length).toBeGreaterThan(0);
    expect(screen.getByText("Expired window")).toBeInTheDocument();

    const result = screen.getByRole("region", { name: "Execution verdict" });
    expect(within(result).getAllByRole("listitem")).toHaveLength(10);
    expect(screen.getByText("Allowed 0 · Blocked 3")).toBeInTheDocument();

    await user.click(screen.getByText("Authority JSON"));
    expect(screen.getByText(/"status": "approved"/)).toBeInTheDocument();
    expect(screen.getByText("Contract compiled").closest("li")).toHaveTextContent(
      /0001.*Contract compiled/,
    );
    expect(screen.getByText("Expired contract blocked").closest("li")).toHaveTextContent(
      /0005.*Expired contract blocked/,
    );

    await user.click(screen.getByRole("button", { name: "Reset Lab" }));

    expect(screen.getByText("No contract compiled.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Safe run" })).toBeDisabled();
    expect(screen.getByText("Allowed 0 · Blocked 0")).toBeInTheDocument();
    expect(screen.getByText("Lab reset").closest("li")).toHaveTextContent(
      /0001.*Lab reset/,
    );
  });

  it("reports API errors without claiming an external action occurred", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<MissionControl />);

    await user.click(screen.getByRole("button", { name: "Compile contract" }));

    expect(
      await screen.findByText("Contract compilation failed. Check the intent and try again."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Safe run" })).toBeDisabled();
    expect(screen.queryByText(/email sent|payment sent|message delivered/i)).not.toBeInTheDocument();
    expect(
      screen.getByText("Simulation only — no email or payment is sent."),
    ).toBeInTheDocument();
  });
});

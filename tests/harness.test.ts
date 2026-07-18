import { describe, expect, it } from "vitest";

describe("Vitest harness", () => {
  it("provides the configured jsdom environment", () => {
    expect(document.body).toBeInTheDocument();
  });
});

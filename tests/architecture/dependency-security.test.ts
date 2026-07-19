// @vitest-environment node

import { createRequire } from "node:module";

import { describe, expect, it } from "vitest";

describe("production dependency security", () => {
  it("resolves Next.js through a PostCSS release containing the XSS fix", () => {
    const requireFromNext = createRequire(require.resolve("next/package.json"));
    const postcss = requireFromNext(
      requireFromNext.resolve("postcss/package.json"),
    ) as { version: string };
    const [major, minor, patch] = postcss.version.split(".").map(Number);

    expect(major * 10_000 + minor * 100 + patch).toBeGreaterThanOrEqual(80_510);
  });
});

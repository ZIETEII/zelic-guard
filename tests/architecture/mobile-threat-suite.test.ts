// @vitest-environment node

import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

describe("mobile threat-suite presentation", () => {
  it("stacks every verdict so the five-result proof stays readable without horizontal scrolling", async () => {
    const css = await readFile(
      new URL("../../src/app/globals.css", import.meta.url),
      "utf8",
    );
    const mobileRules = css.slice(css.indexOf("@media (max-width: 760px)"));

    expect(mobileRules).toMatch(
      /\.suite-report ol\s*\{[^}]*grid-template-columns:\s*1fr;[^}]*overflow-x:\s*visible;/,
    );
    expect(mobileRules).toMatch(
      /\.suite-report li code\s*\{[^}]*white-space:\s*normal;/,
    );
  });
});

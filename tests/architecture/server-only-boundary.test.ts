// @vitest-environment node

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("OpenAI compiler server boundary", () => {
  it("imports the official server-only marker before runtime dependencies", async () => {
    const source = await readFile(
      join(
        process.cwd(),
        "src/lib/guard/openai-compiler.server.ts",
      ),
      "utf8",
    );
    const markerPosition = source.indexOf('import "server-only";');
    const sdkPosition = source.indexOf('import OpenAI from "openai";');

    expect(markerPosition).toBeGreaterThanOrEqual(0);
    expect(markerPosition).toBeLessThan(sdkPosition);
  });
});

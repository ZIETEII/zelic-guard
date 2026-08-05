import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const APPROVED_LOGVOX_BUILD_ASSET_HASHES = {
  // Next.js cannot decode the RGB-only one-size master .ico. This compatible
  // bundle contains the canonical favicon-16/32/48 PNG pixels unchanged.
  "src/app/favicon.ico": "e5e5fe1330cf08d497be7c91d7f67c3a6405b4dc9813678c450692ab306a04b3",
  "src/app/icon.svg": "07113d145e611035ae8496ff0a24c246cea79e9096adf7093a8a5fbe2549cf83",
  "src/app/apple-icon.png": "2b87adfe059285cf1831371e25e6d4296614d413d87e4b065b87fdd4256af385",
} as const;

function sha256(path: string) {
  return createHash("sha256")
    .update(readFileSync(resolve(process.cwd(), path)))
    .digest("hex");
}

describe("LogVox brand assets", () => {
  it.each(Object.entries(APPROVED_LOGVOX_BUILD_ASSET_HASHES))(
    "uses the canonical master for %s",
    (path, expectedHash) => {
      expect(sha256(path)).toBe(expectedHash);
    },
  );
});

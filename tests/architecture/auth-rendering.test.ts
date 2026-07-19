// @vitest-environment node

import { describe, expect, it } from "vitest";

import * as loginPage from "@/app/login/page";
import * as workspacePage from "@/app/workspace/page";

describe("request-time authentication rendering", () => {
  it("never prerenders login or the protected workspace with build-time cookies", () => {
    expect(loginPage.dynamic).toBe("force-dynamic");
    expect(workspacePage.dynamic).toBe("force-dynamic");
  });
});

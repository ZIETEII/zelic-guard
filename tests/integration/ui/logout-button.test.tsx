import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LogoutButton } from "@/components/auth/logout-button";

const router = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

describe("operator logout", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    router.push.mockReset();
    router.refresh.mockReset();
  });

  it("fails visibly without navigating when the logout route is unavailable", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<LogoutButton />);

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Sign out failed safely. Try again.",
    );
    expect(router.push).not.toHaveBeenCalled();
  });
});

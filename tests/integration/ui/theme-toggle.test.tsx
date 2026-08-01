import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { ThemeToggle } from "@/components/guard/theme-toggle";

describe("ThemeToggle", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("switches to the light theme and persists the preference", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(await screen.findByRole("button", { name: "Usar modo claro" }));

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(window.localStorage.getItem("zelic-guard-theme")).toBe("light");
    expect(screen.getByRole("button", { name: "Usar modo oscuro" })).toBeInTheDocument();
  });
});

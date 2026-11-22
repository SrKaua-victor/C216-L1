import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../../src/App";

describe("App", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("alterna entre as seções pela navegação", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("[]", { status: 200 })),
    );
    render(<App />);
    expect(screen.getByRole("heading", { level: 2, name: "Livros" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Empréstimos" }));

    expect(screen.getByRole("heading", { level: 2, name: "Empréstimos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Empréstimos" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "../../src/App";

describe("App", () => {
  it("alterna entre as seções pela navegação", async () => {
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

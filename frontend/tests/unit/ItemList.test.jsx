import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ItemList from "../../src/components/ItemList";

const ITENS = [
  { id: 1, nome: "Caderno", descricao: "Capa dura" },
  { id: 2, nome: "caneta", descricao: "" },
];

describe("ItemList", () => {
  it("mostra o estado vazio quando não há itens", () => {
    render(<ItemList itens={[]} onRemover={vi.fn()} />);
    expect(screen.getByText("Nenhum item cadastrado ainda.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("lista os itens na ordem recebida", () => {
    render(<ItemList itens={ITENS} onRemover={vi.fn()} />);
    const itens = within(screen.getByRole("list", { name: "Itens cadastrados" })).getAllByRole(
      "listitem",
    );
    expect(itens).toHaveLength(2);
    expect(itens[0]).toHaveTextContent("Caderno");
    expect(itens[0]).toHaveTextContent("Capa dura");
    expect(itens[1]).toHaveTextContent("caneta");
    expect(screen.queryByText("Nenhum item cadastrado ainda.")).not.toBeInTheDocument();
  });

  it("não renderiza parágrafo de descrição vazio", () => {
    render(<ItemList itens={[ITENS[1]]} onRemover={vi.fn()} />);
    expect(screen.getByRole("listitem").querySelectorAll("p")).toHaveLength(1);
  });

  it("mostra a inicial do nome em maiúscula", () => {
    render(<ItemList itens={[ITENS[1]]} onRemover={vi.fn()} />);
    expect(screen.getByText("C", { exact: true })).toHaveAttribute("aria-hidden", "true");
  });

  it("identifica cada botão de remover pelo nome do item", () => {
    render(<ItemList itens={ITENS} onRemover={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Remover Caderno" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remover caneta" })).toBeInTheDocument();
  });

  it("chama onRemover com o id do item clicado", () => {
    const onRemover = vi.fn();
    render(<ItemList itens={ITENS} onRemover={onRemover} />);
    fireEvent.click(screen.getByRole("button", { name: "Remover caneta" }));
    expect(onRemover).toHaveBeenCalledOnce();
    expect(onRemover).toHaveBeenCalledWith(2);
  });
});

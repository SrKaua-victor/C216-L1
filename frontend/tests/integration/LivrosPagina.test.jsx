import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import LivrosPagina from "../../src/pages/LivrosPagina";
import { corpoEnviado, simularApi } from "./apiFalsa";

const DOM_CASMURRO = {
  id: 1,
  titulo: "Dom Casmurro",
  autor: "Machado de Assis",
  isbn: "9788535910667",
  ano_publicacao: 1899,
  total_exemplares: 2,
  exemplares_disponiveis: 1,
};

describe("tela de livros", () => {
  it("lista os livros com os exemplares disponíveis e filtra pela busca", async () => {
    simularApi({ "GET /livros": [DOM_CASMURRO], "GET /livros?busca=alencar": [] });
    render(<LivrosPagina />);

    const linha = (await screen.findByRole("cell", { name: "Dom Casmurro" })).closest("tr");
    expect(linha).toHaveTextContent("1 de 2");

    await userEvent.type(screen.getByLabelText("Buscar livros"), "alencar");
    await userEvent.click(screen.getByRole("button", { name: "Buscar" }));
    expect(await screen.findByText("Nenhum livro encontrado.")).toBeInTheDocument();
  });

  it("cadastra um livro e atualiza a lista", async () => {
    const livros = [];
    const api = simularApi({
      "GET /livros": () => [200, livros],
      "POST /livros": (corpo) => {
        livros.push({ id: 1, ...corpo, exemplares_disponiveis: corpo.total_exemplares });
        return [201, livros[0]];
      },
    });
    render(<LivrosPagina />);
    await screen.findByText("Nenhum livro encontrado.");

    await userEvent.type(screen.getByLabelText("Título"), "Dom Casmurro");
    await userEvent.type(screen.getByLabelText("Autor"), "Machado de Assis");
    await userEvent.type(screen.getByLabelText("ISBN"), "978-85-359-1066-7");
    await userEvent.type(screen.getByLabelText("Ano de publicação"), "1899");
    await userEvent.click(screen.getByRole("button", { name: "Cadastrar livro" }));

    expect(await screen.findByRole("status")).toHaveTextContent('Livro "Dom Casmurro" cadastrado.');
    expect(await screen.findByRole("cell", { name: "Dom Casmurro" })).toBeInTheDocument();
    expect(corpoEnviado(api, "POST")).toEqual({
      titulo: "Dom Casmurro",
      autor: "Machado de Assis",
      isbn: "9788535910667",
      ano_publicacao: 1899,
      total_exemplares: 1,
    });
  });

  it("mostra a mensagem do backend ao remover um livro emprestado", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    simularApi({
      "GET /livros": [DOM_CASMURRO],
      "DELETE /livros/1": () => [
        409,
        { detail: "Não é possível remover um livro com empréstimos ativos." },
      ],
    });
    render(<LivrosPagina />);

    await userEvent.click(await screen.findByRole("button", { name: "Remover Dom Casmurro" }));

    expect(window.confirm).toHaveBeenCalledWith('Remover o livro "Dom Casmurro"?');
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não é possível remover um livro com empréstimos ativos.",
    );
  });

  it("permite tentar de novo quando a lista não carrega", async () => {
    let falhar = true;
    simularApi({
      "GET /livros": () => (falhar ? [500, { detail: "Erro interno." }] : [200, [DOM_CASMURRO]]),
    });
    render(<LivrosPagina />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Erro interno.");
    falhar = false;
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByRole("cell", { name: "Dom Casmurro" })).toBeInTheDocument();
  });
});

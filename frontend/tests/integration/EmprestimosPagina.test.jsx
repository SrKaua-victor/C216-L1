import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import EmprestimosPagina from "../../src/pages/EmprestimosPagina";
import { corpoEnviado, simularApi } from "./apiFalsa";

const LIVROS = [
  { id: 1, titulo: "Dom Casmurro", total_exemplares: 2, exemplares_disponiveis: 1 },
  { id: 2, titulo: "O Cortiço", total_exemplares: 1, exemplares_disponiveis: 0 },
];
const LEITORES = [{ id: 7, nome: "Ana Souza", email: "ana@email.com" }];

function emprestimo(dados) {
  return {
    id: 1,
    livro: { id: 1, titulo: "Dom Casmurro" },
    leitor: { id: 7, nome: "Ana Souza" },
    data_emprestimo: "2020-01-01",
    data_prevista_devolucao: "2020-01-15",
    data_devolucao: null,
    renovacoes: 0,
    multa: 0,
    ...dados,
  };
}

describe("tela de empréstimos", () => {
  it("registra um empréstimo escolhendo livro e leitor", async () => {
    const emprestimos = [];
    const api = simularApi({
      "GET /emprestimos": () => [200, emprestimos],
      "GET /livros": LIVROS,
      "GET /leitores": LEITORES,
      "POST /emprestimos": () => {
        emprestimos.push(emprestimo({ data_prevista_devolucao: "2999-01-15" }));
        return [201, emprestimos[0]];
      },
    });
    render(<EmprestimosPagina />);
    await screen.findByText("Nenhum empréstimo encontrado.");
    await screen.findByRole("option", { name: /Dom Casmurro/ });

    expect(screen.getByRole("option", { name: /O Cortiço/ })).toBeDisabled();
    await userEvent.selectOptions(screen.getByLabelText("Livro"), "1");
    await userEvent.selectOptions(screen.getByLabelText("Leitor"), "7");
    await userEvent.click(screen.getByRole("button", { name: "Registrar empréstimo" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      'Empréstimo de "Dom Casmurro" para Ana Souza registrado. Devolução até 15/01/2999.',
    );
    expect(corpoEnviado(api, "POST")).toEqual({ livro_id: 1, leitor_id: 7 });
    const linha = (await screen.findByRole("cell", { name: "Dom Casmurro" })).closest("tr");
    expect(linha).toHaveTextContent("Ativo");
  });

  it("devolve um empréstimo atrasado e informa a multa", async () => {
    let atual = emprestimo();
    simularApi({
      "GET /emprestimos": () => [200, [atual]],
      "GET /livros": LIVROS,
      "GET /leitores": LEITORES,
      "POST /emprestimos/1/devolucao": () => {
        atual = emprestimo({ data_devolucao: "2020-01-18", multa: 3 });
        return [200, atual];
      },
    });
    render(<EmprestimosPagina />);

    const linha = (await screen.findByRole("cell", { name: "Dom Casmurro" })).closest("tr");
    expect(linha).toHaveTextContent("Atrasado");
    await userEvent.click(
      within(linha).getByRole("button", {
        name: "Devolver empréstimo de Dom Casmurro para Ana Souza",
      }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(/multa de R\$\s3,00/);
    await waitFor(() =>
      expect(screen.getByRole("row", { name: /Dom Casmurro/ })).toHaveTextContent(
        "Devolvido em 18/01/2020",
      ),
    );
  });

  it("filtra os empréstimos pela situação", async () => {
    const api = simularApi({
      "GET /emprestimos": [],
      "GET /emprestimos?situacao=atrasados": [emprestimo()],
      "GET /livros": LIVROS,
      "GET /leitores": LEITORES,
    });
    render(<EmprestimosPagina />);
    await screen.findByText("Nenhum empréstimo encontrado.");

    await userEvent.selectOptions(screen.getByLabelText("Situação"), "atrasados");

    expect(await screen.findByRole("cell", { name: "Dom Casmurro" })).toBeInTheDocument();
    expect(api).toHaveBeenCalledWith("http://localhost:8000/emprestimos?situacao=atrasados", {});
  });
});

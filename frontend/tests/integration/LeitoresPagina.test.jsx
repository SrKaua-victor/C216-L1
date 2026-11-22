import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import LeitoresPagina from "../../src/pages/LeitoresPagina";
import { corpoEnviado, simularApi } from "./apiFalsa";

describe("tela de leitores", () => {
  it("edita um leitor carregando os dados no formulário", async () => {
    const leitor = { id: 4, nome: "Ana Souza", email: "ana@email.com", telefone: "35998765432" };
    const api = simularApi({
      "GET /leitores": () => [200, [leitor]],
      "PUT /leitores/4": (corpo) => {
        Object.assign(leitor, corpo);
        return [200, leitor];
      },
    });
    render(<LeitoresPagina />);

    const linha = (await screen.findByRole("cell", { name: "Ana Souza" })).closest("tr");
    expect(linha).toHaveTextContent("(35) 99876-5432");

    await userEvent.click(screen.getByRole("button", { name: "Editar Ana Souza" }));
    expect(screen.getByLabelText("E-mail")).toHaveValue("ana@email.com");
    await userEvent.clear(screen.getByLabelText("Telefone (opcional)"));
    await userEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByRole("status")).toHaveTextContent('Leitor "Ana Souza" atualizado.');
    expect(corpoEnviado(api, "PUT")).toEqual({
      nome: "Ana Souza",
      email: "ana@email.com",
      telefone: null,
    });
    expect(screen.getByRole("form", { name: "Novo leitor" })).toBeInTheDocument();
  });
});

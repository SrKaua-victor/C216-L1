import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/App";

let usuario;

beforeEach(() => {
  usuario = userEvent.setup();
  render(<App />);
});

async function cadastrar(nome, descricao = "") {
  await usuario.type(screen.getByLabelText("Nome"), nome);
  if (descricao) {
    await usuario.type(screen.getByLabelText(/descrição/i), descricao);
  }
  await usuario.click(screen.getByRole("button", { name: "Adicionar" }));
}

function itensDaLista() {
  return within(screen.getByRole("list", { name: "Itens cadastrados" })).getAllByRole("listitem");
}

function nomesNaLista() {
  return screen
    .getAllByRole("button", { name: /^Remover / })
    .map((botao) => botao.getAttribute("aria-label").replace("Remover ", ""));
}

describe("App: formulário integrado à lista", () => {
  it("começa com o estado vazio e o contador zerado", () => {
    expect(screen.getByText("Nenhum item cadastrado ainda.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Itens cadastrados 0" })).toBeInTheDocument();
  });

  it("um item cadastrado no formulário aparece na lista", async () => {
    await cadastrar("Caderno", "Capa dura");
    const [item] = itensDaLista();
    expect(item).toHaveTextContent("Caderno");
    expect(item).toHaveTextContent("Capa dura");
    expect(screen.queryByText("Nenhum item cadastrado ainda.")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Itens cadastrados 1" })).toBeInTheDocument();
  });

  it("mantém os itens na ordem em que foram cadastrados", async () => {
    await cadastrar("Caderno");
    await cadastrar("Caneta");
    await cadastrar("Mochila");
    expect(nomesNaLista()).toEqual(["Caderno", "Caneta", "Mochila"]);
  });

  it("anuncia o item adicionado", async () => {
    await cadastrar("Caderno");
    expect(screen.getByRole("status")).toHaveTextContent("“Caderno” foi adicionado.");
  });

  it("devolve o foco ao campo nome para cadastrar o próximo", async () => {
    await cadastrar("Caderno");
    expect(screen.getByLabelText("Nome")).toHaveFocus();
  });

  it("não deixa cadastrar um nome que já está na lista", async () => {
    await cadastrar("Caderno");
    await cadastrar("CADERNO");
    expect(itensDaLista()).toHaveLength(1);
    expect(screen.getByRole("alert")).toHaveTextContent("Já existe um item com esse nome.");
  });

  it("um item inválido não entra na lista", async () => {
    await cadastrar("ab");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.getByText("Nenhum item cadastrado ainda.")).toBeInTheDocument();
  });

  it("remove apenas o item escolhido", async () => {
    await cadastrar("Caderno");
    await cadastrar("Caneta");
    await cadastrar("Mochila");
    await usuario.click(screen.getByRole("button", { name: "Remover Caneta" }));
    expect(nomesNaLista()).toEqual(["Caderno", "Mochila"]);
    expect(screen.getByRole("heading", { name: "Itens cadastrados 2" })).toBeInTheDocument();
  });

  it("anuncia a remoção e leva o foco ao título da lista", async () => {
    await cadastrar("Caderno");
    await usuario.click(screen.getByRole("button", { name: "Remover Caderno" }));
    expect(screen.getByRole("status")).toHaveTextContent("“Caderno” foi removido.");
    expect(screen.getByRole("heading", { name: /^Itens cadastrados/ })).toHaveFocus();
  });

  it("volta ao estado vazio ao remover o último item", async () => {
    await cadastrar("Caderno");
    await usuario.click(screen.getByRole("button", { name: "Remover Caderno" }));
    expect(screen.getByText("Nenhum item cadastrado ainda.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Itens cadastrados 0" })).toBeInTheDocument();
  });

  it("um nome removido pode ser cadastrado de novo", async () => {
    await cadastrar("Caderno");
    await usuario.click(screen.getByRole("button", { name: "Remover Caderno" }));
    await cadastrar("Caderno");
    expect(nomesNaLista()).toEqual(["Caderno"]);
  });
});

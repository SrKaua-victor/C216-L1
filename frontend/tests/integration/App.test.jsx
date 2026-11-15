import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "../../src/App";

function responder(status, corpo) {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function criarApiFalsa(iniciais = []) {
  let proximoId = 1;
  const itens = iniciais.map((nome) => ({ id: proximoId++, nome, descricao: "" }));
  const falhas = [];

  const fetchFalso = vi.fn(async (url, opcoes = {}) => {
    const metodo = opcoes.method ?? "GET";
    const { pathname } = new URL(url);
    const falha = falhas.find((regra) => regra.metodo === metodo);
    if (falha) {
      falhas.splice(falhas.indexOf(falha), 1);
      return falha.responder();
    }

    if (metodo === "GET" && pathname === "/items/") {
      return responder(200, itens);
    }
    if (metodo === "POST" && pathname === "/items/") {
      const dados = JSON.parse(opcoes.body);
      if (itens.some((item) => item.nome.toLowerCase() === dados.nome.toLowerCase())) {
        return responder(409, { detail: "Já existe um item com esse nome." });
      }
      const criado = { id: proximoId++, ...dados };
      itens.push(criado);
      return responder(201, criado);
    }
    const remocao = pathname.match(/^\/items\/(\d+)$/);
    if (metodo === "DELETE" && remocao) {
      const indice = itens.findIndex((item) => item.id === Number(remocao[1]));
      if (indice === -1) {
        return responder(404, { detail: "Item não encontrado." });
      }
      itens.splice(indice, 1);
      return responder(204);
    }
    return responder(404, { detail: "Not Found" });
  });

  vi.stubGlobal("fetch", fetchFalso);

  return {
    fetch: fetchFalso,
    itens,
    falharUmaVez(metodo, status, detail) {
      falhas.push({ metodo, responder: () => responder(status, { detail }) });
    },
    semConexaoUmaVez(metodo) {
      falhas.push({
        metodo,
        responder: () => {
          throw new TypeError("Failed to fetch");
        },
      });
    },
    atrasarUmaVez(metodo) {
      let liberar;
      const espera = new Promise((resolver) => {
        liberar = resolver;
      });
      falhas.push({ metodo, responder: async () => (await espera)() });
      return (resposta) => liberar(() => resposta);
    },
    chamadas(metodo) {
      return fetchFalso.mock.calls.filter(([, opcoes = {}]) => (opcoes.method ?? "GET") === metodo);
    },
  };
}

async function renderizarApp(iniciais = []) {
  const api = criarApiFalsa(iniciais);
  const usuario = userEvent.setup();
  render(<App />);
  await screen.findByRole("heading", { name: `Itens cadastrados ${iniciais.length}` });
  return { api, usuario };
}

async function cadastrar(usuario, nome, descricao = "") {
  await usuario.type(screen.getByLabelText("Nome"), nome);
  if (descricao) {
    await usuario.type(screen.getByLabelText(/descrição/i), descricao);
  }
  await usuario.click(screen.getByRole("button", { name: "Adicionar" }));
}

function nomesNaLista() {
  return screen
    .getAllByRole("button", { name: /^Remover / })
    .map((botao) => botao.getAttribute("aria-label").replace("Remover ", ""));
}

describe("App: carregamento dos itens", () => {
  it("mostra o carregamento enquanto a API não responde", async () => {
    const api = criarApiFalsa(["Caderno"]);
    const liberar = api.atrasarUmaVez("GET");
    render(<App />);

    expect(screen.getByText("Carregando itens...")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();

    liberar(new Response(JSON.stringify(api.itens), { status: 200 }));
    expect(await screen.findByRole("button", { name: "Remover Caderno" })).toBeInTheDocument();
    expect(screen.queryByText("Carregando itens...")).not.toBeInTheDocument();
  });

  it("exibe os itens que vieram da API", async () => {
    await renderizarApp(["Caderno", "Caneta"]);
    expect(nomesNaLista()).toEqual(["Caderno", "Caneta"]);
  });

  it("mostra o estado vazio quando a API não tem itens", async () => {
    await renderizarApp();
    expect(screen.getByText("Nenhum item cadastrado ainda.")).toBeInTheDocument();
  });

  it("mostra o erro quando a API falha e permite tentar de novo", async () => {
    const api = criarApiFalsa(["Caderno"]);
    api.falharUmaVez("GET", 500, "Erro interno no servidor.");
    const usuario = userEvent.setup();
    render(<App />);

    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent("Não foi possível carregar os itens.");
    expect(alerta).toHaveTextContent("Erro interno no servidor.");

    await usuario.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByRole("button", { name: "Remover Caderno" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("avisa quando não consegue conectar ao servidor", async () => {
    const api = criarApiFalsa();
    api.semConexaoUmaVez("GET");
    render(<App />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível conectar ao servidor",
    );
  });
});

describe("App: cadastro pela API", () => {
  it("envia o item para a API e exibe o que ela devolveu", async () => {
    const { api, usuario } = await renderizarApp();
    await cadastrar(usuario, "Caderno", "Capa dura");

    expect(await screen.findByRole("button", { name: "Remover Caderno" })).toBeInTheDocument();
    const [[url, opcoes]] = api.chamadas("POST");
    expect(url).toBe("http://localhost:8000/items/");
    expect(JSON.parse(opcoes.body)).toEqual({ nome: "Caderno", descricao: "Capa dura" });
    expect(screen.getByRole("heading", { name: "Itens cadastrados 1" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("“Caderno” foi adicionado.");
  });

  it("mantém os itens na ordem em que foram cadastrados", async () => {
    const { usuario } = await renderizarApp();
    await cadastrar(usuario, "Caderno");
    await cadastrar(usuario, "Caneta");
    await cadastrar(usuario, "Mochila");
    await waitFor(() => expect(nomesNaLista()).toEqual(["Caderno", "Caneta", "Mochila"]));
  });

  it("mostra o erro da API e não adiciona o item quando o cadastro falha", async () => {
    const { api, usuario } = await renderizarApp();
    api.falharUmaVez("POST", 500, "Erro interno no servidor.");
    await cadastrar(usuario, "Caderno");

    expect(await screen.findByRole("alert")).toHaveTextContent("Erro interno no servidor.");
    expect(screen.getByLabelText("Nome")).toHaveValue("Caderno");
    expect(screen.getByText("Nenhum item cadastrado ainda.")).toBeInTheDocument();
  });

  it("mostra no campo nome o conflito informado pela API", async () => {
    const { api, usuario } = await renderizarApp();
    api.falharUmaVez("POST", 409, "Já existe um item com esse nome.");
    await cadastrar(usuario, "Caderno");

    await waitFor(() =>
      expect(screen.getByLabelText("Nome")).toHaveAccessibleDescription(
        "Já existe um item com esse nome.",
      ),
    );
  });

  it("não chama a API para um nome que já está na lista", async () => {
    const { api, usuario } = await renderizarApp(["Caderno"]);
    await cadastrar(usuario, "CADERNO");

    expect(screen.getByRole("alert")).toHaveTextContent("Já existe um item com esse nome.");
    expect(api.chamadas("POST")).toHaveLength(0);
  });
});

describe("App: remoção pela API", () => {
  it("remove o item na API e na tela", async () => {
    const { api, usuario } = await renderizarApp(["Caderno", "Caneta"]);
    await usuario.click(screen.getByRole("button", { name: "Remover Caderno" }));

    await waitFor(() => expect(nomesNaLista()).toEqual(["Caneta"]));
    expect(api.chamadas("DELETE")[0][0]).toBe("http://localhost:8000/items/1");
    expect(screen.getByRole("status")).toHaveTextContent("“Caderno” foi removido.");
    expect(screen.getByRole("heading", { name: /^Itens cadastrados/ })).toHaveFocus();
  });

  it("mantém o item e avisa quando a remoção falha", async () => {
    const { api, usuario } = await renderizarApp(["Caderno"]);
    api.falharUmaVez("DELETE", 500, "Erro interno no servidor.");
    await usuario.click(screen.getByRole("button", { name: "Remover Caderno" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Erro interno no servidor."),
    );
    expect(nomesNaLista()).toEqual(["Caderno"]);
  });

  it("tira o item da tela quando a API diz que ele já não existe", async () => {
    const { api, usuario } = await renderizarApp(["Caderno"]);
    api.falharUmaVez("DELETE", 404, "Item não encontrado.");
    await usuario.click(screen.getByRole("button", { name: "Remover Caderno" }));

    expect(await screen.findByText("Nenhum item cadastrado ainda.")).toBeInTheDocument();
  });

  it("volta ao estado vazio ao remover o último item", async () => {
    const { usuario } = await renderizarApp(["Caderno"]);
    await usuario.click(screen.getByRole("button", { name: "Remover Caderno" }));

    expect(await screen.findByText("Nenhum item cadastrado ainda.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Itens cadastrados 0" })).toBeInTheDocument();
  });
});

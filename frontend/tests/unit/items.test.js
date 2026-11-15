import { describe, expect, it, vi } from "vitest";
import { API_URL, ApiError, createItem, deleteItem, listItems } from "../../src/services/items";

function responder(status, corpo) {
  const texto = typeof corpo === "string" ? corpo : JSON.stringify(corpo);
  return new Response(corpo === undefined ? null : texto, {
    status,
    headers: { "Content-Type": typeof corpo === "string" ? "text/html" : "application/json" },
  });
}

function mockarFetch(...respostas) {
  const fetchFalso = vi.fn();
  for (const resposta of respostas) {
    if (resposta instanceof Error) {
      fetchFalso.mockRejectedValueOnce(resposta);
    } else {
      fetchFalso.mockResolvedValueOnce(resposta);
    }
  }
  vi.stubGlobal("fetch", fetchFalso);
  return fetchFalso;
}

async function capturarErro(promessa) {
  try {
    await promessa;
  } catch (erro) {
    return erro;
  }
  throw new Error("a promessa deveria ter falhado");
}

describe("serviço de itens", () => {
  it("usa http://localhost:8000 quando VITE_API_URL não está definida", () => {
    expect(API_URL).toBe("http://localhost:8000");
  });

  it("listItems busca os itens com GET /items/", async () => {
    const itens = [{ id: 1, nome: "Caderno", descricao: "Capa dura" }];
    const fetchFalso = mockarFetch(responder(200, itens));

    await expect(listItems()).resolves.toEqual(itens);
    expect(fetchFalso).toHaveBeenCalledWith("http://localhost:8000/items/", {});
  });

  it("createItem envia o item em JSON com POST /items/", async () => {
    const criado = { id: 1, nome: "Caderno", descricao: "" };
    const fetchFalso = mockarFetch(responder(201, criado));

    await expect(createItem({ nome: "Caderno", descricao: "" })).resolves.toEqual(criado);
    expect(fetchFalso).toHaveBeenCalledWith("http://localhost:8000/items/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: "Caderno", descricao: "" }),
    });
  });

  it("deleteItem usa DELETE /items/{id} e resolve sem conteúdo", async () => {
    const fetchFalso = mockarFetch(responder(204));

    await expect(deleteItem(7)).resolves.toBeNull();
    expect(fetchFalso).toHaveBeenCalledWith("http://localhost:8000/items/7", {
      method: "DELETE",
    });
  });

  it("repassa a mensagem de erro enviada pelo backend", async () => {
    mockarFetch(responder(409, { detail: "Já existe um item com esse nome." }));

    const erro = await capturarErro(createItem({ nome: "Caderno", descricao: "" }));
    expect(erro).toBeInstanceOf(ApiError);
    expect(erro.status).toBe(409);
    expect(erro.message).toBe("Já existe um item com esse nome.");
  });

  it("resume os erros de validação do backend", async () => {
    mockarFetch(responder(422, { detail: [{ loc: ["body", "nome"], msg: "too short" }] }));

    const erro = await capturarErro(createItem({ nome: "ab", descricao: "" }));
    expect(erro.status).toBe(422);
    expect(erro.message).toBe("Os dados enviados são inválidos.");
  });

  it("informa o código quando o erro não vem em JSON", async () => {
    mockarFetch(responder(502, "<html>Bad Gateway</html>"));

    const erro = await capturarErro(listItems());
    expect(erro.status).toBe(502);
    expect(erro.message).toBe("O servidor respondeu com erro 502.");
  });

  it("explica quando não consegue conectar ao servidor", async () => {
    mockarFetch(new TypeError("Failed to fetch"));

    const erro = await capturarErro(listItems());
    expect(erro).toBeInstanceOf(ApiError);
    expect(erro.status).toBe(0);
    expect(erro.message).toMatch("Não foi possível conectar ao servidor");
  });
});

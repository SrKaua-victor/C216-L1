import { afterEach, describe, expect, it, vi } from "vitest";
import { API_URL, ApiError, requisitar } from "../../src/services/api";

function responder(status, corpo) {
  const texto = typeof corpo === "string" ? corpo : JSON.stringify(corpo);
  return new Response(corpo === undefined ? null : texto, { status });
}

async function capturarErro(promessa) {
  try {
    await promessa;
  } catch (erro) {
    return erro;
  }
  throw new Error("a promessa deveria ter falhado");
}

describe("requisitar", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("usa http://localhost:8000 quando VITE_API_URL não está definida", () => {
    expect(API_URL).toBe("http://localhost:8000");
  });

  it("devolve o JSON da resposta e null quando não há conteúdo", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(responder(200, [{ id: 1 }]))
        .mockResolvedValueOnce(responder(204)),
    );
    await expect(requisitar("/livros")).resolves.toEqual([{ id: 1 }]);
    await expect(requisitar("/livros/1", { method: "DELETE" })).resolves.toBeNull();
  });

  it.each([
    [
      409,
      { detail: "Não há exemplares disponíveis deste livro." },
      "Não há exemplares disponíveis deste livro.",
    ],
    [422, { detail: [{ msg: "Value error, ISBN inválido" }] }, "ISBN inválido"],
    [
      422,
      { detail: [{ msg: "String should have at least 3 characters" }] },
      "Os dados enviados são inválidos.",
    ],
    [502, "<html>Bad Gateway</html>", "O servidor respondeu com erro 502."],
  ])("traduz a resposta %i em uma mensagem para o usuário", async (status, corpo, mensagem) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(responder(status, corpo)));
    const erro = await capturarErro(requisitar("/emprestimos"));
    expect(erro).toBeInstanceOf(ApiError);
    expect([erro.status, erro.message]).toEqual([status, mensagem]);
  });

  it("explica quando não consegue conectar ao servidor", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const erro = await capturarErro(requisitar("/livros"));
    expect(erro.status).toBe(0);
    expect(erro.message).toMatch("Não foi possível conectar ao servidor");
  });
});

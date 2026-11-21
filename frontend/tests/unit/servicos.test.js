import { afterEach, describe, expect, it, vi } from "vitest";
import {
  criarEmprestimo,
  devolverEmprestimo,
  listarEmprestimos,
  renovarEmprestimo,
} from "../../src/services/emprestimos";
import { listarLeitores, removerLeitor } from "../../src/services/leitores";
import { atualizarLivro, criarLivro, listarLivros } from "../../src/services/livros";

const URL = "http://localhost:8000";
const JSON_HEADERS = { "Content-Type": "application/json" };

describe("serviços da API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    ["listarLivros sem busca", () => listarLivros(), "/livros", {}],
    [
      "listarLivros com busca",
      () => listarLivros(" dom casmurro "),
      "/livros?busca=dom+casmurro",
      {},
    ],
    [
      "criarLivro",
      () => criarLivro({ titulo: "Dom Casmurro" }),
      "/livros",
      { method: "POST", headers: JSON_HEADERS, body: '{"titulo":"Dom Casmurro"}' },
    ],
    [
      "atualizarLivro",
      () => atualizarLivro(3, { titulo: "Dom Casmurro" }),
      "/livros/3",
      { method: "PUT", headers: JSON_HEADERS, body: '{"titulo":"Dom Casmurro"}' },
    ],
    ["listarLeitores com busca", () => listarLeitores("ana"), "/leitores?busca=ana", {}],
    ["removerLeitor", () => removerLeitor(5), "/leitores/5", { method: "DELETE" }],
    [
      "listarEmprestimos",
      () => listarEmprestimos("atrasados"),
      "/emprestimos?situacao=atrasados",
      {},
    ],
    [
      "criarEmprestimo",
      () => criarEmprestimo(1, 2),
      "/emprestimos",
      { method: "POST", headers: JSON_HEADERS, body: '{"livro_id":1,"leitor_id":2}' },
    ],
    [
      "renovarEmprestimo",
      () => renovarEmprestimo(7),
      "/emprestimos/7/renovacao",
      { method: "POST" },
    ],
    [
      "devolverEmprestimo",
      () => devolverEmprestimo(7),
      "/emprestimos/7/devolucao",
      { method: "POST" },
    ],
  ])("%s chama a rota certa", async (_nome, chamada, caminho, opcoes) => {
    const fetchFalso = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchFalso);
    await chamada();
    expect(fetchFalso).toHaveBeenCalledWith(`${URL}${caminho}`, opcoes);
  });
});

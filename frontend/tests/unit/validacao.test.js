import { describe, expect, it } from "vitest";
import {
  normalizarLeitor,
  normalizarLivro,
  validarLeitor,
  validarLivro,
} from "../../src/validacao";

const LIVRO = {
  titulo: " Dom Casmurro ",
  autor: "Machado de Assis",
  isbn: "978-85-359-1066-7",
  ano_publicacao: "1899",
  total_exemplares: "2",
};

describe("validação de livros", () => {
  it("aceita um livro válido e normaliza os dados para a API", () => {
    expect(validarLivro(LIVRO)).toEqual({});
    expect(normalizarLivro(LIVRO)).toEqual({
      titulo: "Dom Casmurro",
      autor: "Machado de Assis",
      isbn: "9788535910667",
      ano_publicacao: 1899,
      total_exemplares: 2,
    });
  });

  it("aponta cada campo inválido", () => {
    const erros = validarLivro({
      titulo: " ",
      autor: "M",
      isbn: "123",
      ano_publicacao: "3000",
      total_exemplares: "0",
    });
    expect(Object.keys(erros).sort()).toEqual([
      "ano_publicacao",
      "autor",
      "isbn",
      "titulo",
      "total_exemplares",
    ]);
  });
});

describe("validação de leitores", () => {
  it("aceita telefone vazio e normaliza e-mail e telefone", () => {
    expect(validarLeitor({ nome: "Ana Souza", email: "ana@email.com", telefone: "" })).toEqual({});
    expect(
      normalizarLeitor({ nome: " Ana ", email: " Ana@Email.COM ", telefone: "(35) 99876-5432" }),
    ).toEqual({ nome: "Ana", email: "ana@email.com", telefone: "35998765432" });
    expect(normalizarLeitor({ nome: "Ana", email: "a@b.co", telefone: "" }).telefone).toBeNull();
  });

  it("aponta nome curto, e-mail inválido e telefone sem DDD", () => {
    const erros = validarLeitor({ nome: "An", email: "ana@", telefone: "98765432" });
    expect(Object.keys(erros).sort()).toEqual(["email", "nome", "telefone"]);
  });
});

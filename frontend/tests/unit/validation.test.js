import { describe, expect, it } from "vitest";
import { LIMITES, validarItem } from "../../src/validation";

describe("validarItem", () => {
  it("aceita um item com nome e descrição", () => {
    expect(validarItem({ nome: "Caderno", descricao: "Capa dura" })).toEqual({});
  });

  it("aceita um item sem descrição", () => {
    expect(validarItem({ nome: "Caderno" })).toEqual({});
  });

  it.each([
    ["vazio", ""],
    ["só com espaços", "   "],
    ["ausente", undefined],
  ])("exige o nome quando ele está %s", (_, nome) => {
    expect(validarItem({ nome }).nome).toBe("Informe o nome do item.");
  });

  it("rejeita nome menor que o mínimo", () => {
    expect(validarItem({ nome: "ab" }).nome).toMatch("pelo menos 3 caracteres");
  });

  it("rejeita nome maior que o máximo", () => {
    const nome = "a".repeat(LIMITES.nomeMaximo + 1);
    expect(validarItem({ nome }).nome).toMatch("no máximo 50 caracteres");
  });

  it.each([
    ["mínimo", "a".repeat(LIMITES.nomeMinimo)],
    ["máximo", "a".repeat(LIMITES.nomeMaximo)],
  ])("aceita nome exatamente no limite %s", (_, nome) => {
    expect(validarItem({ nome })).toEqual({});
  });

  it("ignora espaços nas pontas ao medir o nome", () => {
    expect(validarItem({ nome: "  ab  " }).nome).toMatch("pelo menos 3 caracteres");
  });

  it.each([
    ["igual", "Caderno"],
    ["com outra capitalização", "CADERNO"],
    ["com espaços nas pontas", "  caderno  "],
  ])("rejeita nome repetido %s", (_, nome) => {
    expect(validarItem({ nome }, ["Caderno"]).nome).toBe("Já existe um item com esse nome.");
  });

  it("rejeita descrição maior que o máximo", () => {
    const descricao = "a".repeat(LIMITES.descricaoMaxima + 1);
    expect(validarItem({ nome: "Caderno", descricao }).descricao).toMatch("no máximo 200");
  });

  it("aceita descrição exatamente no limite máximo", () => {
    const descricao = "a".repeat(LIMITES.descricaoMaxima);
    expect(validarItem({ nome: "Caderno", descricao })).toEqual({});
  });

  it("retorna os erros de nome e descrição ao mesmo tempo", () => {
    const descricao = "a".repeat(LIMITES.descricaoMaxima + 1);
    expect(Object.keys(validarItem({ nome: "", descricao }))).toEqual(["nome", "descricao"]);
  });
});

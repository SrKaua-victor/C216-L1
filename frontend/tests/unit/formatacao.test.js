import { describe, expect, it } from "vitest";
import {
  dataDeHoje,
  formatarData,
  formatarMoeda,
  formatarTelefone,
  situacaoDoEmprestimo,
} from "../../src/formatacao";

describe("formatação", () => {
  it.each([
    ["35998765432", "(35) 99876-5432"],
    ["3534711234", "(35) 3471-1234"],
    [null, "-"],
  ])("formata o telefone %s", (telefone, esperado) => {
    expect(formatarTelefone(telefone)).toBe(esperado);
  });

  it("formata datas da API e valores em reais", () => {
    expect(formatarData("2026-11-05")).toBe("05/11/2026");
    expect(formatarMoeda(3)).toMatch(/^R\$\s3,00$/);
    expect(dataDeHoje(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it.each([
    [{ data_prevista_devolucao: "2026-11-19", data_devolucao: "2026-11-22" }, "Devolvido"],
    [{ data_prevista_devolucao: "2026-11-19", data_devolucao: null }, "Atrasado"],
    [{ data_prevista_devolucao: "2026-11-20", data_devolucao: null }, "Ativo"],
  ])("calcula a situação do empréstimo em 20/11/2026", (emprestimo, situacao) => {
    expect(situacaoDoEmprestimo(emprestimo, "2026-11-20")).toBe(situacao);
  });
});

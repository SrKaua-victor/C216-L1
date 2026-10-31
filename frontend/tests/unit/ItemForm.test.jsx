import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ItemForm from "../../src/components/ItemForm";

function renderizar(props = {}) {
  const onAdicionar = vi.fn();
  render(<ItemForm onAdicionar={onAdicionar} {...props} />);
  return {
    onAdicionar,
    campoNome: screen.getByLabelText("Nome"),
    campoDescricao: screen.getByLabelText(/descrição/i),
    botao: screen.getByRole("button", { name: "Adicionar" }),
  };
}

function preencher(campo, valor) {
  fireEvent.change(campo, { target: { value: valor } });
}

describe("ItemForm", () => {
  it("envia nome e descrição sem os espaços das pontas", () => {
    const { onAdicionar, campoNome, campoDescricao, botao } = renderizar();
    preencher(campoNome, "  Caderno  ");
    preencher(campoDescricao, " Capa dura ");
    fireEvent.click(botao);
    expect(onAdicionar).toHaveBeenCalledOnce();
    expect(onAdicionar).toHaveBeenCalledWith({ nome: "Caderno", descricao: "Capa dura" });
  });

  it("limpa os campos depois de enviar", () => {
    const { campoNome, campoDescricao, botao } = renderizar();
    preencher(campoNome, "Caderno");
    preencher(campoDescricao, "Capa dura");
    fireEvent.click(botao);
    expect(campoNome).toHaveValue("");
    expect(campoDescricao).toHaveValue("");
  });

  it("mostra o erro e não envia quando o nome está vazio", () => {
    const { onAdicionar, campoNome, botao } = renderizar();
    fireEvent.click(botao);
    expect(onAdicionar).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Informe o nome do item.");
    expect(campoNome).toHaveAttribute("aria-invalid", "true");
    expect(campoNome).toHaveAccessibleDescription("Informe o nome do item.");
  });

  it("não envia um nome que já existe", () => {
    const { onAdicionar, campoNome, botao } = renderizar({ nomesExistentes: ["Caderno"] });
    preencher(campoNome, "caderno");
    fireEvent.click(botao);
    expect(onAdicionar).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Já existe um item com esse nome.");
  });

  it("mantém o que foi digitado quando há erro", () => {
    const { campoNome, botao } = renderizar();
    preencher(campoNome, "ab");
    fireEvent.click(botao);
    expect(campoNome).toHaveValue("ab");
  });

  it("remove o erro depois que o usuário corrige e envia de novo", () => {
    const { onAdicionar, campoNome, botao } = renderizar();
    fireEvent.click(botao);
    preencher(campoNome, "Caderno");
    fireEvent.click(botao);
    expect(onAdicionar).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(campoNome).toHaveAttribute("aria-invalid", "false");
  });

  it("limpa o erro de um campo assim que ele é editado", () => {
    const { campoNome, botao } = renderizar();
    fireEvent.click(botao);
    expect(campoNome).toHaveAttribute("aria-invalid", "true");
    preencher(campoNome, "C");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(campoNome).toHaveAttribute("aria-invalid", "false");
  });

  it("mantém o erro do outro campo ao editar um deles", () => {
    const { campoNome, campoDescricao, botao } = renderizar();
    preencher(campoDescricao, "a".repeat(201));
    fireEvent.click(botao);
    expect(screen.getAllByRole("alert")).toHaveLength(2);
    preencher(campoNome, "Caderno");
    expect(screen.getByRole("alert")).toHaveTextContent("no máximo 200");
  });

  it("leva o foco ao campo nome quando ele é inválido", () => {
    const { campoNome, botao } = renderizar();
    fireEvent.click(botao);
    expect(campoNome).toHaveFocus();
  });

  it("leva o foco à descrição quando só ela é inválida", () => {
    const { campoNome, campoDescricao, botao } = renderizar();
    preencher(campoNome, "Caderno");
    preencher(campoDescricao, "a".repeat(201));
    fireEvent.click(botao);
    expect(campoDescricao).toHaveFocus();
  });

  it("devolve o foco ao campo nome depois de enviar", () => {
    const { campoNome, botao } = renderizar();
    preencher(campoNome, "Caderno");
    fireEvent.click(botao);
    expect(campoNome).toHaveFocus();
  });

  it("mostra quantos caracteres foram digitados em cada campo", () => {
    const { campoNome, campoDescricao } = renderizar();
    expect(screen.getByText("0/50")).toBeInTheDocument();
    expect(screen.getByText("0/200")).toBeInTheDocument();
    preencher(campoNome, "Caderno");
    preencher(campoDescricao, "Capa dura");
    expect(screen.getByText("7/50")).toBeInTheDocument();
    expect(screen.getByText("9/200")).toBeInTheDocument();
  });
});

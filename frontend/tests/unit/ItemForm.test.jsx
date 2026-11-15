import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ItemForm from "../../src/components/ItemForm";
import { ApiError } from "../../src/services/items";

function renderizar(props = {}) {
  const onAdicionar = props.onAdicionar ?? vi.fn().mockResolvedValue(undefined);
  render(<ItemForm {...props} onAdicionar={onAdicionar} />);
  return {
    onAdicionar,
    campoNome: screen.getByLabelText("Nome"),
    campoDescricao: screen.getByLabelText(/descrição/i),
    botao: () => screen.getByRole("button", { name: /^Adicionar|^Adicionando/ }),
  };
}

function preencher(campo, valor) {
  fireEvent.change(campo, { target: { value: valor } });
}

function adiar() {
  let resolver;
  let rejeitar;
  const promessa = new Promise((ok, falha) => {
    resolver = ok;
    rejeitar = falha;
  });
  return { promessa, resolver, rejeitar };
}

describe("ItemForm", () => {
  it("envia nome e descrição sem os espaços das pontas", () => {
    const { onAdicionar, campoNome, campoDescricao, botao } = renderizar();
    preencher(campoNome, "  Caderno  ");
    preencher(campoDescricao, " Capa dura ");
    fireEvent.click(botao());
    expect(onAdicionar).toHaveBeenCalledOnce();
    expect(onAdicionar).toHaveBeenCalledWith({ nome: "Caderno", descricao: "Capa dura" });
  });

  it("limpa os campos depois que o envio termina", async () => {
    const { campoNome, campoDescricao, botao } = renderizar();
    preencher(campoNome, "Caderno");
    preencher(campoDescricao, "Capa dura");
    fireEvent.click(botao());
    await waitFor(() => expect(campoNome).toHaveValue(""));
    expect(campoDescricao).toHaveValue("");
  });

  it("devolve o foco ao campo nome depois de enviar", async () => {
    const { campoNome, botao } = renderizar();
    preencher(campoNome, "Caderno");
    fireEvent.click(botao());
    await waitFor(() => expect(campoNome).toHaveFocus());
  });

  it("mostra que está enviando e desabilita o botão até a resposta", async () => {
    const envio = adiar();
    const { campoNome, botao } = renderizar({ onAdicionar: vi.fn(() => envio.promessa) });
    preencher(campoNome, "Caderno");
    fireEvent.click(botao());

    expect(botao()).toHaveTextContent("Adicionando...");
    expect(botao()).toBeDisabled();

    envio.resolver();
    await waitFor(() => expect(botao()).toHaveTextContent("Adicionar"));
    expect(botao()).toBeEnabled();
  });

  it("não envia duas vezes enquanto o primeiro envio não termina", () => {
    const envio = adiar();
    const onAdicionar = vi.fn(() => envio.promessa);
    const { campoNome, botao } = renderizar({ onAdicionar });
    preencher(campoNome, "Caderno");
    fireEvent.click(botao());
    fireEvent.submit(botao().closest("form"));
    expect(onAdicionar).toHaveBeenCalledOnce();
  });

  it("mantém os valores e mostra o erro quando o servidor falha", async () => {
    const onAdicionar = vi.fn().mockRejectedValue(new ApiError("Servidor indisponível.", 500));
    const { campoNome, botao } = renderizar({ onAdicionar });
    preencher(campoNome, "Caderno");
    fireEvent.click(botao());

    expect(await screen.findByRole("alert")).toHaveTextContent("Servidor indisponível.");
    expect(campoNome).toHaveValue("Caderno");
    expect(botao()).toBeEnabled();
  });

  it("mostra o conflito do servidor no campo nome", async () => {
    const onAdicionar = vi
      .fn()
      .mockRejectedValue(new ApiError("Já existe um item com esse nome.", 409));
    const { campoNome, botao } = renderizar({ onAdicionar });
    preencher(campoNome, "Caderno");
    fireEvent.click(botao());

    await waitFor(() => expect(campoNome).toHaveAttribute("aria-invalid", "true"));
    expect(campoNome).toHaveAccessibleDescription("Já existe um item com esse nome.");
  });

  it("limpa o erro do servidor quando o usuário edita um campo", async () => {
    const onAdicionar = vi.fn().mockRejectedValue(new ApiError("Servidor indisponível.", 500));
    const { campoNome, botao } = renderizar({ onAdicionar });
    preencher(campoNome, "Caderno");
    fireEvent.click(botao());
    await screen.findByRole("alert");

    preencher(campoNome, "Caderno novo");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("mostra o erro e não envia quando o nome está vazio", () => {
    const { onAdicionar, campoNome, botao } = renderizar();
    fireEvent.click(botao());
    expect(onAdicionar).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Informe o nome do item.");
    expect(campoNome).toHaveAttribute("aria-invalid", "true");
    expect(campoNome).toHaveAccessibleDescription("Informe o nome do item.");
  });

  it("não envia um nome que já existe", () => {
    const { onAdicionar, campoNome, botao } = renderizar({ nomesExistentes: ["Caderno"] });
    preencher(campoNome, "caderno");
    fireEvent.click(botao());
    expect(onAdicionar).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Já existe um item com esse nome.");
  });

  it("mantém o que foi digitado quando há erro", () => {
    const { campoNome, botao } = renderizar();
    preencher(campoNome, "ab");
    fireEvent.click(botao());
    expect(campoNome).toHaveValue("ab");
  });

  it("remove o erro depois que o usuário corrige e envia de novo", () => {
    const { onAdicionar, campoNome, botao } = renderizar();
    fireEvent.click(botao());
    preencher(campoNome, "Caderno");
    fireEvent.click(botao());
    expect(onAdicionar).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(campoNome).toHaveAttribute("aria-invalid", "false");
  });

  it("limpa o erro de um campo assim que ele é editado", () => {
    const { campoNome, botao } = renderizar();
    fireEvent.click(botao());
    expect(campoNome).toHaveAttribute("aria-invalid", "true");
    preencher(campoNome, "C");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(campoNome).toHaveAttribute("aria-invalid", "false");
  });

  it("mantém o erro do outro campo ao editar um deles", () => {
    const { campoNome, campoDescricao, botao } = renderizar();
    preencher(campoDescricao, "a".repeat(201));
    fireEvent.click(botao());
    expect(screen.getAllByRole("alert")).toHaveLength(2);
    preencher(campoNome, "Caderno");
    expect(screen.getByRole("alert")).toHaveTextContent("no máximo 200");
  });

  it("leva o foco ao campo nome quando ele é inválido", () => {
    const { campoNome, botao } = renderizar();
    fireEvent.click(botao());
    expect(campoNome).toHaveFocus();
  });

  it("leva o foco à descrição quando só ela é inválida", () => {
    const { campoNome, campoDescricao, botao } = renderizar();
    preencher(campoNome, "Caderno");
    preencher(campoDescricao, "a".repeat(201));
    fireEvent.click(botao());
    expect(campoDescricao).toHaveFocus();
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

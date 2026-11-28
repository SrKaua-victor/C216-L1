import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Formulario from "../../src/components/Formulario";
import { ApiError } from "../../src/services/api";

function renderizar(onSalvar) {
  render(
    <Formulario
      titulo="Novo autor"
      campos={[{ nome: "nome", rotulo: "Nome" }]}
      valoresIniciais={{ nome: "" }}
      validar={(valores) => (valores.nome.trim() ? {} : { nome: "Informe o nome." })}
      normalizar={(valores) => ({ nome: valores.nome.trim() })}
      textoDoBotao="Salvar"
      onSalvar={onSalvar}
    />,
  );
}

describe("Formulario", () => {
  it("mostra o erro no campo e não envia dados inválidos", async () => {
    const onSalvar = vi.fn();
    renderizar(onSalvar);

    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByLabelText("Nome")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Informe o nome.")).toBeInTheDocument();
    expect(onSalvar).not.toHaveBeenCalled();
  });

  it("envia os dados normalizados e limpa os campos", async () => {
    const onSalvar = vi.fn().mockResolvedValue();
    renderizar(onSalvar);

    await userEvent.type(screen.getByLabelText("Nome"), "  Machado  ");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSalvar).toHaveBeenCalledWith({ nome: "Machado" });
    expect(screen.getByLabelText("Nome")).toHaveValue("");
  });

  it("mostra o erro do servidor e mantém o que foi digitado", async () => {
    renderizar(vi.fn().mockRejectedValue(new ApiError("Já existe um autor com esse nome.", 409)));

    await userEvent.type(screen.getByLabelText("Nome"), "Machado");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Já existe um autor com esse nome.");
    expect(screen.getByLabelText("Nome")).toHaveValue("Machado");
  });
});

import { useState } from "react";
import {
  Busca,
  ESTILO_ACAO,
  ESTILO_ACAO_PERIGOSA,
  ESTILO_CELULA,
  EstadoDaLista,
  Mensagem,
  Tabela,
} from "../components/comum";
import Formulario from "../components/Formulario";
import { formatarTelefone } from "../formatacao";
import { useLista } from "../hooks/useLista";
import { atualizarLeitor, criarLeitor, listarLeitores, removerLeitor } from "../services/leitores";
import { normalizarLeitor, validarLeitor } from "../validacao";

const CAMPOS = [
  { nome: "nome", rotulo: "Nome" },
  { nome: "email", rotulo: "E-mail", type: "email" },
  { nome: "telefone", rotulo: "Telefone (opcional)", type: "tel" },
];

const VAZIO = { nome: "", email: "", telefone: "" };

function paraFormulario(leitor) {
  return { nome: leitor.nome, email: leitor.email, telefone: leitor.telefone ?? "" };
}

export default function LeitoresPagina() {
  const [termo, setTermo] = useState("");
  const { itens: leitores, carregando, erro, recarregar } = useLista(listarLeitores, termo);
  const [editando, setEditando] = useState(null);
  const [mensagem, setMensagem] = useState(null);

  async function salvar(dados) {
    if (editando) {
      await atualizarLeitor(editando.id, dados);
      setEditando(null);
      setMensagem({ tipo: "sucesso", texto: `Leitor "${dados.nome}" atualizado.` });
    } else {
      await criarLeitor(dados);
      setMensagem({ tipo: "sucesso", texto: `Leitor "${dados.nome}" cadastrado.` });
    }
    await recarregar();
  }

  async function remover(leitor) {
    if (!window.confirm(`Remover o leitor "${leitor.nome}"?`)) {
      return;
    }
    try {
      await removerLeitor(leitor.id);
      if (editando?.id === leitor.id) {
        setEditando(null);
      }
      setMensagem({ tipo: "sucesso", texto: `Leitor "${leitor.nome}" removido.` });
      await recarregar();
    } catch (falha) {
      setMensagem({ tipo: "erro", texto: falha.message });
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Leitores</h2>
      <Mensagem mensagem={mensagem} />
      <Formulario
        key={editando?.id ?? "novo"}
        titulo={editando ? `Editar "${editando.nome}"` : "Novo leitor"}
        campos={CAMPOS}
        valoresIniciais={editando ? paraFormulario(editando) : VAZIO}
        validar={validarLeitor}
        normalizar={normalizarLeitor}
        textoDoBotao={editando ? "Salvar alterações" : "Cadastrar leitor"}
        onSalvar={salvar}
        onCancelar={editando ? () => setEditando(null) : undefined}
      />
      <Busca rotulo="Buscar leitores" placeholder="Buscar por nome ou e-mail" onBuscar={setTermo} />
      <EstadoDaLista
        carregando={carregando}
        erro={erro}
        vazia={leitores.length === 0}
        textoVazio="Nenhum leitor encontrado."
        onTentarDeNovo={recarregar}
      >
        <Tabela colunas={["Nome", "E-mail", "Telefone", "Ações"]}>
          {leitores.map((leitor) => (
            <tr key={leitor.id} className="border-b border-slate-200">
              <td className={ESTILO_CELULA}>{leitor.nome}</td>
              <td className={ESTILO_CELULA}>{leitor.email}</td>
              <td className={ESTILO_CELULA}>{formatarTelefone(leitor.telefone)}</td>
              <td className={ESTILO_CELULA}>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditando(leitor)}
                    aria-label={`Editar ${leitor.nome}`}
                    className={ESTILO_ACAO}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => remover(leitor)}
                    aria-label={`Remover ${leitor.nome}`}
                    className={ESTILO_ACAO_PERIGOSA}
                  >
                    Remover
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Tabela>
      </EstadoDaLista>
    </section>
  );
}

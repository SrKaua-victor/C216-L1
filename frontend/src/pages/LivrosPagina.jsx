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
import { useLista } from "../hooks/useLista";
import { atualizarLivro, criarLivro, listarLivros, removerLivro } from "../services/livros";
import { normalizarLivro, validarLivro } from "../validacao";

const CAMPOS = [
  { nome: "titulo", rotulo: "Título" },
  { nome: "autor", rotulo: "Autor" },
  { nome: "isbn", rotulo: "ISBN" },
  { nome: "ano_publicacao", rotulo: "Ano de publicação", inputMode: "numeric" },
  { nome: "total_exemplares", rotulo: "Exemplares", inputMode: "numeric" },
];

const VAZIO = { titulo: "", autor: "", isbn: "", ano_publicacao: "", total_exemplares: "1" };

function paraFormulario(livro) {
  return {
    titulo: livro.titulo,
    autor: livro.autor,
    isbn: livro.isbn,
    ano_publicacao: String(livro.ano_publicacao),
    total_exemplares: String(livro.total_exemplares),
  };
}

export default function LivrosPagina() {
  const [termo, setTermo] = useState("");
  const { itens: livros, carregando, erro, recarregar } = useLista(listarLivros, termo);
  const [editando, setEditando] = useState(null);
  const [mensagem, setMensagem] = useState(null);

  async function salvar(dados) {
    if (editando) {
      await atualizarLivro(editando.id, dados);
      setEditando(null);
      setMensagem({ tipo: "sucesso", texto: `Livro "${dados.titulo}" atualizado.` });
    } else {
      await criarLivro(dados);
      setMensagem({ tipo: "sucesso", texto: `Livro "${dados.titulo}" cadastrado.` });
    }
    await recarregar();
  }

  async function remover(livro) {
    if (!window.confirm(`Remover o livro "${livro.titulo}"?`)) {
      return;
    }
    try {
      await removerLivro(livro.id);
      if (editando?.id === livro.id) {
        setEditando(null);
      }
      setMensagem({ tipo: "sucesso", texto: `Livro "${livro.titulo}" removido.` });
      await recarregar();
    } catch (falha) {
      setMensagem({ tipo: "erro", texto: falha.message });
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Livros</h2>
      <Mensagem mensagem={mensagem} />
      <Formulario
        key={editando?.id ?? "novo"}
        titulo={editando ? `Editar "${editando.titulo}"` : "Novo livro"}
        campos={CAMPOS}
        valoresIniciais={editando ? paraFormulario(editando) : VAZIO}
        validar={validarLivro}
        normalizar={normalizarLivro}
        textoDoBotao={editando ? "Salvar alterações" : "Cadastrar livro"}
        onSalvar={salvar}
        onCancelar={editando ? () => setEditando(null) : undefined}
      />
      <Busca rotulo="Buscar livros" placeholder="Buscar por título ou autor" onBuscar={setTermo} />
      <EstadoDaLista
        carregando={carregando}
        erro={erro}
        vazia={livros.length === 0}
        textoVazio="Nenhum livro encontrado."
        onTentarDeNovo={recarregar}
      >
        <Tabela colunas={["Título", "Autor", "ISBN", "Ano", "Disponíveis", "Ações"]}>
          {livros.map((livro) => (
            <tr key={livro.id} className="border-b border-slate-200">
              <td className={ESTILO_CELULA}>{livro.titulo}</td>
              <td className={ESTILO_CELULA}>{livro.autor}</td>
              <td className={ESTILO_CELULA}>{livro.isbn}</td>
              <td className={ESTILO_CELULA}>{livro.ano_publicacao}</td>
              <td className={ESTILO_CELULA}>
                {livro.exemplares_disponiveis} de {livro.total_exemplares}
              </td>
              <td className={ESTILO_CELULA}>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditando(livro)}
                    aria-label={`Editar ${livro.titulo}`}
                    className={ESTILO_ACAO}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => remover(livro)}
                    aria-label={`Remover ${livro.titulo}`}
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

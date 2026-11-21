import { useCallback, useEffect, useState } from "react";
import { ESTILO_BOTAO_SECUNDARIO, Mensagem } from "../components/comum";
import LivroForm from "../components/LivroForm";
import { atualizarLivro, criarLivro, listarLivros, removerLivro } from "../services/livros";

export default function LivrosPagina() {
  const [livros, setLivros] = useState([]);
  const [busca, setBusca] = useState("");
  const [termo, setTermo] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erroAoCarregar, setErroAoCarregar] = useState("");
  const [editando, setEditando] = useState(null);
  const [mensagem, setMensagem] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErroAoCarregar("");
    try {
      setLivros(await listarLivros(termo));
    } catch (erro) {
      setErroAoCarregar(erro.message);
    } finally {
      setCarregando(false);
    }
  }, [termo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function salvar(dados) {
    if (editando) {
      await atualizarLivro(editando.id, dados);
      setEditando(null);
      setMensagem({ tipo: "sucesso", texto: `Livro "${dados.titulo}" atualizado.` });
    } else {
      await criarLivro(dados);
      setMensagem({ tipo: "sucesso", texto: `Livro "${dados.titulo}" cadastrado.` });
    }
    await carregar();
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
      await carregar();
    } catch (erro) {
      setMensagem({ tipo: "erro", texto: erro.message });
    }
  }

  function buscar(evento) {
    evento.preventDefault();
    setTermo(busca.trim());
  }

  function limparBusca() {
    setBusca("");
    setTermo("");
  }

  let conteudo;
  if (carregando) {
    conteudo = <p className="text-sm text-slate-600">Carregando livros...</p>;
  } else if (erroAoCarregar) {
    conteudo = (
      <div className="flex flex-col items-start gap-2">
        <Mensagem mensagem={{ tipo: "erro", texto: erroAoCarregar }} />
        <button type="button" onClick={carregar} className={ESTILO_BOTAO_SECUNDARIO}>
          Tentar novamente
        </button>
      </div>
    );
  } else if (livros.length === 0) {
    conteudo = <p className="text-sm text-slate-600">Nenhum livro encontrado.</p>;
  } else {
    conteudo = (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white text-left text-sm">
          <thead>
            <tr className="border-b border-slate-300 bg-slate-100">
              <th className="px-3 py-2">Título</th>
              <th className="px-3 py-2">Autor</th>
              <th className="px-3 py-2">ISBN</th>
              <th className="px-3 py-2">Ano</th>
              <th className="px-3 py-2">Disponíveis</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {livros.map((livro) => (
              <tr key={livro.id} className="border-b border-slate-200">
                <td className="px-3 py-2">{livro.titulo}</td>
                <td className="px-3 py-2">{livro.autor}</td>
                <td className="px-3 py-2">{livro.isbn}</td>
                <td className="px-3 py-2">{livro.ano_publicacao}</td>
                <td className="px-3 py-2">
                  {livro.exemplares_disponiveis} de {livro.total_exemplares}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditando(livro)}
                      aria-label={`Editar ${livro.titulo}`}
                      className="text-slate-700 underline"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => remover(livro)}
                      aria-label={`Remover ${livro.titulo}`}
                      className="text-red-700 underline"
                    >
                      Remover
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Livros</h2>
      <Mensagem mensagem={mensagem} />
      <LivroForm
        key={editando?.id ?? "novo"}
        livro={editando}
        onSalvar={salvar}
        onCancelar={() => setEditando(null)}
      />
      <form onSubmit={buscar} className="flex flex-wrap gap-2">
        <input
          type="search"
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder="Buscar por título ou autor"
          aria-label="Buscar livros"
          className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-2 py-1.5"
        />
        <button type="submit" className={ESTILO_BOTAO_SECUNDARIO}>
          Buscar
        </button>
        {termo && (
          <button type="button" onClick={limparBusca} className={ESTILO_BOTAO_SECUNDARIO}>
            Limpar
          </button>
        )}
      </form>
      {conteudo}
    </section>
  );
}

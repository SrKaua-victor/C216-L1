import { useId, useState } from "react";
import {
  ESTILO_ACAO,
  ESTILO_BOTAO,
  ESTILO_CELULA,
  EstadoDaLista,
  Mensagem,
  Selecao,
  Tabela,
} from "../components/comum";
import { formatarData, formatarMoeda, situacaoDoEmprestimo } from "../formatacao";
import { useLista } from "../hooks/useLista";
import {
  criarEmprestimo,
  devolverEmprestimo,
  listarEmprestimos,
  renovarEmprestimo,
} from "../services/emprestimos";
import { listarLeitores } from "../services/leitores";
import { listarLivros } from "../services/livros";

const SITUACOES = [
  { valor: "", texto: "Todos" },
  { valor: "ativos", texto: "Ativos" },
  { valor: "atrasados", texto: "Atrasados" },
  { valor: "devolvidos", texto: "Devolvidos" },
];

function NovoEmprestimo({ livros, leitores, onRegistrar }) {
  const [livroId, setLivroId] = useState("");
  const [leitorId, setLeitorId] = useState("");
  const [erros, setErros] = useState({});
  const [erroDoServidor, setErroDoServidor] = useState("");
  const [enviando, setEnviando] = useState(false);
  const id = useId();

  async function enviar(evento) {
    evento.preventDefault();
    const novosErros = {};
    if (!livroId) {
      novosErros.livro = "Escolha um livro.";
    }
    if (!leitorId) {
      novosErros.leitor = "Escolha um leitor.";
    }
    setErros(novosErros);
    setErroDoServidor("");
    if (Object.keys(novosErros).length > 0) {
      return;
    }
    setEnviando(true);
    try {
      await onRegistrar(Number(livroId), Number(leitorId));
      setLivroId("");
      setLeitorId("");
    } catch (falha) {
      setErroDoServidor(falha.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={enviar}
      noValidate
      aria-label="Novo empréstimo"
      className="flex flex-col gap-3 rounded border border-slate-300 bg-white p-4"
    >
      <h3 className="font-semibold">Novo empréstimo</h3>
      <p className="text-sm text-slate-600">
        Prazo de 14 dias, com até 2 renovações de 7 dias. Multa de R$ 1,00 por dia de atraso.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Selecao
          id={`${id}-livro`}
          rotulo="Livro"
          value={livroId}
          onChange={(evento) => setLivroId(evento.target.value)}
          erro={erros.livro}
          textoVazio="Selecione um livro"
          opcoes={livros.map((livro) => ({
            valor: livro.id,
            texto: `${livro.titulo} (${livro.exemplares_disponiveis} de ${livro.total_exemplares} disponíveis)`,
            desabilitada: livro.exemplares_disponiveis === 0,
          }))}
        />
        <Selecao
          id={`${id}-leitor`}
          rotulo="Leitor"
          value={leitorId}
          onChange={(evento) => setLeitorId(evento.target.value)}
          erro={erros.leitor}
          textoVazio="Selecione um leitor"
          opcoes={leitores.map((leitor) => ({
            valor: leitor.id,
            texto: `${leitor.nome} (${leitor.email})`,
          }))}
        />
      </div>
      {erroDoServidor && <Mensagem mensagem={{ tipo: "erro", texto: erroDoServidor }} />}
      <div>
        <button type="submit" disabled={enviando} className={ESTILO_BOTAO}>
          Registrar empréstimo
        </button>
      </div>
    </form>
  );
}

function TextoDaSituacao({ emprestimo }) {
  const situacao = situacaoDoEmprestimo(emprestimo);
  if (situacao === "Devolvido") {
    return `Devolvido em ${formatarData(emprestimo.data_devolucao)}`;
  }
  return (
    <span className={situacao === "Atrasado" ? "font-medium text-red-700" : undefined}>
      {situacao}
    </span>
  );
}

export default function EmprestimosPagina() {
  const [situacao, setSituacao] = useState("");
  const {
    itens: emprestimos,
    carregando,
    erro,
    recarregar,
  } = useLista(listarEmprestimos, situacao);
  const { itens: livros, recarregar: recarregarLivros } = useLista(listarLivros, "");
  const { itens: leitores } = useLista(listarLeitores, "");
  const [mensagem, setMensagem] = useState(null);
  const [processando, setProcessando] = useState(null);

  async function atualizarListas() {
    await Promise.all([recarregar(), recarregarLivros()]);
  }

  async function registrar(livroId, leitorId) {
    const emprestimo = await criarEmprestimo(livroId, leitorId);
    setMensagem({
      tipo: "sucesso",
      texto: `Empréstimo de "${emprestimo.livro.titulo}" para ${emprestimo.leitor.nome} registrado. Devolução até ${formatarData(emprestimo.data_prevista_devolucao)}.`,
    });
    await atualizarListas();
  }

  async function executar(acao, emprestimo, textoDeSucesso) {
    setProcessando(emprestimo.id);
    try {
      const atualizado = await acao(emprestimo.id);
      setMensagem({ tipo: "sucesso", texto: textoDeSucesso(atualizado) });
      await atualizarListas();
    } catch (falha) {
      setMensagem({ tipo: "erro", texto: falha.message });
    } finally {
      setProcessando(null);
    }
  }

  function renovar(emprestimo) {
    return executar(
      renovarEmprestimo,
      emprestimo,
      (atualizado) =>
        `Empréstimo renovado até ${formatarData(atualizado.data_prevista_devolucao)}.`,
    );
  }

  function devolver(emprestimo) {
    return executar(devolverEmprestimo, emprestimo, (atualizado) =>
      atualizado.multa > 0
        ? `Devolução registrada com multa de ${formatarMoeda(atualizado.multa)}.`
        : "Devolução registrada sem multa.",
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Empréstimos</h2>
      <Mensagem mensagem={mensagem} />
      <NovoEmprestimo livros={livros} leitores={leitores} onRegistrar={registrar} />
      <div className="max-w-xs">
        <Selecao
          id="filtro-situacao"
          rotulo="Situação"
          value={situacao}
          onChange={(evento) => setSituacao(evento.target.value)}
          opcoes={SITUACOES}
        />
      </div>
      <EstadoDaLista
        carregando={carregando}
        erro={erro}
        vazia={emprestimos.length === 0}
        textoVazio="Nenhum empréstimo encontrado."
        onTentarDeNovo={recarregar}
      >
        <Tabela
          colunas={[
            "Livro",
            "Leitor",
            "Empréstimo",
            "Devolução prevista",
            "Situação",
            "Renovações",
            "Multa",
            "Ações",
          ]}
        >
          {emprestimos.map((emprestimo) => {
            const descricao = `${emprestimo.livro.titulo} para ${emprestimo.leitor.nome}`;
            return (
              <tr key={emprestimo.id} className="border-b border-slate-200">
                <td className={ESTILO_CELULA}>{emprestimo.livro.titulo}</td>
                <td className={ESTILO_CELULA}>{emprestimo.leitor.nome}</td>
                <td className={ESTILO_CELULA}>{formatarData(emprestimo.data_emprestimo)}</td>
                <td className={ESTILO_CELULA}>
                  {formatarData(emprestimo.data_prevista_devolucao)}
                </td>
                <td className={ESTILO_CELULA}>
                  <TextoDaSituacao emprestimo={emprestimo} />
                </td>
                <td className={ESTILO_CELULA}>{emprestimo.renovacoes} de 2</td>
                <td className={ESTILO_CELULA}>{formatarMoeda(emprestimo.multa)}</td>
                <td className={ESTILO_CELULA}>
                  {emprestimo.data_devolucao ? (
                    "-"
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => renovar(emprestimo)}
                        disabled={processando === emprestimo.id}
                        aria-label={`Renovar empréstimo de ${descricao}`}
                        className={ESTILO_ACAO}
                      >
                        Renovar
                      </button>
                      <button
                        type="button"
                        onClick={() => devolver(emprestimo)}
                        disabled={processando === emprestimo.id}
                        aria-label={`Devolver empréstimo de ${descricao}`}
                        className={ESTILO_ACAO}
                      >
                        Devolver
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </Tabela>
      </EstadoDaLista>
    </section>
  );
}

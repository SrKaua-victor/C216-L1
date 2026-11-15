import { useCallback, useEffect, useRef, useState } from "react";
import ItemForm from "./components/ItemForm";
import ItemList from "./components/ItemList";
import { createItem, deleteItem, listItems } from "./services/items";

const DURACAO_DO_AVISO_MS = 4000;

function Carregando() {
  return (
    <div className="flex flex-col gap-3">
      <p className="sr-only">Carregando itens...</p>
      {[1, 2, 3].map((linha) => (
        <div
          key={linha}
          aria-hidden="true"
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4"
        >
          <span className="size-10 shrink-0 rounded-full bg-slate-100 motion-safe:animate-pulse" />
          <span className="h-4 w-1/3 rounded bg-slate-100 motion-safe:animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function ErroAoCarregar({ mensagem, onTentarDeNovo }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center"
    >
      <p className="font-medium text-red-800">Não foi possível carregar os itens.</p>
      <p className="mt-1 text-sm text-red-700">{mensagem}</p>
      <button
        type="button"
        onClick={onTentarDeNovo}
        className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100"
      >
        Tentar novamente
      </button>
    </div>
  );
}

export default function App() {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroAoCarregar, setErroAoCarregar] = useState("");
  const [aviso, setAviso] = useState(null);
  const proximoAviso = useRef(1);
  const tituloDaLista = useRef(null);

  const carregarItens = useCallback(async () => {
    setCarregando(true);
    setErroAoCarregar("");
    try {
      setItens(await listItems());
    } catch (erro) {
      setErroAoCarregar(erro.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarItens();
  }, [carregarItens]);

  useEffect(() => {
    if (!aviso) {
      return;
    }
    const temporizador = setTimeout(() => setAviso(null), DURACAO_DO_AVISO_MS);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  function avisar(texto, tipo = "sucesso") {
    setAviso({ id: proximoAviso.current, texto, tipo });
    proximoAviso.current += 1;
  }

  async function adicionarItem(item) {
    const criado = await createItem(item);
    setItens((atuais) => [...atuais, criado]);
    avisar(`“${criado.nome}” foi adicionado.`);
  }

  async function removerItem(id) {
    const removido = itens.find((item) => item.id === id);
    try {
      await deleteItem(id);
    } catch (erro) {
      if (erro.status !== 404) {
        avisar(erro.message, "erro");
        return;
      }
    }
    setItens((atuais) => atuais.filter((item) => item.id !== id));
    avisar(`“${removido.nome}” foi removido.`);
    tituloDaLista.current.focus();
  }

  let conteudoDaLista;
  if (carregando) {
    conteudoDaLista = <Carregando />;
  } else if (erroAoCarregar) {
    conteudoDaLista = <ErroAoCarregar mensagem={erroAoCarregar} onTentarDeNovo={carregarItens} />;
  } else {
    conteudoDaLista = <ItemList itens={itens} onRemover={removerItem} />;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
          <span
            aria-hidden="true"
            className="flex size-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-5">
              <path d="M2 4.5A2.5 2.5 0 0 1 4.5 2h11A2.5 2.5 0 0 1 18 4.5v2.25a.75.75 0 0 1-.75.75H2.75A.75.75 0 0 1 2 6.75V4.5ZM2.75 9a.75.75 0 0 0-.75.75v5.75A2.5 2.5 0 0 0 4.5 18h11a2.5 2.5 0 0 0 2.5-2.5V9.75a.75.75 0 0 0-.75-.75H2.75ZM7 12a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 7 12Z" />
            </svg>
          </span>
          <p className="font-semibold text-slate-900">
            C216 <span className="font-normal text-slate-400">· Laboratório</span>
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Cadastro de itens</h1>
          <p className="mt-2 text-slate-600">
            Adicione itens com um nome e, se quiser, uma descrição.
          </p>
        </div>

        <section
          aria-labelledby="titulo-novo-item"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-8"
        >
          <h2 id="titulo-novo-item" className="mb-5 text-lg font-semibold text-slate-900">
            Novo item
          </h2>
          <ItemForm onAdicionar={adicionarItem} nomesExistentes={itens.map((item) => item.nome)} />
        </section>

        <section
          aria-labelledby="titulo-lista"
          aria-busy={carregando}
          className="flex flex-col gap-4"
        >
          <h2
            id="titulo-lista"
            ref={tituloDaLista}
            tabIndex={-1}
            className="flex items-center gap-2.5 text-lg font-semibold text-slate-900 focus:outline-none"
          >
            Itens cadastrados
            {!carregando && !erroAoCarregar && (
              <>
                {" "}
                <span className="rounded-full bg-slate-200/70 px-2.5 py-0.5 text-sm font-medium tabular-nums text-slate-600">
                  {itens.length}
                </span>
              </>
            )}
          </h2>
          {conteudoDaLista}
        </section>
      </main>

      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center px-4"
      >
        {aviso && (
          <p
            key={aviso.id}
            className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg motion-safe:animate-surgir"
          >
            {aviso.tipo === "erro" ? (
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                className="size-5 text-red-400"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                className="size-5 text-emerald-400"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {aviso.texto}
          </p>
        )}
      </div>
    </div>
  );
}

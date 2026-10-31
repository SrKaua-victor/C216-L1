import { useEffect, useRef, useState } from "react";
import ItemForm from "./components/ItemForm";
import ItemList from "./components/ItemList";

const DURACAO_DO_AVISO_MS = 4000;

export default function App() {
  const [itens, setItens] = useState([]);
  const [aviso, setAviso] = useState(null);
  const proximoId = useRef(1);
  const proximoAviso = useRef(1);
  const tituloDaLista = useRef(null);

  useEffect(() => {
    if (!aviso) {
      return;
    }
    const temporizador = setTimeout(() => setAviso(null), DURACAO_DO_AVISO_MS);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  function avisar(texto) {
    setAviso({ id: proximoAviso.current, texto });
    proximoAviso.current += 1;
  }

  function adicionarItem(item) {
    const novoItem = { id: proximoId.current, ...item };
    proximoId.current += 1;
    setItens((atuais) => [...atuais, novoItem]);
    avisar(`“${novoItem.nome}” foi adicionado.`);
  }

  function removerItem(id) {
    const removido = itens.find((item) => item.id === id);
    setItens((atuais) => atuais.filter((item) => item.id !== id));
    avisar(`“${removido.nome}” foi removido.`);
    tituloDaLista.current.focus();
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

        <section aria-labelledby="titulo-lista" className="flex flex-col gap-4">
          <h2
            id="titulo-lista"
            ref={tituloDaLista}
            tabIndex={-1}
            className="flex items-center gap-2.5 text-lg font-semibold text-slate-900 focus:outline-none"
          >
            Itens cadastrados{" "}
            <span className="rounded-full bg-slate-200/70 px-2.5 py-0.5 text-sm font-medium tabular-nums text-slate-600">
              {itens.length}
            </span>
          </h2>
          <ItemList itens={itens} onRemover={removerItem} />
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
            {aviso.texto}
          </p>
        )}
      </div>
    </div>
  );
}

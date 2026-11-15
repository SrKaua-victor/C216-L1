import { useId, useRef, useState } from "react";
import { LIMITES, validarItem } from "../validation";

const FORMULARIO_VAZIO = { nome: "", descricao: "" };

const ESTILO_CAMPO =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 shadow-xs " +
  "placeholder:text-slate-400 transition focus:border-indigo-500 focus:outline-none " +
  "focus:ring-4 focus:ring-indigo-100 aria-invalid:border-red-400 " +
  "aria-invalid:focus:border-red-500 aria-invalid:focus:ring-red-100";

function Contador({ atual, maximo }) {
  const excedeu = atual > maximo;
  return (
    <span
      className={`text-xs tabular-nums ${excedeu ? "font-medium text-red-600" : "text-slate-400"}`}
    >
      {atual}/{maximo}
    </span>
  );
}

function MensagemDeErro({ id, children }) {
  return (
    <p id={id} role="alert" className="flex items-center gap-1.5 text-sm text-red-600">
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-4 shrink-0">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
          clipRule="evenodd"
        />
      </svg>
      {children}
    </p>
  );
}

export default function ItemForm({ onAdicionar, nomesExistentes = [] }) {
  const [valores, setValores] = useState(FORMULARIO_VAZIO);
  const [erros, setErros] = useState({});
  const [erroDoServidor, setErroDoServidor] = useState("");
  const [enviando, setEnviando] = useState(false);
  const id = useId();
  const campoNome = useRef(null);
  const campoDescricao = useRef(null);

  function atualizar(evento) {
    const { name, value } = evento.target;
    setValores((atuais) => ({ ...atuais, [name]: value }));
    setErros(({ [name]: _corrigido, ...restantes }) => restantes);
    setErroDoServidor("");
  }

  async function enviar(evento) {
    evento.preventDefault();
    if (enviando) {
      return;
    }
    const novosErros = validarItem(valores, nomesExistentes);
    setErros(novosErros);
    setErroDoServidor("");
    if (novosErros.nome) {
      campoNome.current.focus();
      return;
    }
    if (novosErros.descricao) {
      campoDescricao.current.focus();
      return;
    }

    setEnviando(true);
    try {
      await onAdicionar({ nome: valores.nome.trim(), descricao: valores.descricao.trim() });
      setValores(FORMULARIO_VAZIO);
    } catch (erro) {
      if (erro.status === 409) {
        setErros({ nome: erro.message });
      } else {
        setErroDoServidor(erro.message);
      }
    } finally {
      setEnviando(false);
    }
    campoNome.current.focus();
  }

  return (
    <form onSubmit={enviar} noValidate aria-busy={enviando} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor={`${id}-nome`} className="text-sm font-medium text-slate-700">
            Nome
          </label>
          <Contador atual={valores.nome.length} maximo={LIMITES.nomeMaximo} />
        </div>
        <input
          ref={campoNome}
          id={`${id}-nome`}
          name="nome"
          value={valores.nome}
          onChange={atualizar}
          placeholder="Ex.: Caderno universitário"
          autoComplete="off"
          aria-invalid={Boolean(erros.nome)}
          aria-describedby={erros.nome ? `${id}-erro-nome` : undefined}
          className={ESTILO_CAMPO}
        />
        {erros.nome && <MensagemDeErro id={`${id}-erro-nome`}>{erros.nome}</MensagemDeErro>}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor={`${id}-descricao`} className="text-sm font-medium text-slate-700">
            Descrição <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <Contador atual={valores.descricao.length} maximo={LIMITES.descricaoMaxima} />
        </div>
        <textarea
          ref={campoDescricao}
          id={`${id}-descricao`}
          name="descricao"
          rows={4}
          value={valores.descricao}
          onChange={atualizar}
          placeholder="Detalhes que ajudem a identificar o item"
          aria-invalid={Boolean(erros.descricao)}
          aria-describedby={erros.descricao ? `${id}-erro-descricao` : undefined}
          className={`${ESTILO_CAMPO} resize-y`}
        />
        {erros.descricao && (
          <MensagemDeErro id={`${id}-erro-descricao`}>{erros.descricao}</MensagemDeErro>
        )}
      </div>

      {erroDoServidor && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3">
          <MensagemDeErro id={`${id}-erro-servidor`}>{erroDoServidor}</MensagemDeErro>
        </div>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 active:bg-indigo-700 disabled:cursor-wait disabled:bg-indigo-400"
      >
        {enviando ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="size-5 motion-safe:animate-spin"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeOpacity="0.3"
              strokeWidth="3"
            />
            <path
              d="M21 12a9 9 0 0 0-9-9"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-5">
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
        )}
        {enviando ? "Adicionando..." : "Adicionar"}
      </button>
    </form>
  );
}

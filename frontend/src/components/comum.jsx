import { useState } from "react";

export const ESTILO_BOTAO =
  "rounded bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50";

export const ESTILO_BOTAO_SECUNDARIO =
  "rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100 disabled:opacity-50";

export const ESTILO_CELULA = "px-3 py-2";

export const ESTILO_ACAO = "text-slate-700 underline disabled:opacity-50";

export const ESTILO_ACAO_PERIGOSA = "text-red-700 underline disabled:opacity-50";

const ESTILO_ENTRADA = "rounded border border-slate-300 bg-white px-2 py-1.5";

export function Campo({ id, rotulo, erro, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {rotulo}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(erro)}
        aria-describedby={erro ? `${id}-erro` : undefined}
        className={`${ESTILO_ENTRADA} aria-invalid:border-red-500`}
        {...props}
      />
      {erro && (
        <p id={`${id}-erro`} className="text-sm text-red-600">
          {erro}
        </p>
      )}
    </div>
  );
}

export function Selecao({ id, rotulo, erro, opcoes, textoVazio, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {rotulo}
      </label>
      <select
        id={id}
        aria-invalid={Boolean(erro)}
        aria-describedby={erro ? `${id}-erro` : undefined}
        className={`${ESTILO_ENTRADA} aria-invalid:border-red-500`}
        {...props}
      >
        {textoVazio !== undefined && <option value="">{textoVazio}</option>}
        {opcoes.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor} disabled={opcao.desabilitada}>
            {opcao.texto}
          </option>
        ))}
      </select>
      {erro && (
        <p id={`${id}-erro`} className="text-sm text-red-600">
          {erro}
        </p>
      )}
    </div>
  );
}

export function Mensagem({ mensagem }) {
  if (!mensagem) {
    return null;
  }
  const erro = mensagem.tipo === "erro";
  return (
    <p
      role={erro ? "alert" : "status"}
      className={`rounded border px-3 py-2 text-sm ${
        erro
          ? "border-red-300 bg-red-50 text-red-800"
          : "border-green-300 bg-green-50 text-green-800"
      }`}
    >
      {mensagem.texto}
    </p>
  );
}

export function Busca({ rotulo, placeholder, onBuscar }) {
  const [texto, setTexto] = useState("");
  const [ativa, setAtiva] = useState(false);

  function enviar(evento) {
    evento.preventDefault();
    const termo = texto.trim();
    setAtiva(Boolean(termo));
    onBuscar(termo);
  }

  function limpar() {
    setTexto("");
    setAtiva(false);
    onBuscar("");
  }

  return (
    <form onSubmit={enviar} className="flex flex-wrap gap-2">
      <input
        type="search"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        placeholder={placeholder}
        aria-label={rotulo}
        className={`${ESTILO_ENTRADA} min-w-0 flex-1`}
      />
      <button type="submit" className={ESTILO_BOTAO_SECUNDARIO}>
        Buscar
      </button>
      {ativa && (
        <button type="button" onClick={limpar} className={ESTILO_BOTAO_SECUNDARIO}>
          Limpar
        </button>
      )}
    </form>
  );
}

export function EstadoDaLista({ carregando, erro, vazia, textoVazio, onTentarDeNovo, children }) {
  if (carregando && vazia) {
    return <p className="text-sm text-slate-600">Carregando...</p>;
  }
  if (erro) {
    return (
      <div className="flex flex-col items-start gap-2">
        <Mensagem mensagem={{ tipo: "erro", texto: erro }} />
        <button type="button" onClick={onTentarDeNovo} className={ESTILO_BOTAO_SECUNDARIO}>
          Tentar novamente
        </button>
      </div>
    );
  }
  if (vazia) {
    return <p className="text-sm text-slate-600">{textoVazio}</p>;
  }
  return children;
}

export function Tabela({ colunas, children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white text-left text-sm">
        <thead>
          <tr className="border-b border-slate-300 bg-slate-100">
            {colunas.map((coluna) => (
              <th key={coluna} className={ESTILO_CELULA}>
                {coluna}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

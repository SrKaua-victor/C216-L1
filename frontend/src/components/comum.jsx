export const ESTILO_BOTAO =
  "rounded bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50";

export const ESTILO_BOTAO_SECUNDARIO =
  "rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100 disabled:opacity-50";

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
        className="rounded border border-slate-300 bg-white px-2 py-1.5 aria-invalid:border-red-500"
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

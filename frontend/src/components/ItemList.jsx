function EstadoVazio() {
  return (
    <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 px-6 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
          />
        </svg>
      </div>
      <p className="mt-4 font-medium text-slate-700">Nenhum item cadastrado ainda.</p>
      <p className="mt-1 text-sm text-slate-500">Use o formulário para adicionar o primeiro.</p>
    </div>
  );
}

export default function ItemList({ itens, onRemover }) {
  if (itens.length === 0) {
    return <EstadoVazio />;
  }

  return (
    <ul aria-label="Itens cadastrados" className="flex flex-col gap-3">
      {itens.map((item) => (
        <li
          key={item.id}
          className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-slate-300 hover:shadow-sm"
        >
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-semibold text-indigo-600"
          >
            {item.nome.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="font-medium break-words text-slate-900">{item.nome}</p>
            {item.descricao && (
              <p className="mt-1 text-sm break-words whitespace-pre-line text-slate-600">
                {item.descricao}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onRemover(item.id)}
            aria-label={`Remover ${item.nome}`}
            title="Remover"
            className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-5">
              <path
                fillRule="evenodd"
                d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </li>
      ))}
    </ul>
  );
}

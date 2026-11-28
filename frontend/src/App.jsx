import { useState } from "react";
import EmprestimosPagina from "./pages/EmprestimosPagina";
import LeitoresPagina from "./pages/LeitoresPagina";
import LivrosPagina from "./pages/LivrosPagina";

const ABAS = [
  { id: "livros", titulo: "Livros", Pagina: LivrosPagina },
  { id: "leitores", titulo: "Leitores", Pagina: LeitoresPagina },
  { id: "emprestimos", titulo: "Empréstimos", Pagina: EmprestimosPagina },
];

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState(ABAS[0].id);
  const aba = ABAS.find((item) => item.id === abaAtiva);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-6 border-b border-slate-300 pb-4">
        <h1 className="text-2xl font-bold">Biblioteca</h1>
        <p className="text-sm text-slate-600">Cadastro de livros, leitores e empréstimos</p>
        <nav className="mt-4 flex gap-2" aria-label="Seções">
          {ABAS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={item.id === abaAtiva ? "page" : undefined}
              onClick={() => setAbaAtiva(item.id)}
              className={`rounded border px-3 py-1 text-sm ${
                item.id === abaAtiva
                  ? "border-slate-800 bg-slate-800 text-white"
                  : "border-slate-300 bg-white hover:bg-slate-100"
              }`}
            >
              {item.titulo}
            </button>
          ))}
        </nav>
      </header>

      <main>
        <aba.Pagina />
      </main>
    </div>
  );
}

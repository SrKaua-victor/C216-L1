import { useId, useState } from "react";
import { normalizarLivro, validarLivro } from "../validacao";
import { Campo, ESTILO_BOTAO, ESTILO_BOTAO_SECUNDARIO, Mensagem } from "./comum";

const VAZIO = { titulo: "", autor: "", isbn: "", ano_publicacao: "", total_exemplares: "1" };

function valoresIniciais(livro) {
  if (!livro) {
    return VAZIO;
  }
  return {
    titulo: livro.titulo,
    autor: livro.autor,
    isbn: livro.isbn,
    ano_publicacao: String(livro.ano_publicacao),
    total_exemplares: String(livro.total_exemplares),
  };
}

export default function LivroForm({ livro, onSalvar, onCancelar }) {
  const [valores, setValores] = useState(() => valoresIniciais(livro));
  const [erros, setErros] = useState({});
  const [erroDoServidor, setErroDoServidor] = useState("");
  const [enviando, setEnviando] = useState(false);
  const id = useId();

  function atualizar(evento) {
    const { name, value } = evento.target;
    setValores((atuais) => ({ ...atuais, [name]: value }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    const novosErros = validarLivro(valores);
    setErros(novosErros);
    setErroDoServidor("");
    if (Object.keys(novosErros).length > 0) {
      return;
    }
    setEnviando(true);
    try {
      await onSalvar(normalizarLivro(valores));
      setValores(VAZIO);
    } catch (erro) {
      setErroDoServidor(erro.message);
    } finally {
      setEnviando(false);
    }
  }

  function campo(nome, rotulo, props = {}) {
    return (
      <Campo
        id={`${id}-${nome}`}
        name={nome}
        rotulo={rotulo}
        value={valores[nome]}
        onChange={atualizar}
        erro={erros[nome]}
        {...props}
      />
    );
  }

  return (
    <form
      onSubmit={enviar}
      noValidate
      aria-label={livro ? "Editar livro" : "Novo livro"}
      className="flex flex-col gap-3 rounded border border-slate-300 bg-white p-4"
    >
      <h3 className="font-semibold">{livro ? `Editar "${livro.titulo}"` : "Novo livro"}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {campo("titulo", "Título")}
        {campo("autor", "Autor")}
        {campo("isbn", "ISBN")}
        {campo("ano_publicacao", "Ano de publicação", { inputMode: "numeric" })}
        {campo("total_exemplares", "Exemplares", { inputMode: "numeric" })}
      </div>
      {erroDoServidor && <Mensagem mensagem={{ tipo: "erro", texto: erroDoServidor }} />}
      <div className="flex gap-2">
        <button type="submit" disabled={enviando} className={ESTILO_BOTAO}>
          {livro ? "Salvar alterações" : "Cadastrar livro"}
        </button>
        {livro && (
          <button type="button" onClick={onCancelar} className={ESTILO_BOTAO_SECUNDARIO}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

import { useId, useState } from "react";
import { Campo, ESTILO_BOTAO, ESTILO_BOTAO_SECUNDARIO, Mensagem } from "./comum";

export default function Formulario({
  titulo,
  campos,
  valoresIniciais,
  validar,
  normalizar,
  textoDoBotao,
  onSalvar,
  onCancelar,
}) {
  const [valores, setValores] = useState(valoresIniciais);
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
    const novosErros = validar(valores);
    setErros(novosErros);
    setErroDoServidor("");
    if (Object.keys(novosErros).length > 0) {
      return;
    }
    setEnviando(true);
    try {
      await onSalvar(normalizar(valores));
      setValores(valoresIniciais);
    } catch (erro) {
      setErroDoServidor(erro.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={enviar}
      noValidate
      aria-label={titulo}
      className="flex flex-col gap-3 rounded border border-slate-300 bg-white p-4"
    >
      <h3 className="font-semibold">{titulo}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {campos.map(({ nome, rotulo, ...props }) => (
          <Campo
            key={nome}
            id={`${id}-${nome}`}
            name={nome}
            rotulo={rotulo}
            value={valores[nome]}
            onChange={atualizar}
            erro={erros[nome]}
            {...props}
          />
        ))}
      </div>
      {erroDoServidor && <Mensagem mensagem={{ tipo: "erro", texto: erroDoServidor }} />}
      <div className="flex gap-2">
        <button type="submit" disabled={enviando} className={ESTILO_BOTAO}>
          {textoDoBotao}
        </button>
        {onCancelar && (
          <button type="button" onClick={onCancelar} className={ESTILO_BOTAO_SECUNDARIO}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

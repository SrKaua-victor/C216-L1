export const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(
  /\/+$/,
  "",
);

const PREFIXO_DE_VALIDACAO = "Value error, ";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function mensagemDeValidacao(erros) {
  const personalizada = erros
    .map((erro) => erro.msg)
    .find((mensagem) => typeof mensagem === "string" && mensagem.startsWith(PREFIXO_DE_VALIDACAO));
  return personalizada
    ? personalizada.slice(PREFIXO_DE_VALIDACAO.length)
    : "Os dados enviados são inválidos.";
}

async function mensagemDeErro(resposta) {
  const generica = `O servidor respondeu com erro ${resposta.status}.`;
  try {
    const corpo = await resposta.json();
    if (typeof corpo.detail === "string") {
      return corpo.detail;
    }
    if (Array.isArray(corpo.detail)) {
      return mensagemDeValidacao(corpo.detail);
    }
  } catch {
    return generica;
  }
  return generica;
}

export function comParametros(caminho, parametros) {
  const preenchidos = Object.entries(parametros).filter(([, valor]) => valor);
  return preenchidos.length ? `${caminho}?${new URLSearchParams(preenchidos)}` : caminho;
}

export function enviarJson(metodo, dados) {
  return {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  };
}

export async function requisitar(caminho, opcoes = {}) {
  let resposta;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, opcoes);
  } catch {
    throw new ApiError(
      "Não foi possível conectar ao servidor. Verifique se o backend está no ar.",
      0,
    );
  }
  if (!resposta.ok) {
    throw new ApiError(await mensagemDeErro(resposta), resposta.status);
  }
  return resposta.status === 204 ? null : resposta.json();
}

export const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(
  /\/+$/,
  "",
);

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function mensagemDeErro(resposta) {
  try {
    const corpo = await resposta.json();
    if (typeof corpo.detail === "string") {
      return corpo.detail;
    }
    if (Array.isArray(corpo.detail)) {
      return "Os dados enviados são inválidos.";
    }
  } catch {
    return `O servidor respondeu com erro ${resposta.status}.`;
  }
  return `O servidor respondeu com erro ${resposta.status}.`;
}

async function requisitar(caminho, opcoes = {}) {
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

export function listItems() {
  return requisitar("/items/");
}

export function createItem(item) {
  return requisitar("/items/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
}

export function deleteItem(id) {
  return requisitar(`/items/${id}`, { method: "DELETE" });
}

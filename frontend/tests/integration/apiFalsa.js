import { vi } from "vitest";

export function simularApi(rotas) {
  const fetchFalso = vi.fn(async (url, opcoes = {}) => {
    const { pathname, search } = new URL(url);
    const chave = `${opcoes.method ?? "GET"} ${pathname}${search}`;
    const rota = rotas[chave];
    if (!rota) {
      return new Response(JSON.stringify({ detail: `Rota não simulada: ${chave}` }), {
        status: 500,
      });
    }
    const corpo = opcoes.body ? JSON.parse(opcoes.body) : undefined;
    const [status, resposta] = typeof rota === "function" ? rota(corpo) : [200, rota];
    return new Response(resposta === undefined ? null : JSON.stringify(resposta), { status });
  });
  vi.stubGlobal("fetch", fetchFalso);
  return fetchFalso;
}

export function corpoEnviado(fetchFalso, metodo) {
  const chamada = fetchFalso.mock.calls.find(([, opcoes]) => opcoes?.method === metodo);
  return JSON.parse(chamada[1].body);
}

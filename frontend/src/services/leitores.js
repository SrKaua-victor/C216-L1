import { comParametros, enviarJson, requisitar } from "./api";

export function listarLeitores(busca = "") {
  return requisitar(comParametros("/leitores", { busca: busca.trim() }));
}

export function criarLeitor(leitor) {
  return requisitar("/leitores", enviarJson("POST", leitor));
}

export function atualizarLeitor(id, leitor) {
  return requisitar(`/leitores/${id}`, enviarJson("PUT", leitor));
}

export function removerLeitor(id) {
  return requisitar(`/leitores/${id}`, { method: "DELETE" });
}

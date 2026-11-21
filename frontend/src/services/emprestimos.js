import { comParametros, enviarJson, requisitar } from "./api";

export function listarEmprestimos(situacao = "") {
  return requisitar(comParametros("/emprestimos", { situacao }));
}

export function criarEmprestimo(livroId, leitorId) {
  return requisitar("/emprestimos", enviarJson("POST", { livro_id: livroId, leitor_id: leitorId }));
}

export function renovarEmprestimo(id) {
  return requisitar(`/emprestimos/${id}/renovacao`, { method: "POST" });
}

export function devolverEmprestimo(id) {
  return requisitar(`/emprestimos/${id}/devolucao`, { method: "POST" });
}

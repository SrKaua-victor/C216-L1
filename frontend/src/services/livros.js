import { comParametros, enviarJson, requisitar } from "./api";

export function listarLivros(busca = "") {
  return requisitar(comParametros("/livros", { busca: busca.trim() }));
}

export function criarLivro(livro) {
  return requisitar("/livros", enviarJson("POST", livro));
}

export function atualizarLivro(id, livro) {
  return requisitar(`/livros/${id}`, enviarJson("PUT", livro));
}

export function removerLivro(id) {
  return requisitar(`/livros/${id}`, { method: "DELETE" });
}

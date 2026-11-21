export const ANO_MINIMO = 1450;
export const EXEMPLARES_MAXIMO = 1000;

function normalizarIsbn(isbn) {
  return isbn.replace(/[-\s]/g, "").toUpperCase();
}

function inteiro(valor) {
  return /^\d+$/.test(String(valor).trim()) ? Number(valor) : Number.NaN;
}

export function validarLivro({ titulo, autor, isbn, ano_publicacao, total_exemplares }) {
  const erros = {};
  const anoAtual = new Date().getFullYear();

  if (!titulo.trim()) {
    erros.titulo = "Informe o título.";
  } else if (titulo.trim().length > 200) {
    erros.titulo = "O título deve ter no máximo 200 caracteres.";
  }

  if (autor.trim().length < 2) {
    erros.autor = "Informe o autor com pelo menos 2 caracteres.";
  } else if (autor.trim().length > 150) {
    erros.autor = "O autor deve ter no máximo 150 caracteres.";
  }

  if (!/^(\d{9}[\dX]|\d{13})$/.test(normalizarIsbn(isbn))) {
    erros.isbn = "Informe um ISBN com 10 ou 13 dígitos.";
  }

  const ano = inteiro(ano_publicacao);
  if (!(ano >= ANO_MINIMO && ano <= anoAtual)) {
    erros.ano_publicacao = `Informe um ano entre ${ANO_MINIMO} e ${anoAtual}.`;
  }

  const exemplares = inteiro(total_exemplares);
  if (!(exemplares >= 1 && exemplares <= EXEMPLARES_MAXIMO)) {
    erros.total_exemplares = `Informe entre 1 e ${EXEMPLARES_MAXIMO} exemplares.`;
  }

  return erros;
}

export function normalizarLivro({ titulo, autor, isbn, ano_publicacao, total_exemplares }) {
  return {
    titulo: titulo.trim(),
    autor: autor.trim(),
    isbn: normalizarIsbn(isbn),
    ano_publicacao: Number(ano_publicacao),
    total_exemplares: Number(total_exemplares),
  };
}

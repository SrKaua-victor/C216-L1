export const LIMITES = {
  nomeMinimo: 3,
  nomeMaximo: 50,
  descricaoMaxima: 200,
};

export function validarItem({ nome = "", descricao = "" }, nomesExistentes = []) {
  const erros = {};
  const nomeLimpo = nome.trim();
  const descricaoLimpa = descricao.trim();

  if (nomeLimpo === "") {
    erros.nome = "Informe o nome do item.";
  } else if (nomeLimpo.length < LIMITES.nomeMinimo) {
    erros.nome = `O nome deve ter pelo menos ${LIMITES.nomeMinimo} caracteres.`;
  } else if (nomeLimpo.length > LIMITES.nomeMaximo) {
    erros.nome = `O nome deve ter no máximo ${LIMITES.nomeMaximo} caracteres.`;
  } else if (
    nomesExistentes.some((existente) => existente.toLowerCase() === nomeLimpo.toLowerCase())
  ) {
    erros.nome = "Já existe um item com esse nome.";
  }

  if (descricaoLimpa.length > LIMITES.descricaoMaxima) {
    erros.descricao = `A descrição deve ter no máximo ${LIMITES.descricaoMaxima} caracteres.`;
  }

  return erros;
}

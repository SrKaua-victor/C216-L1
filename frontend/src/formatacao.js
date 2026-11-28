const MOEDA = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatarTelefone(telefone) {
  if (!telefone) {
    return "-";
  }
  const meio = telefone.length - 4;
  return `(${telefone.slice(0, 2)}) ${telefone.slice(2, meio)}-${telefone.slice(meio)}`;
}

export function formatarData(data) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function formatarMoeda(valor) {
  return MOEDA.format(valor);
}

export function dataDeHoje(agora = new Date()) {
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

export function situacaoDoEmprestimo(emprestimo, hoje = dataDeHoje()) {
  if (emprestimo.data_devolucao) {
    return "Devolvido";
  }
  return hoje > emprestimo.data_prevista_devolucao ? "Atrasado" : "Ativo";
}

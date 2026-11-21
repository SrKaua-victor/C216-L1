export function formatarTelefone(telefone) {
  if (!telefone) {
    return "-";
  }
  const meio = telefone.length - 4;
  return `(${telefone.slice(0, 2)}) ${telefone.slice(2, meio)}-${telefone.slice(meio)}`;
}

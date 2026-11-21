import { useCallback, useEffect, useState } from "react";

export function useLista(buscar, filtro) {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setItens(await buscar(filtro));
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setCarregando(false);
    }
  }, [buscar, filtro]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { itens, carregando, erro, recarregar };
}

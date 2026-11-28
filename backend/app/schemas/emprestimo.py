from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class EmprestimoCreate(BaseModel):
    livro_id: int = Field(ge=1)
    leitor_id: int = Field(ge=1)


class LivroResumo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    titulo: str


class LeitorResumo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str


class EmprestimoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    livro: LivroResumo
    leitor: LeitorResumo
    data_emprestimo: date
    data_prevista_devolucao: date
    data_devolucao: date | None
    renovacoes: int
    multa: float

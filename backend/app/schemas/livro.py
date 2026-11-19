from datetime import date
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

ANO_MINIMO = 1450
EXEMPLARES_MAXIMO = 1000

Titulo = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
Autor = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=150)]


def normalizar_isbn(valor: str) -> str:
    return valor.replace("-", "").replace(" ", "").upper()


def isbn_valido(isbn: str) -> bool:
    if len(isbn) == 13 and isbn.isdigit():
        pesos = [1 if posicao % 2 == 0 else 3 for posicao in range(13)]
        soma = sum(int(digito) * peso for digito, peso in zip(isbn, pesos, strict=True))
        return soma % 10 == 0
    if len(isbn) == 10 and isbn[:9].isdigit() and (isbn[9].isdigit() or isbn[9] == "X"):
        valores = [int(digito) for digito in isbn[:9]] + [10 if isbn[9] == "X" else int(isbn[9])]
        soma = sum(valor * (10 - posicao) for posicao, valor in enumerate(valores))
        return soma % 11 == 0
    return False


class LivroBase(BaseModel):
    titulo: Titulo
    autor: Autor
    isbn: str
    ano_publicacao: int = Field(ge=ANO_MINIMO)
    total_exemplares: int = Field(default=1, ge=1, le=EXEMPLARES_MAXIMO)

    @field_validator("isbn")
    @classmethod
    def validar_isbn(cls, valor: str) -> str:
        isbn = normalizar_isbn(valor)
        if not isbn_valido(isbn):
            raise ValueError("ISBN inválido: informe um ISBN-10 ou ISBN-13 com dígito verificador")
        return isbn

    @field_validator("ano_publicacao")
    @classmethod
    def validar_ano(cls, valor: int) -> int:
        if valor > date.today().year:
            raise ValueError("O ano de publicação não pode estar no futuro")
        return valor


class LivroCreate(LivroBase):
    pass


class LivroUpdate(LivroBase):
    pass


class LivroResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    titulo: str
    autor: str
    isbn: str
    ano_publicacao: int
    total_exemplares: int
    exemplares_disponiveis: int

import re
from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints, field_validator

EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"

Nome = Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=100)]
Email = Annotated[
    str,
    StringConstraints(strip_whitespace=True, to_lower=True, max_length=255, pattern=EMAIL_PATTERN),
]


class LeitorBase(BaseModel):
    nome: Nome
    email: Email
    telefone: str | None = None

    @field_validator("telefone")
    @classmethod
    def validar_telefone(cls, valor: str | None) -> str | None:
        if valor is None:
            return None
        digitos = re.sub(r"\D", "", valor)
        if not digitos:
            return None
        if len(digitos) not in (10, 11):
            raise ValueError("Telefone inválido: informe DDD e número, com 10 ou 11 dígitos")
        return digitos


class LeitorCreate(LeitorBase):
    pass


class LeitorUpdate(LeitorBase):
    pass


class LeitorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    email: str
    telefone: str | None

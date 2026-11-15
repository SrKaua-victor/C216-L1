from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints

Nome = Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=50)]
Descricao = Annotated[str, StringConstraints(strip_whitespace=True, max_length=200)]


class ItemCreate(BaseModel):
    nome: Nome
    descricao: Descricao = ""


class ItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    descricao: str

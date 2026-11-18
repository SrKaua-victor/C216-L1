from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

ORIGENS_PADRAO = [
    "http://localhost:5173",
    "http://localhost:4173",
]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    cors_origins: Annotated[list[str], NoDecode] = ORIGENS_PADRAO

    @field_validator("cors_origins", mode="before")
    @classmethod
    def separar_origens(cls, valor: str | list[str]) -> list[str]:
        if isinstance(valor, str):
            valor = valor.split(",")
        origens = [origem.strip().rstrip("/") for origem in valor if origem.strip()]
        if "*" in origens:
            raise ValueError("CORS_ORIGINS deve listar origens explicitas, sem o curinga '*'")
        return origens


settings = Settings()

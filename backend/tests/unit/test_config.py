import pytest
from pydantic import ValidationError

from app.core.config import ORIGENS_PADRAO, Settings


def test_usa_origens_padrao_sem_variavel_de_ambiente(monkeypatch):
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    assert Settings(_env_file=None).cors_origins == ORIGENS_PADRAO


def test_separa_origens_por_virgula_e_remove_barra_final(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", " http://localhost:5173/ , http://exemplo.com ,")
    assert Settings(_env_file=None).cors_origins == [
        "http://localhost:5173",
        "http://exemplo.com",
    ]


def test_rejeita_curinga(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "*")
    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_le_url_do_banco_da_variavel_de_ambiente(monkeypatch):
    url = "postgresql+psycopg://usuario:senha@db:5432/outra"
    monkeypatch.setenv("DATABASE_URL", url)
    assert Settings(_env_file=None).database_url == url


def test_url_padrao_aponta_para_o_postgres_local(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    assert Settings(_env_file=None).database_url.startswith("postgresql+psycopg://")

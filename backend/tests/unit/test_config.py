import pytest
from pydantic import ValidationError

from app.core.config import ORIGENS_PADRAO, Settings


def test_usa_as_origens_padrao_sem_a_variavel(monkeypatch):
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    assert Settings(_env_file=None).cors_origins == ORIGENS_PADRAO


def test_le_cors_origins_separado_por_virgulas(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:3000,https://app.exemplo.com")
    assert Settings(_env_file=None).cors_origins == [
        "http://localhost:3000",
        "https://app.exemplo.com",
    ]


def test_ignora_espacos_itens_vazios_e_barra_final(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", " http://localhost:3000/ , ,https://app.exemplo.com ")
    assert Settings(_env_file=None).cors_origins == [
        "http://localhost:3000",
        "https://app.exemplo.com",
    ]


def test_recusa_o_curinga(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:3000,*")
    with pytest.raises(ValidationError, match="origens explicitas"):
        Settings(_env_file=None)

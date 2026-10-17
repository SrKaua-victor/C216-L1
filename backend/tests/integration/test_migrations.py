from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect

BACKEND_DIR = Path(__file__).resolve().parents[2]


def _config(url: str) -> Config:
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("sqlalchemy.url", url)
    return config


def _tabelas(url: str) -> set[str]:
    engine = create_engine(url)
    try:
        return set(inspect(engine).get_table_names())
    finally:
        engine.dispose()


def _url_sqlite(tmp_path: Path) -> str:
    return f"sqlite+pysqlite:///{(tmp_path / 'migracao.db').as_posix()}"


def test_migrations_criam_e_removem_as_tabelas(tmp_path):
    url = _url_sqlite(tmp_path)
    config = _config(url)
    command.upgrade(config, "head")
    assert "users" in _tabelas(url)
    command.downgrade(config, "base")
    assert "users" not in _tabelas(url)


def test_migrations_correspondem_aos_modelos_orm(tmp_path):
    config = _config(_url_sqlite(tmp_path))
    command.upgrade(config, "head")
    command.check(config)

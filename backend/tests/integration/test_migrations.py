from pathlib import Path

from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory

BACKEND_DIR = Path(__file__).resolve().parents[2]


def _config(url: str) -> Config:
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("sqlalchemy.url", url)
    return config


def _url_sqlite(tmp_path: Path) -> str:
    return f"sqlite+pysqlite:///{(tmp_path / 'migracao.db').as_posix()}"


def test_historico_de_migrations_tem_uma_unica_cabeca(tmp_path):
    scripts = ScriptDirectory.from_config(_config(_url_sqlite(tmp_path)))
    assert len(scripts.get_heads()) <= 1


def test_migrations_sobem_e_descem_sem_erro(tmp_path):
    config = _config(_url_sqlite(tmp_path))
    command.upgrade(config, "head")
    command.downgrade(config, "base")


def test_migrations_correspondem_aos_modelos_orm(tmp_path):
    config = _config(_url_sqlite(tmp_path))
    command.upgrade(config, "head")
    command.check(config)

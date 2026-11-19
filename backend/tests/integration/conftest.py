import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "sqlite+pysqlite:///:memory:")


def _ativar_chaves_estrangeiras(conexao, _registro):
    cursor = conexao.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


@pytest.fixture(scope="session")
def engine():
    if TEST_DATABASE_URL.startswith("sqlite"):
        engine = create_engine(
            TEST_DATABASE_URL,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        event.listen(engine, "connect", _ativar_chaves_estrangeiras)
    else:
        engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def db_session(engine):
    sessao_de_teste = sessionmaker(bind=engine, expire_on_commit=False)
    with sessao_de_teste() as session:
        yield session
    tabelas = Base.metadata.sorted_tables
    if not tabelas:
        return
    with engine.begin() as connection:
        if connection.dialect.name == "postgresql":
            nomes = ", ".join(tabela.name for tabela in tabelas)
            connection.execute(text(f"TRUNCATE {nomes} RESTART IDENTITY CASCADE"))
        else:
            for tabela in reversed(tabelas):
                connection.execute(tabela.delete())


@pytest.fixture
def client(db_session):
    app.dependency_overrides[get_db] = lambda: db_session
    with TestClient(app) as cliente:
        yield cliente
    app.dependency_overrides.clear()

import pytest
from fastapi.testclient import TestClient

from main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as cliente:
        yield cliente


@pytest.fixture
def rotas_validas():
    return ["/", "/health"]

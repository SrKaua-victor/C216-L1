import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routes.user import get_user_service
from app.services.user import UserService


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as cliente:
        yield cliente


@pytest.fixture
def rotas_validas():
    return ["/", "/health"]


@pytest.fixture
def user_service():
    service = UserService()
    app.dependency_overrides[get_user_service] = lambda: service
    yield service
    app.dependency_overrides.clear()

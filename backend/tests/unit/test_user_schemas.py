import pytest
from pydantic import ValidationError

from app.schemas.user import UserCreate, UserPatch


def test_user_create_aceita_dados_validos():
    usuario = UserCreate(nome="Ana", email="ana@email.com")
    assert (usuario.nome, usuario.email) == ("Ana", "ana@email.com")


@pytest.mark.parametrize(
    "dados",
    [
        {"nome": "", "email": "ana@email.com"},
        {"nome": "A" * 101, "email": "ana@email.com"},
        {"nome": "Ana", "email": "sem-arroba"},
        {"nome": "Ana", "email": "ana@semdominio"},
        {"nome": "Ana"},
        {"email": "ana@email.com"},
    ],
)
def test_user_create_rejeita_dados_invalidos(dados):
    with pytest.raises(ValidationError):
        UserCreate(**dados)


def test_user_patch_aceita_corpo_vazio():
    assert UserPatch().model_dump(exclude_unset=True) == {}


def test_user_patch_valida_email_quando_enviado():
    with pytest.raises(ValidationError):
        UserPatch(email="sem-arroba")

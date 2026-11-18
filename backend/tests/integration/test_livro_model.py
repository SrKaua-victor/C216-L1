import pytest
from sqlalchemy.exc import IntegrityError

from app.models.livro import Livro


def _livro(**dados) -> Livro:
    padrao = {
        "titulo": "Dom Casmurro",
        "autor": "Machado de Assis",
        "isbn": "9788535910663",
        "ano_publicacao": 1899,
        "total_exemplares": 2,
    }
    return Livro(**(padrao | dados))


def test_salva_e_recupera_livro(db_session):
    livro = _livro()
    db_session.add(livro)
    db_session.commit()

    salvo = db_session.get(Livro, livro.id)
    assert (salvo.titulo, salvo.isbn, salvo.total_exemplares) == (
        "Dom Casmurro",
        "9788535910663",
        2,
    )


def test_isbn_deve_ser_unico_no_banco(db_session):
    db_session.add(_livro())
    db_session.commit()

    db_session.add(_livro(titulo="Outro titulo"))
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_banco_rejeita_livro_sem_exemplares(db_session):
    db_session.add(_livro(total_exemplares=0))
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

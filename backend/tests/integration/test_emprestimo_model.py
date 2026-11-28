from datetime import date, timedelta

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.models import Emprestimo, Leitor, Livro

HOJE = date(2026, 11, 19)


@pytest.fixture
def livro_e_leitor(db_session):
    livro = Livro(
        titulo="Dom Casmurro",
        autor="Machado de Assis",
        isbn="9788535910667",
        ano_publicacao=1899,
        total_exemplares=1,
    )
    leitor = Leitor(nome="Ana Souza", email="ana@email.com")
    db_session.add_all([livro, leitor])
    db_session.commit()
    return livro, leitor


def _emprestimo(livro, leitor, **dados) -> Emprestimo:
    padrao = {"data_emprestimo": HOJE, "data_prevista_devolucao": HOJE + timedelta(days=14)}
    return Emprestimo(livro=livro, leitor=leitor, **(padrao | dados))


def test_salva_emprestimo_com_valores_padrao(db_session, livro_e_leitor):
    livro, leitor = livro_e_leitor
    emprestimo = _emprestimo(livro, leitor)
    db_session.add(emprestimo)
    db_session.commit()

    assert (emprestimo.renovacoes, emprestimo.multa, emprestimo.data_devolucao) == (0, 0, None)
    assert [item.id for item in leitor.emprestimos] == [emprestimo.id]


def test_banco_rejeita_prazo_anterior_ao_emprestimo(db_session, livro_e_leitor):
    livro, leitor = livro_e_leitor
    db_session.add(_emprestimo(livro, leitor, data_prevista_devolucao=HOJE - timedelta(days=1)))
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_remover_livro_apaga_o_historico_de_emprestimos(db_session, livro_e_leitor):
    livro, leitor = livro_e_leitor
    db_session.add(_emprestimo(livro, leitor, data_devolucao=HOJE))
    db_session.commit()

    db_session.delete(livro)
    db_session.commit()

    assert db_session.scalars(select(Emprestimo)).all() == []

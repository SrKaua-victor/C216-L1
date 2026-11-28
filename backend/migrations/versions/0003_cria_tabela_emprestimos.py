from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | Sequence[str] | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "emprestimos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("livro_id", sa.Integer(), nullable=False),
        sa.Column("leitor_id", sa.Integer(), nullable=False),
        sa.Column("data_emprestimo", sa.Date(), nullable=False),
        sa.Column("data_prevista_devolucao", sa.Date(), nullable=False),
        sa.Column("data_devolucao", sa.Date(), nullable=True),
        sa.Column("renovacoes", sa.Integer(), nullable=False),
        sa.Column("multa", sa.Numeric(precision=8, scale=2), nullable=False),
        sa.CheckConstraint(
            "data_devolucao IS NULL OR data_devolucao >= data_emprestimo",
            name=op.f("ck_emprestimos_devolucao_valida"),
        ),
        sa.CheckConstraint(
            "data_prevista_devolucao >= data_emprestimo", name=op.f("ck_emprestimos_prazo_valido")
        ),
        sa.CheckConstraint("multa >= 0", name=op.f("ck_emprestimos_multa_nao_negativa")),
        sa.CheckConstraint("renovacoes >= 0", name=op.f("ck_emprestimos_renovacoes_nao_negativas")),
        sa.ForeignKeyConstraint(
            ["leitor_id"],
            ["leitores.id"],
            name=op.f("fk_emprestimos_leitor_id_leitores"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["livro_id"],
            ["livros.id"],
            name=op.f("fk_emprestimos_livro_id_livros"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_emprestimos")),
    )
    op.create_index(op.f("ix_emprestimos_leitor_id"), "emprestimos", ["leitor_id"], unique=False)
    op.create_index(op.f("ix_emprestimos_livro_id"), "emprestimos", ["livro_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_emprestimos_livro_id"), table_name="emprestimos")
    op.drop_index(op.f("ix_emprestimos_leitor_id"), table_name="emprestimos")
    op.drop_table("emprestimos")

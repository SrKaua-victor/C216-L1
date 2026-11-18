from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "livros",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("titulo", sa.String(length=200), nullable=False),
        sa.Column("autor", sa.String(length=150), nullable=False),
        sa.Column("isbn", sa.String(length=13), nullable=False),
        sa.Column("ano_publicacao", sa.Integer(), nullable=False),
        sa.Column("total_exemplares", sa.Integer(), nullable=False),
        sa.CheckConstraint(
            "total_exemplares >= 1", name=op.f("ck_livros_total_exemplares_positivo")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_livros")),
        sa.UniqueConstraint("isbn", name=op.f("uq_livros_isbn")),
    )
    op.create_index(op.f("ix_livros_titulo"), "livros", ["titulo"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_livros_titulo"), table_name="livros")
    op.drop_table("livros")

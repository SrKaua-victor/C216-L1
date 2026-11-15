"""cria tabela items

Revision ID: 0002
Revises: 0001
Create Date: 2026-11-14 20:25:12.450726

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: str | Sequence[str] | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=50), nullable=False),
        sa.Column("descricao", sa.String(length=200), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_items")),
        sa.UniqueConstraint("nome", name=op.f("uq_items_nome")),
    )


def downgrade() -> None:
    op.drop_table("items")

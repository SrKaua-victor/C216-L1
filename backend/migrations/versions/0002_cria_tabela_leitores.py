from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: str | Sequence[str] | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "leitores",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("telefone", sa.String(length=11), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_leitores")),
        sa.UniqueConstraint("email", name=op.f("uq_leitores_email")),
    )
    op.create_index(op.f("ix_leitores_nome"), "leitores", ["nome"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_leitores_nome"), table_name="leitores")
    op.drop_table("leitores")

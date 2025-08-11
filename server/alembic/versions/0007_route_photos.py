"""route photos table

Revision ID: 0007_route_photos
Revises: 0006_likes_table_and_unique_route_user
Create Date: 2025-08-11
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0007'
down_revision = '0006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'route_photos',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('route_id', sa.Integer(), sa.ForeignKey('routes.id', ondelete='CASCADE'), nullable=False),
        sa.Column('author_id', sa.Integer(), nullable=True),
        sa.Column('url', sa.String(length=500), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )


def downgrade() -> None:
    op.drop_table('route_photos')



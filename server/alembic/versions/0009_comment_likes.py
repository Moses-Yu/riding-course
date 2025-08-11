from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0009'
down_revision = '0008'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'comment_likes',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('comment_id', sa.Integer, sa.ForeignKey('comments.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer, nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_unique_constraint('uq_comment_likes_comment_user', 'comment_likes', ['comment_id', 'user_id'])
    op.create_index('ix_comment_likes_comment_id', 'comment_likes', ['comment_id'])
    op.create_index('ix_comment_likes_user_id', 'comment_likes', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_comment_likes_user_id', table_name='comment_likes')
    op.drop_index('ix_comment_likes_comment_id', table_name='comment_likes')
    op.drop_constraint('uq_comment_likes_comment_user', 'comment_likes', type_='unique')
    op.drop_table('comment_likes')

"""comment likes table

Revision ID: 0009_comment_likes
Revises: 0008
Create Date: 2025-08-11
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0009'
down_revision = '0008'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'comment_likes',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('comment_id', sa.Integer(), sa.ForeignKey('comments.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_unique_constraint('uq_comment_likes_comment_user', 'comment_likes', ['comment_id', 'user_id'])


def downgrade() -> None:
    op.drop_constraint('uq_comment_likes_comment_user', 'comment_likes', type_='unique')
    op.drop_table('comment_likes')




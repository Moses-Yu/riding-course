from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0006'
down_revision = '0005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'likes',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('route_id', sa.Integer, sa.ForeignKey('routes.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer, nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_unique_constraint('uq_likes_route_user', 'likes', ['route_id', 'user_id'])
    op.create_index('ix_likes_route_id', 'likes', ['route_id'])
    op.create_index('ix_likes_user_id', 'likes', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_likes_user_id', table_name='likes')
    op.drop_index('ix_likes_route_id', table_name='likes')
    op.drop_constraint('uq_likes_route_user', 'likes', type_='unique')
    op.drop_table('likes')



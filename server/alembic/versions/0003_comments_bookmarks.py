from alembic import op
import sqlalchemy as sa

revision = '0003'
down_revision = '0002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'comments',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('route_id', sa.Integer, sa.ForeignKey('routes.id', ondelete='CASCADE'), nullable=False),
        sa.Column('author_id', sa.Integer, nullable=True),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_comments_route_id_created_at', 'comments', ['route_id', 'created_at'])

    op.create_table(
        'bookmarks',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('route_id', sa.Integer, sa.ForeignKey('routes.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_bookmarks_route_id', 'bookmarks', ['route_id'])
    op.create_index('ix_bookmarks_user_id', 'bookmarks', ['user_id'])
    op.create_unique_constraint('uq_bookmarks_route_user', 'bookmarks', ['route_id', 'user_id'])


def downgrade() -> None:
    op.drop_constraint('uq_bookmarks_route_user', 'bookmarks', type_='unique')
    op.drop_index('ix_bookmarks_user_id', table_name='bookmarks')
    op.drop_index('ix_bookmarks_route_id', table_name='bookmarks')
    op.drop_table('bookmarks')
    op.drop_index('ix_comments_route_id_created_at', table_name='comments')
    op.drop_table('comments')


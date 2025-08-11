from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'route_open_events',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('route_id', sa.Integer, sa.ForeignKey('routes.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('user_agent', sa.String(255), nullable=True),
        sa.Column('referrer', sa.String(255), nullable=True),
        sa.Column('platform', sa.String(50), nullable=True),
    )
    op.create_index('ix_route_open_events_route_id_created_at', 'route_open_events', ['route_id', 'created_at'])


def downgrade() -> None:
    op.drop_index('ix_route_open_events_route_id_created_at', table_name='route_open_events')
    op.drop_table('route_open_events')


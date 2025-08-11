from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'routes',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('author_id', sa.Integer, nullable=True),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('summary', sa.String(1000), nullable=True),
        sa.Column('region1', sa.String(100), nullable=True),
        sa.Column('region2', sa.String(100), nullable=True),
        sa.Column('length_km', sa.Float, nullable=True),
        sa.Column('duration_min', sa.Integer, nullable=True),
        sa.Column('stars_scenery', sa.Integer, nullable=True),
        sa.Column('stars_difficulty', sa.Integer, nullable=True),
        sa.Column('surface', sa.String(50), nullable=True),
        sa.Column('traffic', sa.String(50), nullable=True),
        sa.Column('speedbump', sa.Integer, nullable=True),
        sa.Column('enforcement', sa.Integer, nullable=True),
        sa.Column('signal', sa.Integer, nullable=True),
        sa.Column('tags_bitmask', sa.BigInteger, nullable=True),
        sa.Column('open_url', sa.Text, nullable=False),
        sa.Column('nmap_url', sa.Text, nullable=True),
        sa.Column('like_count', sa.Integer, nullable=False, server_default='0'),
        sa.Column('comment_count', sa.Integer, nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )

    op.create_table(
        'route_points',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('route_id', sa.Integer, sa.ForeignKey('routes.id', ondelete='CASCADE')), 
        sa.Column('seq', sa.Integer, nullable=False),
        sa.Column('lat', sa.Float, nullable=False),
        sa.Column('lng', sa.Float, nullable=False),
        sa.Column('name', sa.String(200), nullable=True),
        sa.Column('type', sa.String(20), nullable=True),
    )
    op.create_index('ix_route_points_route_id_seq', 'route_points', ['route_id', 'seq'])


def downgrade() -> None:
    op.drop_index('ix_route_points_route_id_seq', table_name='route_points')
    op.drop_table('route_points')
    op.drop_table('routes')


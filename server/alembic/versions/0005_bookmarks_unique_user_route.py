from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0005'
down_revision = '0004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop old non-unique index if it exists
    try:
        op.drop_index('ix_bookmarks_route_id', table_name='bookmarks')
    except Exception:
        # Index might not exist in some environments; ignore
        pass
    # Add unique constraint on (route_id, user_id)
    try:
        op.create_unique_constraint('uq_bookmarks_route_user', 'bookmarks', ['route_id', 'user_id'])
    except Exception:
        # Constraint already exists; ignore to keep migration idempotent across environments
        pass


def downgrade() -> None:
    # Remove unique constraint
    try:
        op.drop_constraint('uq_bookmarks_route_user', 'bookmarks', type_='unique')
    except Exception:
        pass
    # Recreate the old non-unique index for backwards compatibility
    op.create_index('ix_bookmarks_route_id', 'bookmarks', ['route_id'])



"""add created_at updated_at to Location Asset User LoadCapacity

Revision ID: 217500972505
Revises: a1b2c3d4e5f6
Create Date: 2026-05-06 15:04:49.438315

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '217500972505'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    # SQLite requires server_default when adding NOT NULL columns
    with op.batch_alter_table('assets', schema=None) as batch_op:
        batch_op.add_column(sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()))
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()))

    with op.batch_alter_table('load_capacities', schema=None) as batch_op:
        batch_op.add_column(sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()))
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()))

    with op.batch_alter_table('locations', schema=None) as batch_op:
        batch_op.add_column(sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()))
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()))

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()))
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()))


def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('updated_at')
        batch_op.drop_column('created_at')

    with op.batch_alter_table('locations', schema=None) as batch_op:
        batch_op.drop_column('updated_at')
        batch_op.drop_column('created_at')

    with op.batch_alter_table('load_capacities', schema=None) as batch_op:
        batch_op.drop_column('updated_at')
        batch_op.drop_column('created_at')

    with op.batch_alter_table('assets', schema=None) as batch_op:
        batch_op.drop_column('updated_at')
        batch_op.drop_column('created_at')

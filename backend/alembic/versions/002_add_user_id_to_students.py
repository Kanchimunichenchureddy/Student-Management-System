"""Add user_id column to students table

Revision ID: 002
Revises: 001_initial_schema
Create Date: 2026-01-27

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add user_id column to students table
    op.add_column('students', sa.Column('user_id', sa.Integer(), nullable=True))
    
    # Create foreign key constraint
    op.create_foreign_key(
        'fk_students_user_id',
        'students', 'users',
        ['user_id'], ['id']
    )
    
    # Create unique constraint on user_id (one student per user)
    op.create_unique_constraint('uq_students_user_id', 'students', ['user_id'])
    
    # Create index on user_id for faster lookups
    op.create_index('ix_students_user_id', 'students', ['user_id'])


def downgrade() -> None:
    # Drop index
    op.drop_index('ix_students_user_id', table_name='students')
    
    # Drop unique constraint
    op.drop_constraint('uq_students_user_id', 'students', type_='unique')
    
    # Drop foreign key
    op.drop_constraint('fk_students_user_id', 'students', type_='foreignkey')
    
    # Drop column
    op.drop_column('students', 'user_id')

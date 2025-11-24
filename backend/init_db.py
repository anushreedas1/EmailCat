"""Database initialization script.

This script creates all database tables and can be run independently
to set up the database schema.
"""
import sys
from pathlib import Path

# Add the parent directory to the path so we can import app modules
sys.path.insert(0, str(Path(__file__).parent))

from app.database import init_db, engine
from app.models import Email, ActionItem, PromptConfig, Draft


def main():
    """Initialize the database with all tables."""
    print("Initializing database...")
    print(f"Database URL: {engine.url}")
    
    try:
        # Create all tables
        init_db()
        print("✓ Database tables created successfully!")
        
        # List created tables
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"\nCreated tables:")
        for table in tables:
            print(f"  - {table}")
            
    except Exception as e:
        print(f"✗ Error initializing database: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

"""Test script to verify backend setup."""
import sys
from app.main import app
from app.config import settings
from app.database import engine, Base

def test_setup():
    """Test that all components are properly configured."""
    print("Testing backend setup...")
    
    # Test 1: FastAPI app exists
    assert app is not None, "FastAPI app not initialized"
    print("✓ FastAPI app initialized")
    
    # Test 2: Settings loaded
    assert settings.openai_api_key, "OpenAI API key not configured"
    print("✓ Settings loaded from .env")
    
    # Test 3: Database connection
    try:
        with engine.connect() as conn:
            print("✓ Database connection successful")
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        sys.exit(1)
    
    # Test 4: Models imported
    from app.models import Email, ActionItem, PromptConfig, Draft
    print("✓ All models imported successfully")
    
    # Test 5: Tables exist
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    expected_tables = ['emails', 'action_items', 'prompts', 'drafts']
    for table in expected_tables:
        assert table in tables, f"Table {table} not found"
    print(f"✓ All tables exist: {', '.join(expected_tables)}")
    
    print("\n✅ Backend setup complete and verified!")
    return True

if __name__ == "__main__":
    try:
        test_setup()
    except Exception as e:
        print(f"\n❌ Setup test failed: {e}")
        sys.exit(1)

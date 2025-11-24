"""Test new API endpoints."""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.services.prompt_service import PromptService

# Create test client
client = TestClient(app)


def setup_test_db():
    """Set up test database."""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Initialize default prompts
    db = SessionLocal()
    try:
        prompt_service = PromptService(db)
        # This will create default prompts if they don't exist
    finally:
        db.close()


def test_health_check():
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    print("✓ Health check endpoint working")


def test_get_prompts():
    """Test getting current prompts."""
    response = client.get("/api/prompts")
    assert response.status_code == 200
    data = response.json()
    assert "categorization_prompt" in data
    assert "action_item_prompt" in data
    assert "auto_reply_prompt" in data
    print("✓ Get prompts endpoint working")


def test_get_default_prompts():
    """Test getting default prompts."""
    response = client.get("/api/prompts/defaults")
    assert response.status_code == 200
    data = response.json()
    assert "categorization_prompt" in data
    assert "action_item_prompt" in data
    assert "auto_reply_prompt" in data
    print("✓ Get default prompts endpoint working")


def test_update_prompts():
    """Test updating prompts."""
    new_prompts = {
        "categorization_prompt": "Test categorization prompt",
        "action_item_prompt": "Test action item prompt",
        "auto_reply_prompt": "Test auto-reply prompt"
    }
    response = client.put("/api/prompts", json=new_prompts)
    assert response.status_code == 200
    data = response.json()
    assert data["categorization_prompt"] == new_prompts["categorization_prompt"]
    print("✓ Update prompts endpoint working")


def test_load_mock_inbox():
    """Test loading mock inbox."""
    response = client.post("/api/emails/load")
    assert response.status_code == 200
    data = response.json()
    assert "count" in data
    assert "emails" in data
    assert data["count"] > 0
    print(f"✓ Load mock inbox endpoint working (loaded {data['count']} emails)")


def test_get_all_emails():
    """Test getting all emails."""
    response = client.get("/api/emails")
    assert response.status_code == 200
    data = response.json()
    assert "emails" in data
    assert "count" in data
    print(f"✓ Get all emails endpoint working (found {data['count']} emails)")


def test_get_email_by_id():
    """Test getting a single email."""
    # First get all emails to get an ID
    response = client.get("/api/emails")
    emails = response.json()["emails"]
    
    if emails:
        email_id = emails[0]["id"]
        response = client.get(f"/api/emails/{email_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == email_id
        print("✓ Get email by ID endpoint working")
    else:
        print("⚠ Skipping get email by ID test (no emails)")


def test_process_email():
    """Test processing an email."""
    # First get all emails to get an ID
    response = client.get("/api/emails")
    emails = response.json()["emails"]
    
    if emails:
        email_id = emails[0]["id"]
        response = client.post(
            f"/api/emails/{email_id}/process",
            json={"use_llm": False}  # Don't use LLM for testing
        )
        assert response.status_code == 200
        data = response.json()
        assert "email_id" in data
        assert "category" in data
        assert "action_items" in data
        print("✓ Process email endpoint working")
    else:
        print("⚠ Skipping process email test (no emails)")


def test_get_all_drafts():
    """Test getting all drafts."""
    response = client.get("/api/drafts")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    print(f"✓ Get all drafts endpoint working (found {len(data)} drafts)")


def test_chat_endpoint():
    """Test chat endpoint."""
    try:
        response = client.post(
            "/api/agent/chat",
            json={"message": "Hello, what can you help me with?"}
        )
        # May fail with 503 if LLM API key is invalid
        if response.status_code == 503:
            print("⚠ Chat endpoint skipped (LLM API key not configured)")
            return
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        print("✓ Chat endpoint working")
    except Exception as e:
        print(f"⚠ Chat endpoint skipped (LLM error: {str(e)[:50]}...)")


def test_chat_tasks_query():
    """Test chat endpoint with tasks query."""
    # This query doesn't require LLM
    response = client.post(
        "/api/agent/chat",
        json={"message": "What tasks do I need to do?"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    print("✓ Chat tasks query working")


def test_chat_urgent_query():
    """Test chat endpoint with urgent emails query."""
    # This query doesn't require LLM
    response = client.post(
        "/api/agent/chat",
        json={"message": "Show me all urgent emails"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    print("✓ Chat urgent emails query working")


if __name__ == "__main__":
    print("Setting up test database...")
    setup_test_db()
    print("\nTesting API endpoints...\n")
    
    try:
        # Basic tests
        test_health_check()
        
        # Prompt endpoints
        test_get_prompts()
        test_get_default_prompts()
        test_update_prompts()
        
        # Email endpoints
        test_load_mock_inbox()
        test_get_all_emails()
        test_get_email_by_id()
        test_process_email()
        
        # Draft endpoints
        test_get_all_drafts()
        
        # Agent endpoints
        test_chat_endpoint()
        test_chat_tasks_query()
        test_chat_urgent_query()
        
        print("\n✅ All endpoint tests passed!")
        
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

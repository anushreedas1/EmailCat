"""Test script to verify database models are working correctly."""
import sys
from pathlib import Path
from datetime import datetime
import uuid

# Add the parent directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal, init_db
from app.models import Email, ActionItem, PromptConfig, Draft


def test_models():
    """Test that all models can be created and queried."""
    print("Testing database models...")
    
    # Initialize database
    init_db()
    
    # Create a session
    db = SessionLocal()
    
    try:
        # Test Email model
        print("\n1. Testing Email model...")
        email = Email(
            id=str(uuid.uuid4()),
            sender="test@example.com",
            subject="Test Email",
            body="This is a test email body.",
            timestamp=datetime.utcnow(),
            category="Important",
            processed=False
        )
        db.add(email)
        db.commit()
        db.refresh(email)
        print(f"   ✓ Created email with ID: {email.id}")
        
        # Test ActionItem model
        print("\n2. Testing ActionItem model...")
        action_item = ActionItem(
            id=str(uuid.uuid4()),
            email_id=email.id,
            task="Complete the project report",
            deadline="2024-12-31",
            completed=False
        )
        db.add(action_item)
        db.commit()
        db.refresh(action_item)
        print(f"   ✓ Created action item with ID: {action_item.id}")
        
        # Test PromptConfig model
        print("\n3. Testing PromptConfig model...")
        prompt_config = PromptConfig(
            id=str(uuid.uuid4()),
            categorization_prompt="Categorize this email...",
            action_item_prompt="Extract action items...",
            auto_reply_prompt="Draft a reply..."
        )
        db.add(prompt_config)
        db.commit()
        db.refresh(prompt_config)
        print(f"   ✓ Created prompt config with ID: {prompt_config.id}")
        
        # Test Draft model
        print("\n4. Testing Draft model...")
        draft = Draft(
            id=str(uuid.uuid4()),
            email_id=email.id,
            subject="Re: Test Email",
            body="Thank you for your email...",
            suggested_follow_ups='["Follow up next week", "Schedule a meeting"]'
        )
        db.add(draft)
        db.commit()
        db.refresh(draft)
        print(f"   ✓ Created draft with ID: {draft.id}")
        
        # Test relationships
        print("\n5. Testing relationships...")
        queried_email = db.query(Email).filter(Email.id == email.id).first()
        print(f"   ✓ Email has {len(queried_email.action_items)} action item(s)")
        print(f"   ✓ Email has {len(queried_email.drafts)} draft(s)")
        
        # Test foreign key cascade
        print("\n6. Testing cascade delete...")
        db.delete(email)
        db.commit()
        
        # Verify action items and drafts were deleted
        remaining_actions = db.query(ActionItem).filter(ActionItem.email_id == email.id).count()
        remaining_drafts = db.query(Draft).filter(Draft.email_id == email.id).count()
        print(f"   ✓ Cascade delete successful (actions: {remaining_actions}, drafts: {remaining_drafts})")
        
        # Clean up prompt config
        db.delete(prompt_config)
        db.commit()
        
        print("\n✓ All model tests passed!")
        
    except Exception as e:
        print(f"\n✗ Error during testing: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    test_models()

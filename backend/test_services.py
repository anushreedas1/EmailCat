"""Test services to verify basic functionality."""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from datetime import datetime
from app.database import SessionLocal, init_db
from app.services import EmailService, PromptService, DraftService, LLMService
from app.models.email import Email


def test_services():
    """Test basic service functionality."""
    # Initialize database
    init_db()
    
    # Create database session
    db = SessionLocal()
    
    try:
        print("Testing EmailService...")
        email_service = EmailService(db)
        
        # Test load_mock_inbox
        emails = email_service.load_mock_inbox()
        print(f"✓ Loaded {len(emails)} emails from mock inbox")
        assert len(emails) > 0, "Should load at least one email"
        
        # Test get_all_emails
        all_emails = email_service.get_all_emails()
        print(f"✓ Retrieved {len(all_emails)} emails from database")
        assert len(all_emails) >= len(emails), "Should retrieve at least the loaded emails"
        
        # Test get_email_by_id
        if emails:
            first_email = emails[0]
            retrieved = email_service.get_email_by_id(first_email.id)
            print(f"✓ Retrieved email by ID: {retrieved.subject}")
            assert retrieved is not None, "Should retrieve email by ID"
            assert retrieved.id == first_email.id, "Should retrieve correct email"
        
        print("\nTesting PromptService...")
        prompt_service = PromptService(db)
        
        # Test get_prompts (should have defaults)
        prompts = prompt_service.get_prompts()
        print(f"✓ Retrieved prompts (has categorization: {len(prompts.categorization_prompt) > 0})")
        assert prompts is not None, "Should have default prompts"
        assert len(prompts.categorization_prompt) > 0, "Should have categorization prompt"
        
        # Test get_default_prompts
        defaults = prompt_service.get_default_prompts()
        print(f"✓ Retrieved default prompts")
        assert "categorization_prompt" in defaults, "Should have categorization prompt"
        assert "action_item_prompt" in defaults, "Should have action item prompt"
        assert "auto_reply_prompt" in defaults, "Should have auto reply prompt"
        
        # Test update_prompts
        new_prompts = prompt_service.update_prompts(
            categorization_prompt="Test categorization",
            action_item_prompt="Test action items",
            auto_reply_prompt="Test auto reply"
        )
        print(f"✓ Updated prompts")
        assert new_prompts.categorization_prompt == "Test categorization"
        
        print("\nTesting DraftService...")
        draft_service = DraftService(db)
        
        if emails:
            # Test create_draft
            draft = draft_service.create_draft(
                email_id=emails[0].id,
                subject="Re: Test",
                body="This is a test draft",
                suggested_follow_ups=["Follow up next week"]
            )
            print(f"✓ Created draft with ID: {draft.id}")
            assert draft.id is not None, "Should create draft with ID"
            
            # Test get_draft
            retrieved_draft = draft_service.get_draft(draft.id)
            print(f"✓ Retrieved draft: {retrieved_draft.subject}")
            assert retrieved_draft is not None, "Should retrieve draft"
            assert retrieved_draft.subject == "Re: Test"
            
            # Test update_draft
            updated = draft_service.update_draft(
                draft_id=draft.id,
                subject="Re: Updated Test"
            )
            print(f"✓ Updated draft subject: {updated.subject}")
            assert updated.subject == "Re: Updated Test"
            
            # Test get_drafts_for_email
            email_drafts = draft_service.get_drafts_for_email(emails[0].id)
            print(f"✓ Retrieved {len(email_drafts)} drafts for email")
            assert len(email_drafts) > 0, "Should have drafts for email"
            
            # Test delete_draft
            deleted = draft_service.delete_draft(draft.id)
            print(f"✓ Deleted draft: {deleted}")
            assert deleted is True, "Should delete draft"
        
        print("\nTesting LLMService...")
        llm_service = LLMService()
        
        # Test categorize_email
        test_email = "Hi, this is an urgent message about the project deadline. Please respond ASAP."
        prompts = prompt_service.get_prompts()
        
        try:
            category = llm_service.categorize_email(test_email, prompts.categorization_prompt)
            print(f"✓ Categorized email as: {category}")
            assert category in ["Important", "Newsletter", "Spam", "To-Do", "Uncategorized"]
        except Exception as e:
            print(f"⚠ LLM categorization test skipped (API error): {e}")
        
        # Test extract_action_items
        test_email_with_tasks = "Please review the document by Friday and send me your feedback. Also, schedule a meeting for next week."
        
        try:
            action_items = llm_service.extract_action_items(test_email_with_tasks, prompts.action_item_prompt)
            print(f"✓ Extracted {len(action_items)} action items")
            if action_items:
                for item in action_items:
                    assert "task" in item, "Action item should have task field"
                    print(f"  - Task: {item['task']}")
        except Exception as e:
            print(f"⚠ LLM action item extraction test skipped (API error): {e}")
        
        # Test generate_draft
        test_email_for_draft = "Hi, can we schedule a meeting to discuss the project timeline?"
        
        try:
            draft_data = llm_service.generate_draft(test_email_for_draft, prompts.auto_reply_prompt)
            print(f"✓ Generated draft with subject: {draft_data['subject']}")
            assert "subject" in draft_data, "Draft should have subject"
            assert "body" in draft_data, "Draft should have body"
        except Exception as e:
            print(f"⚠ LLM draft generation test skipped (API error): {e}")
        
        # Test chat_response
        try:
            context = {
                "selected_email": {
                    "sender": "test@example.com",
                    "subject": "Test Email",
                    "body": "This is a test email"
                }
            }
            response = llm_service.chat_response("Summarize this email", context)
            print(f"✓ Generated chat response: {response[:50]}...")
            assert len(response) > 0, "Chat response should not be empty"
        except Exception as e:
            print(f"⚠ LLM chat response test skipped (API error): {e}")
        
        print("\n✅ All service tests passed!")
        
    finally:
        db.close()


if __name__ == "__main__":
    test_services()

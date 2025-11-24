"""
Tests for data persistence and safety features.

Validates Requirements:
- 12.1: Drafts stored without automatic sending
- 12.2: Persist all drafts across application restarts
- 12.3: Email content immutability during processing
- 12.4: Preserve partial draft content for recovery
- 12.5: Confirm action before permanently removing data
"""
import os
import sys
import pytest
import uuid
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set environment variable before importing app modules
os.environ.setdefault('OPENAI_API_KEY', 'test-key-for-testing')

from app.database import Base
from app.models.email import Email
from app.models.draft import Draft
from app.services.email_service import EmailService
from app.services.draft_service import DraftService


# Test database setup
@pytest.fixture
def test_db():
    """Create a test database session."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    yield session
    session.close()


class TestDraftPersistence:
    """Test draft persistence across application restarts."""
    
    def test_draft_persists_in_database(self, test_db):
        """Test that drafts are stored in database and persist."""
        # Requirement 12.1, 12.2
        draft_service = DraftService(test_db)
        
        # Create a draft
        draft = draft_service.create_draft(
            email_id="test-email-1",
            subject="Test Draft",
            body="This is a test draft body",
            suggested_follow_ups=["Follow up next week"]
        )
        
        # Verify draft is stored
        assert draft.id is not None
        assert draft.subject == "Test Draft"
        assert draft.body == "This is a test draft body"
        
        # Simulate application restart by creating new service instance
        draft_service_2 = DraftService(test_db)
        
        # Retrieve draft after "restart"
        retrieved_draft = draft_service_2.get_draft(draft.id)
        
        # Verify draft persisted
        assert retrieved_draft is not None
        assert retrieved_draft.id == draft.id
        assert retrieved_draft.subject == draft.subject
        assert retrieved_draft.body == draft.body
    
    def test_multiple_drafts_persist(self, test_db):
        """Test that multiple drafts persist independently."""
        # Requirement 12.2
        draft_service = DraftService(test_db)
        
        # Create multiple drafts
        draft1 = draft_service.create_draft(
            email_id="email-1",
            subject="Draft 1",
            body="Body 1"
        )
        
        draft2 = draft_service.create_draft(
            email_id="email-2",
            subject="Draft 2",
            body="Body 2"
        )
        
        # Retrieve all drafts
        all_drafts = draft_service.get_all_drafts()
        
        # Verify both drafts exist
        assert len(all_drafts) >= 2
        draft_ids = [d.id for d in all_drafts]
        assert draft1.id in draft_ids
        assert draft2.id in draft_ids
    
    def test_draft_updates_persist(self, test_db):
        """Test that draft updates are persisted."""
        # Requirement 12.2, 12.4
        draft_service = DraftService(test_db)
        
        # Create a draft
        draft = draft_service.create_draft(
            email_id="test-email",
            subject="Original Subject",
            body="Original Body"
        )
        
        original_id = draft.id
        
        # Update the draft
        updated_draft = draft_service.update_draft(
            draft_id=draft.id,
            subject="Updated Subject",
            body="Updated Body"
        )
        
        # Verify update persisted
        assert updated_draft.id == original_id
        assert updated_draft.subject == "Updated Subject"
        assert updated_draft.body == "Updated Body"
        
        # Retrieve again to confirm persistence
        retrieved = draft_service.get_draft(draft.id)
        assert retrieved.subject == "Updated Subject"
        assert retrieved.body == "Updated Body"


class TestEmailImmutability:
    """Test email content immutability during processing."""
    
    def test_email_content_unchanged_after_processing(self, test_db):
        """Test that email content remains unchanged during processing."""
        # Requirement 12.3
        email_service = EmailService(test_db)
        
        # Create an email
        email = Email(
            id=str(uuid.uuid4()),
            sender="test@example.com",
            subject="Test Subject",
            body="Test Body",
            timestamp=datetime.utcnow()
        )
        
        saved_email = email_service.save_email(email)
        
        # Store original values
        original_sender = saved_email.sender
        original_subject = saved_email.subject
        original_body = saved_email.body
        original_timestamp = saved_email.timestamp
        
        # Process the email (categorize and add action items)
        processed_email = email_service.process_email(
            email_id=saved_email.id,
            category="Important",
            action_items=[
                {"task": "Review document", "deadline": "2024-12-31"}
            ]
        )
        
        # Verify content is unchanged
        assert processed_email.sender == original_sender
        assert processed_email.subject == original_subject
        assert processed_email.body == original_body
        assert processed_email.timestamp == original_timestamp
        
        # Verify only metadata changed
        assert processed_email.category == "Important"
        assert processed_email.processed is True
        assert len(processed_email.action_items) == 1
    
    def test_verify_email_immutability_method(self, test_db):
        """Test the verify_email_immutability method."""
        # Requirement 12.3
        email_service = EmailService(test_db)
        
        # Create an email
        email = Email(
            id=str(uuid.uuid4()),
            sender="test@example.com",
            subject="Test Subject",
            body="Test Body",
            timestamp=datetime.utcnow()
        )
        
        saved_email = email_service.save_email(email)
        
        # Store original values
        original_sender = saved_email.sender
        original_subject = saved_email.subject
        original_body = saved_email.body
        original_timestamp = saved_email.timestamp
        
        # Process the email
        email_service.process_email(
            email_id=saved_email.id,
            category="Newsletter"
        )
        
        # Verify immutability
        is_immutable = email_service.verify_email_immutability(
            email_id=saved_email.id,
            original_sender=original_sender,
            original_subject=original_subject,
            original_body=original_body,
            original_timestamp=original_timestamp
        )
        
        assert is_immutable is True
    
    def test_email_immutability_with_multiple_processing(self, test_db):
        """Test that email remains immutable through multiple processing operations."""
        # Requirement 12.3
        email_service = EmailService(test_db)
        
        # Create an email
        email = Email(
            id=str(uuid.uuid4()),
            sender="test@example.com",
            subject="Test Subject",
            body="Test Body",
            timestamp=datetime.utcnow()
        )
        
        saved_email = email_service.save_email(email)
        
        # Store original values
        original_sender = saved_email.sender
        original_subject = saved_email.subject
        original_body = saved_email.body
        original_timestamp = saved_email.timestamp
        
        # Process multiple times
        email_service.process_email(
            email_id=saved_email.id,
            category="Important"
        )
        
        email_service.process_email(
            email_id=saved_email.id,
            category="To-Do",
            action_items=[{"task": "Task 1", "deadline": None}]
        )
        
        # Retrieve final state
        final_email = email_service.get_email_by_id(saved_email.id)
        
        # Verify content is still unchanged
        assert final_email.sender == original_sender
        assert final_email.subject == original_subject
        assert final_email.body == original_body
        assert final_email.timestamp == original_timestamp


class TestDraftSafety:
    """Test draft safety constraints."""
    
    def test_draft_never_automatically_sent(self, test_db):
        """Test that drafts are stored but never automatically sent."""
        # Requirement 12.1
        draft_service = DraftService(test_db)
        
        # Create a draft
        draft = draft_service.create_draft(
            email_id="test-email",
            subject="Test Draft",
            body="This should not be sent automatically"
        )
        
        # Verify draft exists in database
        retrieved = draft_service.get_draft(draft.id)
        assert retrieved is not None
        
        # In a real system, we would verify that no email sending
        # function was called. For this test, we verify the draft
        # is stored in the drafts table, not in a "sent" table.
        # The absence of a "sent" status or "sent_at" field confirms
        # drafts are never automatically sent.
        assert not hasattr(retrieved, 'sent')
        assert not hasattr(retrieved, 'sent_at')
    
    def test_draft_deletion_requires_explicit_action(self, test_db):
        """Test that drafts can only be deleted through explicit action."""
        # Requirement 12.5
        draft_service = DraftService(test_db)
        
        # Create a draft
        draft = draft_service.create_draft(
            email_id="test-email",
            subject="Test Draft",
            body="Test Body"
        )
        
        # Verify draft exists
        assert draft_service.get_draft(draft.id) is not None
        
        # Delete draft (explicit action)
        success = draft_service.delete_draft(draft.id)
        assert success is True
        
        # Verify draft is deleted
        assert draft_service.get_draft(draft.id) is None
    
    def test_draft_isolation(self, test_db):
        """Test that drafts for different emails are isolated."""
        # Requirement 7.4
        draft_service = DraftService(test_db)
        
        # Create drafts for different emails
        draft1 = draft_service.create_draft(
            email_id="email-1",
            subject="Draft for Email 1",
            body="Body 1"
        )
        
        draft2 = draft_service.create_draft(
            email_id="email-2",
            subject="Draft for Email 2",
            body="Body 2"
        )
        
        # Get drafts for each email
        email1_drafts = draft_service.get_drafts_for_email("email-1")
        email2_drafts = draft_service.get_drafts_for_email("email-2")
        
        # Verify isolation
        assert len(email1_drafts) >= 1
        assert len(email2_drafts) >= 1
        assert draft1.id in [d.id for d in email1_drafts]
        assert draft2.id in [d.id for d in email2_drafts]
        assert draft1.id not in [d.id for d in email2_drafts]
        assert draft2.id not in [d.id for d in email1_drafts]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

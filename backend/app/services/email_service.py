"""Email service for managing email operations."""
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.email import Email
from app.models.action_item import ActionItem


class EmailService:
    """Service for managing email operations."""
    
    def __init__(self, db: Session):
        """Initialize email service with database session."""
        self.db = db
    
    def load_mock_inbox(self, clear_existing: bool = False) -> List[Email]:
        """Load emails from mock inbox JSON file.
        
        Args:
            clear_existing: If True, clear all existing emails before loading.
        
        Returns:
            List of Email objects loaded from the mock inbox.
        """
        # Clear existing emails if requested
        if clear_existing:
            self.db.query(Email).delete()
            self.db.query(ActionItem).delete()
            self.db.commit()
        
        # Path to mock inbox JSON file
        mock_inbox_path = Path(__file__).parent.parent.parent / "data" / "mock_inbox.json"
        
        if not mock_inbox_path.exists():
            raise FileNotFoundError(f"Mock inbox file not found at {mock_inbox_path}")
        
        # Read JSON file
        with open(mock_inbox_path, "r", encoding="utf-8") as f:
            email_data = json.load(f)
        
        emails = []
        for data in email_data:
            # Generate unique ID if not present
            email_id = data.get("id", str(uuid.uuid4()))
            
            # Parse timestamp
            timestamp = datetime.fromisoformat(data["timestamp"].replace("Z", "+00:00"))
            
            # Create Email object
            email = Email(
                id=email_id,
                sender=data["sender"],
                subject=data["subject"],
                body=data["body"],
                timestamp=timestamp,
                category=data.get("category"),
                processed=data.get("processed", False)
            )
            
            # Save to database
            existing = self.db.query(Email).filter(Email.id == email.id).first()
            if not existing:
                self.db.add(email)
                emails.append(email)
            else:
                emails.append(existing)
        
        self.db.commit()
        return emails
    
    def get_all_emails(self) -> List[Email]:
        """Retrieve all emails from database.
        
        Returns:
            List of all Email objects.
        """
        return self.db.query(Email).order_by(Email.timestamp.desc()).all()
    
    def get_email_by_id(self, email_id: str) -> Optional[Email]:
        """Get single email by ID.
        
        Args:
            email_id: The unique identifier of the email.
            
        Returns:
            Email object if found, None otherwise.
        """
        return self.db.query(Email).filter(Email.id == email_id).first()
    
    def save_email(self, email: Email) -> Email:
        """Persist email to database.
        
        Args:
            email: Email object to save.
            
        Returns:
            Saved Email object.
        """
        # Check if email already exists
        existing = self.db.query(Email).filter(Email.id == email.id).first()
        
        if existing:
            # Update existing email
            existing.sender = email.sender
            existing.subject = email.subject
            existing.body = email.body
            existing.timestamp = email.timestamp
            existing.category = email.category
            existing.processed = email.processed
            existing.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(existing)
            return existing
        else:
            # Add new email
            self.db.add(email)
            self.db.commit()
            self.db.refresh(email)
            return email
    
    def process_email(self, email_id: str, category: Optional[str] = None, 
                     action_items: Optional[List[dict]] = None) -> Email:
        """Process email by setting category and action items.
        
        This method orchestrates categorization and action extraction.
        The actual LLM calls should be done by the caller (LLMService).
        
        IMPORTANT: This method ensures email content immutability.
        Only category, action_items, and processed status are modified.
        Original email content (sender, subject, body, timestamp) remains unchanged.
        
        Args:
            email_id: The unique identifier of the email.
            category: The category to assign to the email.
            action_items: List of action items to associate with the email.
            
        Returns:
            Processed Email object.
            
        Raises:
            ValueError: If email not found.
        """
        email = self.get_email_by_id(email_id)
        if not email:
            raise ValueError(f"Email with id {email_id} not found")
        
        # Store original content to verify immutability
        original_sender = email.sender
        original_subject = email.subject
        original_body = email.body
        original_timestamp = email.timestamp
        
        # Update category if provided
        if category:
            email.category = category
        
        # Add action items if provided
        if action_items:
            for item_data in action_items:
                action_item = ActionItem(
                    id=str(uuid.uuid4()),
                    email_id=email_id,
                    task=item_data["task"],
                    deadline=item_data.get("deadline")
                )
                self.db.add(action_item)
        
        # Mark as processed
        email.processed = True
        email.updated_at = datetime.utcnow()
        
        # Verify email content immutability before committing
        assert email.sender == original_sender, "Email sender was modified during processing"
        assert email.subject == original_subject, "Email subject was modified during processing"
        assert email.body == original_body, "Email body was modified during processing"
        assert email.timestamp == original_timestamp, "Email timestamp was modified during processing"
        
        self.db.commit()
        self.db.refresh(email)
        return email
    
    def verify_email_immutability(self, email_id: str, 
                                  original_sender: str,
                                  original_subject: str,
                                  original_body: str,
                                  original_timestamp: datetime) -> bool:
        """Verify that email content has not been modified.
        
        This method checks that the core email content (sender, subject, body, timestamp)
        remains unchanged, ensuring data integrity during processing.
        
        Args:
            email_id: The unique identifier of the email.
            original_sender: The original sender email address.
            original_subject: The original subject line.
            original_body: The original email body.
            original_timestamp: The original timestamp.
            
        Returns:
            True if email content is unchanged, False otherwise.
        """
        email = self.get_email_by_id(email_id)
        if not email:
            return False
        
        return (
            email.sender == original_sender and
            email.subject == original_subject and
            email.body == original_body and
            email.timestamp == original_timestamp
        )

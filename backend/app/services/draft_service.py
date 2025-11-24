"""Draft service for managing email draft operations."""
import json
import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.draft import Draft


class DraftService:
    """Service for managing email draft operations."""
    
    def __init__(self, db: Session):
        """Initialize draft service with database session."""
        self.db = db
    
    def create_draft(self, email_id: str, subject: str, body: str, 
                    suggested_follow_ups: Optional[List[str]] = None) -> Draft:
        """Create and store a new draft.
        
        Args:
            email_id: The ID of the email this draft is responding to.
            subject: The subject line of the draft.
            body: The body content of the draft.
            suggested_follow_ups: Optional list of suggested follow-up actions.
            
        Returns:
            Created Draft object.
        """
        # Convert suggested_follow_ups to JSON string if provided
        follow_ups_json = None
        if suggested_follow_ups:
            follow_ups_json = json.dumps(suggested_follow_ups)
        
        draft = Draft(
            id=str(uuid.uuid4()),
            email_id=email_id,
            subject=subject,
            body=body,
            suggested_follow_ups=follow_ups_json
        )
        
        self.db.add(draft)
        self.db.commit()
        self.db.refresh(draft)
        return draft
    
    def get_draft(self, draft_id: str) -> Optional[Draft]:
        """Retrieve draft by ID.
        
        Args:
            draft_id: The unique identifier of the draft.
            
        Returns:
            Draft object if found, None otherwise.
        """
        return self.db.query(Draft).filter(Draft.id == draft_id).first()
    
    def update_draft(self, draft_id: str, subject: Optional[str] = None, 
                    body: Optional[str] = None, 
                    suggested_follow_ups: Optional[List[str]] = None) -> Optional[Draft]:
        """Update an existing draft.
        
        Args:
            draft_id: The unique identifier of the draft.
            subject: Optional new subject line.
            body: Optional new body content.
            suggested_follow_ups: Optional new list of suggested follow-ups.
            
        Returns:
            Updated Draft object if found, None otherwise.
        """
        draft = self.get_draft(draft_id)
        if not draft:
            return None
        
        # Update fields if provided
        if subject is not None:
            draft.subject = subject
        if body is not None:
            draft.body = body
        if suggested_follow_ups is not None:
            draft.suggested_follow_ups = json.dumps(suggested_follow_ups)
        
        draft.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(draft)
        return draft
    
    def delete_draft(self, draft_id: str) -> bool:
        """Delete a draft.
        
        Args:
            draft_id: The unique identifier of the draft.
            
        Returns:
            True if draft was deleted, False if not found.
        """
        draft = self.get_draft(draft_id)
        if not draft:
            return False
        
        self.db.delete(draft)
        self.db.commit()
        return True
    
    def get_drafts_for_email(self, email_id: str) -> List[Draft]:
        """Get all drafts for a specific email.
        
        Args:
            email_id: The unique identifier of the email.
            
        Returns:
            List of Draft objects associated with the email.
        """
        return self.db.query(Draft).filter(
            Draft.email_id == email_id
        ).order_by(Draft.created_at.desc()).all()
    
    def get_all_drafts(self) -> List[Draft]:
        """Get all drafts in the system.
        
        Returns:
            List of all Draft objects.
        """
        return self.db.query(Draft).order_by(Draft.created_at.desc()).all()

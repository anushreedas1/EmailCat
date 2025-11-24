"""Email API endpoints."""
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.email_service import EmailService
from app.services.llm_service import LLMService, LLMError
from app.services.prompt_service import PromptService
from app.schemas.email import (
    EmailSchema,
    EmailListResponse,
    LoadInboxResponse,
    ProcessEmailRequest,
    ProcessEmailResponse,
    ActionItemSchema
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/emails", tags=["emails"])


@router.post("/load", response_model=LoadInboxResponse)
def load_mock_inbox(clear_existing: bool = True, db: Session = Depends(get_db)):
    """Load emails from mock inbox.
    
    This endpoint loads sample emails from the mock inbox JSON file
    and stores them in the database.
    
    Args:
        clear_existing: If True (default), clear all existing emails before loading.
    
    Returns:
        LoadInboxResponse with count and list of loaded emails.
    """
    try:
        email_service = EmailService(db)
        emails = email_service.load_mock_inbox(clear_existing=clear_existing)
        
        # Convert to schemas
        email_schemas = [EmailSchema.from_orm(email) for email in emails]
        
        return LoadInboxResponse(
            count=len(email_schemas),
            emails=email_schemas
        )
    except FileNotFoundError as e:
        logger.error(f"Mock inbox file not found: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mock inbox file not found"
        )
    except Exception as e:
        logger.error(f"Error loading mock inbox: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load mock inbox: {str(e)}"
        )


@router.get("", response_model=EmailListResponse)
def get_all_emails(db: Session = Depends(get_db)):
    """Retrieve all emails from the database.
    
    Returns:
        EmailListResponse with list of all emails and count.
    """
    try:
        email_service = EmailService(db)
        emails = email_service.get_all_emails()
        
        # Convert to schemas
        email_schemas = [EmailSchema.from_orm(email) for email in emails]
        
        return EmailListResponse(
            emails=email_schemas,
            count=len(email_schemas)
        )
    except Exception as e:
        logger.error(f"Error retrieving emails: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve emails: {str(e)}"
        )


@router.get("/{email_id}", response_model=EmailSchema)
def get_email_by_id(email_id: str, db: Session = Depends(get_db)):
    """Get a single email by ID.
    
    Args:
        email_id: The unique identifier of the email.
        
    Returns:
        EmailSchema with the email data.
    """
    try:
        email_service = EmailService(db)
        email = email_service.get_email_by_id(email_id)
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Email with id {email_id} not found"
            )
        
        return EmailSchema.from_orm(email)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving email {email_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve email: {str(e)}"
        )


@router.post("/{email_id}/process", response_model=ProcessEmailResponse)
def process_email(
    email_id: str,
    request: ProcessEmailRequest = ProcessEmailRequest(),
    db: Session = Depends(get_db)
):
    """Process an email by categorizing it and extracting action items.
    
    This endpoint uses the LLM service to categorize the email and extract
    action items based on the current prompt configuration.
    
    Args:
        email_id: The unique identifier of the email to process.
        request: Processing options (e.g., whether to use LLM).
        
    Returns:
        ProcessEmailResponse with category and action items.
    """
    try:
        email_service = EmailService(db)
        email = email_service.get_email_by_id(email_id)
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Email with id {email_id} not found"
            )
        
        # Get current prompts
        prompt_service = PromptService(db)
        prompts = prompt_service.get_prompts()
        
        if not prompts:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No prompt configuration found"
            )
        
        # Use LLM to categorize and extract action items
        if request.use_llm:
            llm_service = LLMService()
            
            # Prepare email content
            email_content = f"From: {email.sender}\nSubject: {email.subject}\n\n{email.body}"
            
            try:
                # Categorize email
                category = llm_service.categorize_email(
                    email_content,
                    prompts.categorization_prompt
                )
                
                # Extract action items
                action_items_data = llm_service.extract_action_items(
                    email_content,
                    prompts.action_item_prompt
                )
                
            except LLMError as e:
                logger.error(f"LLM error processing email {email_id}: {e}")
                # Use default values on LLM failure
                category = "Uncategorized"
                action_items_data = []
        else:
            # Manual processing without LLM
            category = "Uncategorized"
            action_items_data = []
        
        # Update email with category and action items
        processed_email = email_service.process_email(
            email_id=email_id,
            category=category,
            action_items=action_items_data
        )
        
        # Convert action items to schemas
        action_item_schemas = [
            ActionItemSchema.from_orm(item) 
            for item in processed_email.action_items
        ]
        
        return ProcessEmailResponse(
            email_id=processed_email.id,
            category=processed_email.category or "Uncategorized",
            action_items=action_item_schemas,
            processed=processed_email.processed
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing email {email_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process email: {str(e)}"
        )

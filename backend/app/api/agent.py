"""Agent API endpoints for chat and draft generation."""
import json
import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.email_service import EmailService
from app.services.llm_service import LLMService, LLMError
from app.services.prompt_service import PromptService
from app.services.draft_service import DraftService
from app.schemas.agent import (
    ChatRequest,
    ChatResponse,
    GenerateDraftRequest,
    GenerateDraftResponse
)
from app.schemas.draft import DraftSchema

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/agent", tags=["agent"])


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """Chat with the email agent.
    
    Provides an interactive chat interface where users can ask questions
    about their emails, get summaries, find specific emails, etc.
    
    Auto-processes unprocessed emails on first request.
    
    Args:
        request: ChatRequest with message and optional context.
        
    Returns:
        ChatResponse with the agent's response.
    """
    try:
        llm_service = LLMService()
        email_service = EmailService(db)
        prompt_service = PromptService(db)
        
        # Auto-process unprocessed emails (only once, on first request)
        emails = email_service.get_all_emails()
        unprocessed_emails = [email for email in emails if not email.category]
        
        if unprocessed_emails:
            logger.info(f"Auto-processing {len(unprocessed_emails)} unprocessed emails")
            prompts = prompt_service.get_prompts()
            
            if prompts:
                for email in unprocessed_emails:
                    try:
                        email_content = f"From: {email.sender}\nSubject: {email.subject}\n\n{email.body}"
                        
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
                        
                        # Update email
                        email_service.process_email(
                            email_id=email.id,
                            category=category,
                            action_items=action_items_data
                        )
                    except LLMError as e:
                        logger.error(f"Failed to process email {email.id}: {e}")
                        # Continue processing other emails
                
                # Refresh emails list after processing
                emails = email_service.get_all_emails()
        
        # Build context
        context: Dict[str, Any] = request.context or {}
        
        # Add selected email to context if email_id provided
        if request.email_id:
            email = email_service.get_email_by_id(request.email_id)
            if email:
                context["selected_email"] = {
                    "id": email.id,
                    "sender": email.sender,
                    "subject": email.subject,
                    "body": email.body,
                    "timestamp": email.timestamp.isoformat(),
                    "category": email.category
                }
        
        # Handle special queries
        message_lower = request.message.lower()
        
        # "Summarize my inbox" - provide comprehensive inbox overview
        if "summarize" in message_lower and ("inbox" in message_lower or "my emails" in message_lower):
            # Count emails by category
            category_counts = {}
            for email in emails:
                category = email.category or "Uncategorized"
                category_counts[category] = category_counts.get(category, 0) + 1
            
            # Get important emails
            important_emails = [e for e in emails if e.category == "Important"]
            
            # Get all action items
            total_action_items = sum(len(email.action_items) for email in emails)
            
            # Build summary
            response_text = f"📧 Inbox Summary\n\n"
            response_text += f"Total Emails: {len(emails)}\n\n"
            
            # Category breakdown
            response_text += "By Category:\n"
            for category in ["Important", "To-Do", "Newsletter", "Spam", "Uncategorized"]:
                count = category_counts.get(category, 0)
                if count > 0:
                    emoji = {"Important": "🔴", "To-Do": "📋", "Newsletter": "📰", "Spam": "🗑️", "Uncategorized": "❓"}.get(category, "")
                    response_text += f"  {emoji} {category}: {count}\n"
            
            response_text += f"\nAction Items: {total_action_items} tasks pending\n"
            
            # Highlight important emails
            if important_emails:
                response_text += f"\n🔴 Important Emails ({len(important_emails)}):\n"
                for i, email in enumerate(important_emails[:5], 1):  # Show top 5
                    response_text += f"{i}. {email.subject}\n"
                    response_text += f"   From: {email.sender}\n"
                if len(important_emails) > 5:
                    response_text += f"   ... and {len(important_emails) - 5} more\n"
            else:
                response_text += "\n✅ No urgent emails requiring immediate attention.\n"
            
            return ChatResponse(
                response=response_text,
                metadata={
                    "total_emails": len(emails),
                    "category_counts": category_counts,
                    "important_count": len(important_emails),
                    "action_items_count": total_action_items
                }
            )
        
        # "What tasks do I need to do?" - return all action items
        if "what tasks" in message_lower or "tasks do i need" in message_lower:
            all_action_items = []
            for email in emails:
                for item in email.action_items:
                    all_action_items.append({
                        "task": item.task,
                        "deadline": item.deadline,
                        "email_subject": email.subject,
                        "email_sender": email.sender
                    })
            
            if all_action_items:
                response_text = "Here are all your tasks:\n\n"
                for i, item in enumerate(all_action_items, 1):
                    response_text += f"{i}. {item['task']}"
                    if item['deadline']:
                        response_text += f" (Deadline: {item['deadline']})"
                    response_text += f"\n   From: {item['email_sender']} - {item['email_subject']}\n"
            else:
                response_text = "You have no pending tasks."
            
            return ChatResponse(
                response=response_text,
                metadata={"action_items": all_action_items}
            )
        
        # "Show me all urgent emails" - filter by Important category
        if "urgent" in message_lower or "important" in message_lower:
            important_emails = [
                email for email in emails 
                if email.category and email.category.lower() == "important"
            ]
            
            if important_emails:
                response_text = f"Found {len(important_emails)} urgent/important emails:\n\n"
                for i, email in enumerate(important_emails, 1):
                    response_text += f"{i}. From: {email.sender}\n"
                    response_text += f"   Subject: {email.subject}\n"
                    response_text += f"   Date: {email.timestamp.strftime('%Y-%m-%d %H:%M')}\n\n"
            else:
                response_text = "No urgent or important emails found."
            
            return ChatResponse(
                response=response_text,
                metadata={"important_count": len(important_emails)}
            )
        
        # For other queries, use LLM
        # Add all emails to context for general queries
        if "emails" not in context:
            emails = email_service.get_all_emails()
            context["emails"] = [
                {
                    "id": email.id,
                    "sender": email.sender,
                    "subject": email.subject,
                    "category": email.category
                }
                for email in emails
            ]
        
        # Add action items to context
        if "action_items" not in context:
            emails = email_service.get_all_emails()
            action_items = []
            for email in emails:
                for item in email.action_items:
                    action_items.append({
                        "task": item.task,
                        "deadline": item.deadline
                    })
            context["action_items"] = action_items
        
        # Get prompts for additional context
        prompts = prompt_service.get_prompts()
        prompt_dict = None
        if prompts:
            prompt_dict = {
                "categorization_prompt": prompts.categorization_prompt,
                "action_item_prompt": prompts.action_item_prompt,
                "auto_reply_prompt": prompts.auto_reply_prompt
            }
        
        # Generate response using LLM
        try:
            response_text = llm_service.chat_response(
                message=request.message,
                context=context,
                prompts=prompt_dict
            )
        except LLMError as e:
            logger.error(f"LLM error in chat: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Unable to generate response. Please try again later."
            )
        
        return ChatResponse(
            response=response_text,
            metadata=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat request: {str(e)}"
        )


@router.post("/draft", response_model=GenerateDraftResponse)
def generate_draft(
    request: GenerateDraftRequest,
    db: Session = Depends(get_db)
):
    """Generate an email reply draft.
    
    Uses the LLM to generate a draft reply to the specified email
    based on the auto-reply prompt configuration.
    
    Args:
        request: GenerateDraftRequest with email_id and optional instructions.
        
    Returns:
        GenerateDraftResponse with the generated draft.
    """
    try:
        email_service = EmailService(db)
        llm_service = LLMService()
        prompt_service = PromptService(db)
        draft_service = DraftService(db)
        
        # Get the email
        email = email_service.get_email_by_id(request.email_id)
        if not email:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Email with id {request.email_id} not found"
            )
        
        # Get current prompts
        prompts = prompt_service.get_prompts()
        if not prompts:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No prompt configuration found"
            )
        
        # Prepare email content
        email_content = f"From: {email.sender}\nSubject: {email.subject}\n\n{email.body}"
        
        # Add custom instructions to context if provided
        context = {}
        if request.instructions:
            context["instructions"] = request.instructions
        
        # Generate draft using LLM
        try:
            draft_data = llm_service.generate_draft(
                email_content=email_content,
                prompt=prompts.auto_reply_prompt,
                context=context
            )
        except LLMError as e:
            logger.error(f"LLM error generating draft: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Unable to generate draft. Please try again later."
            )
        
        # Parse suggested follow-ups if present
        suggested_follow_ups = draft_data.get("suggested_follow_ups")
        if suggested_follow_ups and isinstance(suggested_follow_ups, str):
            try:
                suggested_follow_ups = json.loads(suggested_follow_ups)
            except json.JSONDecodeError:
                suggested_follow_ups = None
        
        # Save draft to database
        draft = draft_service.create_draft(
            email_id=request.email_id,
            subject=draft_data["subject"],
            body=draft_data["body"],
            suggested_follow_ups=suggested_follow_ups
        )
        
        # Convert to schema
        draft_schema = DraftSchema.from_orm(draft)
        
        # Parse suggested_follow_ups from JSON string if needed
        if draft.suggested_follow_ups:
            try:
                draft_schema.suggested_follow_ups = json.loads(draft.suggested_follow_ups)
            except json.JSONDecodeError:
                draft_schema.suggested_follow_ups = None
        
        return GenerateDraftResponse(draft=draft_schema)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating draft: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate draft: {str(e)}"
        )

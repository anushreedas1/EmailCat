"""Prompt API endpoints."""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.prompt_service import PromptService
from app.schemas.prompt import (
    PromptConfigSchema,
    UpdatePromptRequest,
    DefaultPromptsResponse
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/prompts", tags=["prompts"])


@router.get("", response_model=PromptConfigSchema)
def get_prompts(db: Session = Depends(get_db)):
    """Retrieve current prompt configuration.
    
    Returns the most recently saved prompt configuration.
    
    Returns:
        PromptConfigSchema with current prompts.
    """
    try:
        prompt_service = PromptService(db)
        prompts = prompt_service.get_prompts()
        
        if not prompts:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No prompt configuration found"
            )
        
        return PromptConfigSchema.from_orm(prompts)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving prompts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve prompts: {str(e)}"
        )


@router.put("", response_model=PromptConfigSchema)
def update_prompts(
    request: UpdatePromptRequest,
    db: Session = Depends(get_db)
):
    """Update prompt configuration.
    
    Creates a new prompt configuration with the provided prompts.
    
    Args:
        request: UpdatePromptRequest with new prompt values.
        
    Returns:
        PromptConfigSchema with the saved configuration.
    """
    try:
        prompt_service = PromptService(db)
        
        # Validate that prompts are not empty
        if not request.categorization_prompt.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Categorization prompt cannot be empty"
            )
        if not request.action_item_prompt.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Action item prompt cannot be empty"
            )
        if not request.auto_reply_prompt.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Auto-reply prompt cannot be empty"
            )
        
        # Update prompts
        updated_prompts = prompt_service.update_prompts(
            categorization_prompt=request.categorization_prompt,
            action_item_prompt=request.action_item_prompt,
            auto_reply_prompt=request.auto_reply_prompt
        )
        
        return PromptConfigSchema.from_orm(updated_prompts)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating prompts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update prompts: {str(e)}"
        )


@router.get("/defaults", response_model=DefaultPromptsResponse)
def get_default_prompts(db: Session = Depends(get_db)):
    """Get default prompt templates.
    
    Returns the default prompt templates that can be used to reset
    the prompt configuration.
    
    Returns:
        DefaultPromptsResponse with default prompt templates.
    """
    try:
        prompt_service = PromptService(db)
        defaults = prompt_service.get_default_prompts()
        
        return DefaultPromptsResponse(**defaults)
    except Exception as e:
        logger.error(f"Error retrieving default prompts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve default prompts: {str(e)}"
        )

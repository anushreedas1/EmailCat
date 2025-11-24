"""Draft API endpoints."""
import json
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.draft_service import DraftService
from app.schemas.draft import (
    DraftSchema,
    UpdateDraftRequest,
    DeleteDraftResponse
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/drafts", tags=["drafts"])


@router.get("", response_model=List[DraftSchema])
def get_all_drafts(db: Session = Depends(get_db)):
    """Retrieve all drafts.
    
    Returns a list of all drafts in the system, ordered by creation date
    (most recent first).
    
    Returns:
        List of DraftSchema objects.
    """
    try:
        draft_service = DraftService(db)
        drafts = draft_service.get_all_drafts()
        
        # Convert to schemas and parse suggested_follow_ups
        draft_schemas = []
        for draft in drafts:
            schema = DraftSchema.from_orm(draft)
            # Parse suggested_follow_ups from JSON string
            if draft.suggested_follow_ups:
                try:
                    schema.suggested_follow_ups = json.loads(draft.suggested_follow_ups)
                except json.JSONDecodeError:
                    schema.suggested_follow_ups = None
            draft_schemas.append(schema)
        
        return draft_schemas
    except Exception as e:
        logger.error(f"Error retrieving drafts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve drafts: {str(e)}"
        )


@router.get("/{draft_id}", response_model=DraftSchema)
def get_draft_by_id(draft_id: str, db: Session = Depends(get_db)):
    """Get a single draft by ID.
    
    Args:
        draft_id: The unique identifier of the draft.
        
    Returns:
        DraftSchema with the draft data.
    """
    try:
        draft_service = DraftService(db)
        draft = draft_service.get_draft(draft_id)
        
        if not draft:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Draft with id {draft_id} not found"
            )
        
        # Convert to schema and parse suggested_follow_ups
        schema = DraftSchema.from_orm(draft)
        if draft.suggested_follow_ups:
            try:
                schema.suggested_follow_ups = json.loads(draft.suggested_follow_ups)
            except json.JSONDecodeError:
                schema.suggested_follow_ups = None
        
        return schema
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving draft {draft_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve draft: {str(e)}"
        )


@router.put("/{draft_id}", response_model=DraftSchema)
def update_draft(
    draft_id: str,
    request: UpdateDraftRequest,
    db: Session = Depends(get_db)
):
    """Update an existing draft.
    
    Allows updating the subject, body, and/or suggested follow-ups
    of an existing draft.
    
    Args:
        draft_id: The unique identifier of the draft.
        request: UpdateDraftRequest with fields to update.
        
    Returns:
        DraftSchema with the updated draft data.
    """
    try:
        draft_service = DraftService(db)
        
        # Check if draft exists
        existing_draft = draft_service.get_draft(draft_id)
        if not existing_draft:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Draft with id {draft_id} not found"
            )
        
        # Update draft
        updated_draft = draft_service.update_draft(
            draft_id=draft_id,
            subject=request.subject,
            body=request.body,
            suggested_follow_ups=request.suggested_follow_ups
        )
        
        if not updated_draft:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update draft"
            )
        
        # Convert to schema and parse suggested_follow_ups
        schema = DraftSchema.from_orm(updated_draft)
        if updated_draft.suggested_follow_ups:
            try:
                schema.suggested_follow_ups = json.loads(updated_draft.suggested_follow_ups)
            except json.JSONDecodeError:
                schema.suggested_follow_ups = None
        
        return schema
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating draft {draft_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update draft: {str(e)}"
        )


@router.delete("/{draft_id}", response_model=DeleteDraftResponse)
def delete_draft(draft_id: str, db: Session = Depends(get_db)):
    """Delete a draft.
    
    Permanently removes a draft from the system.
    
    Args:
        draft_id: The unique identifier of the draft.
        
    Returns:
        DeleteDraftResponse indicating success or failure.
    """
    try:
        draft_service = DraftService(db)
        
        # Check if draft exists
        existing_draft = draft_service.get_draft(draft_id)
        if not existing_draft:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Draft with id {draft_id} not found"
            )
        
        # Delete draft
        success = draft_service.delete_draft(draft_id)
        
        if success:
            return DeleteDraftResponse(
                success=True,
                message=f"Draft {draft_id} deleted successfully"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete draft"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting draft {draft_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete draft: {str(e)}"
        )

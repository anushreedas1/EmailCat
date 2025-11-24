"""Pydantic schemas for draft-related API requests and responses."""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class DraftSchema(BaseModel):
    """Schema for draft data."""
    id: str
    email_id: str
    subject: str
    body: str
    suggested_follow_ups: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CreateDraftRequest(BaseModel):
    """Request schema for creating a draft."""
    email_id: str
    subject: str
    body: str
    suggested_follow_ups: Optional[List[str]] = None


class UpdateDraftRequest(BaseModel):
    """Request schema for updating a draft."""
    subject: Optional[str] = None
    body: Optional[str] = None
    suggested_follow_ups: Optional[List[str]] = None


class DeleteDraftResponse(BaseModel):
    """Response schema for draft deletion."""
    success: bool
    message: str

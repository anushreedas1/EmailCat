"""Pydantic schemas for agent-related API requests and responses."""
from typing import Any, Dict, Optional
from pydantic import BaseModel

from app.schemas.draft import DraftSchema


class ChatRequest(BaseModel):
    """Request schema for agent chat."""
    message: str
    email_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    """Response schema for agent chat."""
    response: str
    metadata: Optional[Dict[str, Any]] = None


class GenerateDraftRequest(BaseModel):
    """Request schema for draft generation."""
    email_id: str
    instructions: Optional[str] = None


class GenerateDraftResponse(BaseModel):
    """Response schema for draft generation."""
    draft: DraftSchema

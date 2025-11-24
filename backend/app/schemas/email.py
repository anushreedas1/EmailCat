"""Pydantic schemas for email-related API requests and responses."""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ActionItemSchema(BaseModel):
    """Schema for action item data."""
    id: str
    email_id: str
    task: str
    deadline: Optional[str] = None
    completed: bool = False
    created_at: datetime
    
    class Config:
        from_attributes = True


class EmailSchema(BaseModel):
    """Schema for email data."""
    id: str
    sender: str
    subject: str
    body: str
    timestamp: datetime
    category: Optional[str] = None
    processed: bool = False
    created_at: datetime
    updated_at: datetime
    action_items: List[ActionItemSchema] = []
    
    class Config:
        from_attributes = True


class EmailListResponse(BaseModel):
    """Response schema for email list."""
    emails: List[EmailSchema]
    count: int


class LoadInboxResponse(BaseModel):
    """Response schema for loading inbox."""
    count: int
    emails: List[EmailSchema]


class ProcessEmailRequest(BaseModel):
    """Request schema for processing an email."""
    use_llm: bool = Field(default=True, description="Whether to use LLM for processing")


class ProcessEmailResponse(BaseModel):
    """Response schema for email processing."""
    email_id: str
    category: str
    action_items: List[ActionItemSchema]
    processed: bool

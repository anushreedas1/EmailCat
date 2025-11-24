"""Pydantic schemas for prompt-related API requests and responses."""
from datetime import datetime
from pydantic import BaseModel


class PromptConfigSchema(BaseModel):
    """Schema for prompt configuration data."""
    id: str
    categorization_prompt: str
    action_item_prompt: str
    auto_reply_prompt: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UpdatePromptRequest(BaseModel):
    """Request schema for updating prompts."""
    categorization_prompt: str
    action_item_prompt: str
    auto_reply_prompt: str


class DefaultPromptsResponse(BaseModel):
    """Response schema for default prompts."""
    categorization_prompt: str
    action_item_prompt: str
    auto_reply_prompt: str

"""PromptConfig database model."""
from sqlalchemy import Column, String, Text, DateTime
from datetime import datetime

from app.database import Base


class PromptConfig(Base):
    """PromptConfig model for storing prompt templates."""
    
    __tablename__ = "prompts"
    
    id = Column(String, primary_key=True, index=True)
    categorization_prompt = Column(Text, nullable=False)
    action_item_prompt = Column(Text, nullable=False)
    auto_reply_prompt = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

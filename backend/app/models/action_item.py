"""ActionItem database model."""
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class ActionItem(Base):
    """ActionItem model for storing extracted tasks."""
    
    __tablename__ = "action_items"
    
    id = Column(String, primary_key=True, index=True)
    email_id = Column(String, ForeignKey("emails.id", ondelete="CASCADE"), nullable=False)
    task = Column(Text, nullable=False)
    deadline = Column(String, nullable=True)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    email = relationship("Email", back_populates="action_items")

"""Email database model."""
from sqlalchemy import Column, String, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Email(Base):
    """Email model for storing email data."""
    
    __tablename__ = "emails"
    
    id = Column(String, primary_key=True, index=True)
    sender = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    category = Column(String, nullable=True)
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    action_items = relationship("ActionItem", back_populates="email", cascade="all, delete-orphan")
    drafts = relationship("Draft", back_populates="email", cascade="all, delete-orphan")

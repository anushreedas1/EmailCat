"""Draft database model."""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Draft(Base):
    """Draft model for storing email reply drafts."""
    
    __tablename__ = "drafts"
    
    id = Column(String, primary_key=True, index=True)
    email_id = Column(String, ForeignKey("emails.id", ondelete="CASCADE"), nullable=False)
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    suggested_follow_ups = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    email = relationship("Email", back_populates="drafts")

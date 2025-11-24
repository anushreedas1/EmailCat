"""Prompt service for managing prompt configurations."""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models.prompt_config import PromptConfig


# Default prompt templates
DEFAULT_CATEGORIZATION_PROMPT = """Categorize the following email into exactly one of these categories: Important, Newsletter, Spam, To-Do.

Rules:
- Important: Emails requiring immediate attention or from key contacts
- Newsletter: Bulk emails, marketing, or informational content
- Spam: Unsolicited or suspicious emails
- To-Do: Emails containing direct requests requiring user action

Email:
{email_content}

Respond with only the category name."""

DEFAULT_ACTION_ITEM_PROMPT = """Extract all action items and tasks from the following email. For each task, identify the task description and any mentioned deadline.

Email:
{email_content}

Respond in JSON format:
[
  {
    "task": "description of the task",
    "deadline": "deadline if mentioned, otherwise null"
  }
]

If no action items are found, respond with an empty array: []"""

DEFAULT_AUTO_REPLY_PROMPT = """Draft a professional email reply to the following email. The reply should:
- Be polite and concise
- Address the main points of the original email
- Maintain a professional tone
- If it's a meeting request, ask for an agenda

Original Email:
{email_content}

Generate a reply with:
Subject: [reply subject]
Body: [reply body]"""


class PromptService:
    """Service for managing prompt configurations."""
    
    def __init__(self, db: Session):
        """Initialize prompt service with database session."""
        self.db = db
        self._ensure_default_prompts()
    
    def _ensure_default_prompts(self):
        """Seed database with default prompts if none exist."""
        existing = self.db.query(PromptConfig).first()
        if not existing:
            default_config = PromptConfig(
                id=str(uuid.uuid4()),
                categorization_prompt=DEFAULT_CATEGORIZATION_PROMPT,
                action_item_prompt=DEFAULT_ACTION_ITEM_PROMPT,
                auto_reply_prompt=DEFAULT_AUTO_REPLY_PROMPT
            )
            self.db.add(default_config)
            self.db.commit()
    
    def get_prompts(self) -> Optional[PromptConfig]:
        """Retrieve current prompt configuration.
        
        Returns the most recently updated prompt configuration.
        
        Returns:
            PromptConfig object if found, None otherwise.
        """
        return self.db.query(PromptConfig).order_by(
            PromptConfig.updated_at.desc()
        ).first()
    
    def update_prompts(self, categorization_prompt: str, 
                      action_item_prompt: str, 
                      auto_reply_prompt: str) -> PromptConfig:
        """Save new prompt configuration.
        
        Args:
            categorization_prompt: Prompt for email categorization.
            action_item_prompt: Prompt for action item extraction.
            auto_reply_prompt: Prompt for auto-reply generation.
            
        Returns:
            Saved PromptConfig object.
        """
        # Create new prompt configuration
        new_config = PromptConfig(
            id=str(uuid.uuid4()),
            categorization_prompt=categorization_prompt,
            action_item_prompt=action_item_prompt,
            auto_reply_prompt=auto_reply_prompt
        )
        
        self.db.add(new_config)
        self.db.commit()
        self.db.refresh(new_config)
        return new_config
    
    def get_default_prompts(self) -> dict:
        """Return default prompt templates.
        
        Returns:
            Dictionary containing default prompts.
        """
        return {
            "categorization_prompt": DEFAULT_CATEGORIZATION_PROMPT,
            "action_item_prompt": DEFAULT_ACTION_ITEM_PROMPT,
            "auto_reply_prompt": DEFAULT_AUTO_REPLY_PROMPT
        }

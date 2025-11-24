"""LLM service for handling all LLM API interactions."""
import json
import logging
import time
from typing import Any, Dict, List, Optional

from openai import OpenAI, APIError, RateLimitError, APITimeoutError
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log
)

from app.config import settings


# Configure logging
logger = logging.getLogger(__name__)


class LLMError(Exception):
    """Base exception for LLM-related errors."""
    pass


class LLMRateLimitError(LLMError):
    """Raised when API rate limit is exceeded."""
    pass


class LLMTimeoutError(LLMError):
    """Raised when API call times out."""
    pass


class LLMService:
    """Service for handling all LLM API interactions."""
    
    def __init__(self):
        """Initialize LLM service with OpenAI client configured for OpenRouter."""
        self.client = OpenAI(
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
            default_headers={
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Email Productivity Agent"
            }
        )
        self.model = "openai/gpt-3.5-turbo"  # OpenRouter model format
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((LLMRateLimitError, LLMTimeoutError)),
        before_sleep=before_sleep_log(logger, logging.WARNING)
    )
    def _call_llm(
        self, 
        system_prompt: str, 
        user_prompt: str, 
        response_format: Optional[str] = None,
        temperature: float = 0.7
    ) -> str:
        """Internal method for LLM API calls with retry logic.
        
        Args:
            system_prompt: The system prompt to guide LLM behavior.
            user_prompt: The user prompt containing the actual request.
            response_format: Optional format hint (e.g., "json").
            temperature: Sampling temperature (0.0 to 2.0).
            
        Returns:
            The LLM response as a string.
            
        Raises:
            LLMRateLimitError: If rate limit is exceeded.
            LLMTimeoutError: If request times out.
            LLMError: For other API errors.
        """
        try:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
            
            # Add response format if specified
            kwargs = {
                "model": self.model,
                "messages": messages,
                "temperature": temperature,
                "timeout": 30.0  # 30 second timeout
            }
            
            if response_format == "json":
                kwargs["response_format"] = {"type": "json_object"}
            
            response = self.client.chat.completions.create(**kwargs)
            
            return response.choices[0].message.content.strip()
            
        except RateLimitError as e:
            logger.warning(f"Rate limit exceeded: {e}")
            raise LLMRateLimitError("Rate limit exceeded") from e
        except APITimeoutError as e:
            logger.warning(f"Request timed out: {e}")
            raise LLMTimeoutError("Request timed out") from e
        except APIError as e:
            logger.error(f"OpenAI API error: {e}")
            raise LLMError(f"API error: {str(e)}") from e
        except Exception as e:
            logger.error(f"Unexpected error in LLM call: {e}")
            raise LLMError(f"Unexpected error: {str(e)}") from e
    
    def categorize_email(self, email_content: str, prompt: str) -> str:
        """Categorize email using LLM.
        
        Args:
            email_content: The email content to categorize.
            prompt: The categorization prompt template.
            
        Returns:
            Category string (Important, Newsletter, Spam, To-Do, or Uncategorized).
            
        Raises:
            LLMError: If categorization fails.
        """
        try:
            # Format the prompt with email content
            user_prompt = prompt.replace("{email_content}", email_content)
            
            system_prompt = "You are an email categorization assistant. Respond with only the category name."
            
            response = self._call_llm(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.3  # Lower temperature for more consistent categorization
            )
            
            # Validate category
            valid_categories = {"Important", "Newsletter", "Spam", "To-Do", "Uncategorized"}
            category = response.strip()
            
            # Check if response matches any valid category (case-insensitive)
            for valid_cat in valid_categories:
                if category.lower() == valid_cat.lower():
                    return valid_cat
            
            # If no match, return Uncategorized
            logger.warning(f"Invalid category returned: {category}. Defaulting to Uncategorized.")
            return "Uncategorized"
            
        except LLMError:
            # Re-raise LLM errors
            raise
        except Exception as e:
            logger.error(f"Error categorizing email: {e}")
            return "Uncategorized"
    
    def extract_action_items(self, email_content: str, prompt: str) -> List[Dict[str, Any]]:
        """Extract action items from email.
        
        Args:
            email_content: The email content to extract action items from.
            prompt: The action item extraction prompt template.
            
        Returns:
            List of action items, each with 'task' and 'deadline' fields.
            
        Raises:
            LLMError: If extraction fails.
        """
        try:
            # Format the prompt with email content
            user_prompt = prompt.replace("{email_content}", email_content)
            
            system_prompt = "You are an action item extraction assistant. Always respond with valid JSON."
            
            response = self._call_llm(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                response_format="json",
                temperature=0.3  # Lower temperature for more consistent extraction
            )
            
            # Parse JSON response
            try:
                action_items = json.loads(response)
                
                # Validate structure
                if not isinstance(action_items, list):
                    logger.warning("Action items response is not a list. Returning empty list.")
                    return []
                
                # Ensure each item has required fields
                validated_items = []
                for item in action_items:
                    if isinstance(item, dict) and "task" in item:
                        validated_items.append({
                            "task": item["task"],
                            "deadline": item.get("deadline")
                        })
                
                return validated_items
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse action items JSON: {e}")
                logger.error(f"Response was: {response}")
                return []
                
        except LLMError:
            # Re-raise LLM errors
            raise
        except Exception as e:
            logger.error(f"Error extracting action items: {e}")
            return []
    
    def generate_draft(
        self, 
        email_content: str, 
        prompt: str, 
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate email reply draft.
        
        Args:
            email_content: The original email content.
            prompt: The auto-reply prompt template.
            context: Optional additional context for draft generation.
            
        Returns:
            Dictionary with 'subject', 'body', and optional 'suggested_follow_ups'.
            
        Raises:
            LLMError: If draft generation fails.
        """
        try:
            # Format the prompt with email content
            user_prompt = prompt.replace("{email_content}", email_content)
            
            # Add context if provided
            if context:
                context_str = "\n\nAdditional Context:\n" + json.dumps(context, indent=2)
                user_prompt += context_str
            
            system_prompt = "You are an email drafting assistant. Generate professional email replies."
            
            response = self._call_llm(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.7  # Higher temperature for more creative drafts
            )
            
            # Parse the response to extract subject and body
            draft = self._parse_draft_response(response)
            
            return draft
            
        except LLMError:
            # Re-raise LLM errors
            raise
        except Exception as e:
            logger.error(f"Error generating draft: {e}")
            raise LLMError(f"Failed to generate draft: {str(e)}") from e
    
    def _parse_draft_response(self, response: str) -> Dict[str, Any]:
        """Parse draft response to extract subject and body.
        
        Args:
            response: The LLM response containing the draft.
            
        Returns:
            Dictionary with 'subject' and 'body' fields.
        """
        lines = response.split("\n")
        subject = ""
        body_lines = []
        in_body = False
        
        for line in lines:
            line_stripped = line.strip()
            
            # Look for subject line
            if line_stripped.lower().startswith("subject:"):
                subject = line_stripped[8:].strip()
            # Look for body marker
            elif line_stripped.lower().startswith("body:"):
                in_body = True
                # Check if body content is on the same line
                body_content = line_stripped[5:].strip()
                if body_content:
                    body_lines.append(body_content)
            elif in_body:
                body_lines.append(line)
        
        # If no explicit markers found, treat entire response as body
        if not subject and not body_lines:
            body_lines = lines
            subject = "Re: " + lines[0][:50] if lines else "Re: Your email"
        
        body = "\n".join(body_lines).strip()
        
        # Ensure we have at least some content
        if not body:
            body = response.strip()
        
        if not subject:
            subject = "Re: Your email"
        
        return {
            "subject": subject,
            "body": body,
            "suggested_follow_ups": None
        }
    
    def chat_response(
        self, 
        message: str, 
        context: Dict[str, Any], 
        prompts: Optional[Dict[str, str]] = None
    ) -> str:
        """Generate chat response for agent interface.
        
        Args:
            message: The user's chat message.
            context: Context including selected email, inbox state, etc.
            prompts: Optional prompt configurations for context.
            
        Returns:
            The agent's response as a string.
            
        Raises:
            LLMError: If chat response generation fails.
        """
        try:
            # Build system prompt
            system_prompt = """You are an intelligent email assistant. You help users manage their inbox by:
- Answering questions about emails
- Summarizing email content
- Finding specific emails
- Extracting information from emails
- Providing task lists from action items

Be concise, helpful, and professional."""
            
            # Build user prompt with context
            user_prompt = f"User question: {message}\n\n"
            
            # Add selected email context if available
            if "selected_email" in context and context["selected_email"]:
                email = context["selected_email"]
                user_prompt += f"""Selected Email:
From: {email.get('sender', 'Unknown')}
Subject: {email.get('subject', 'No subject')}
Body: {email.get('body', 'No content')}

"""
            
            # Add inbox context if available
            if "emails" in context and context["emails"]:
                user_prompt += f"\nTotal emails in inbox: {len(context['emails'])}\n"
            
            # Add action items context if available
            if "action_items" in context and context["action_items"]:
                user_prompt += f"\nTotal action items: {len(context['action_items'])}\n"
            
            response = self._call_llm(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.7
            )
            
            return response
            
        except LLMError:
            # Re-raise LLM errors
            raise
        except Exception as e:
            logger.error(f"Error generating chat response: {e}")
            raise LLMError(f"Failed to generate chat response: {str(e)}") from e

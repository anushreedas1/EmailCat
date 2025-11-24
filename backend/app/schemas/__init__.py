"""Pydantic schemas package."""
from app.schemas.email import (
    EmailSchema,
    ActionItemSchema,
    EmailListResponse,
    LoadInboxResponse,
    ProcessEmailRequest,
    ProcessEmailResponse
)
from app.schemas.prompt import (
    PromptConfigSchema,
    UpdatePromptRequest,
    DefaultPromptsResponse
)
from app.schemas.draft import (
    DraftSchema,
    CreateDraftRequest,
    UpdateDraftRequest,
    DeleteDraftResponse
)
from app.schemas.agent import (
    ChatRequest,
    ChatResponse,
    GenerateDraftRequest,
    GenerateDraftResponse
)

__all__ = [
    "EmailSchema",
    "ActionItemSchema",
    "EmailListResponse",
    "LoadInboxResponse",
    "ProcessEmailRequest",
    "ProcessEmailResponse",
    "PromptConfigSchema",
    "UpdatePromptRequest",
    "DefaultPromptsResponse",
    "DraftSchema",
    "CreateDraftRequest",
    "UpdateDraftRequest",
    "DeleteDraftResponse",
    "ChatRequest",
    "ChatResponse",
    "GenerateDraftRequest",
    "GenerateDraftResponse",
]

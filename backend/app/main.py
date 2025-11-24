"""Main FastAPI application entry point."""
import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from app.config import settings
from app.database import init_db
from app.api import emails, prompts, agent, drafts

# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    debug=settings.debug
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(emails.router)
app.include_router(prompts.router)
app.include_router(agent.router)
app.include_router(drafts.router)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    # Only initialize DB if not in serverless environment
    if os.getenv("VERCEL") != "1":
        init_db()


@app.get("/")
async def root():
    """Root endpoint for health check."""
    return {
        "message": "Email Productivity Agent API",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

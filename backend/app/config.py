"""Application configuration using Pydantic settings."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Configuration
    openai_api_key: str = ""
    openai_base_url: str = "https://openrouter.ai/api/v1"
    
    # Database Configuration
    database_url: str = "sqlite:///./email_agent.db"
    
    # CORS Configuration
    cors_origins: list[str] = ["http://localhost:3000"]
    
    # Application Configuration
    app_name: str = "Email Productivity Agent"
    debug: bool = True
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )


# Global settings instance
settings = Settings()

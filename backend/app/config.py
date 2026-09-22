import os
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Gemini API
    GEMINI_API_KEY: str = ""

    # Database
    DATABASE_URL: str = "sqlite:///./study_assistant.db"

    # JWT Authentication
    SECRET_KEY: str = "change-this-to-a-strong-random-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Upload settings
    MAX_FILE_SIZE_MB: int = 10
    UPLOAD_DIR: str = "../uploads"

    # Allowed file extensions
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".docx", ".txt"]

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def max_file_size_bytes(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()

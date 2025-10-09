from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # PostgreSQL Database configuration
    POSTGRES_HOST: str = "daddymax"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "test_eq"
    POSTGRES_USER: str = "sa"
    POSTGRES_PASSWORD: str = "testingpasswd"
    
    @property
    def database_url(self) -> str:
        """Return the PostgreSQL database URL."""
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    class Config:
        env_file = ".env"


settings = Settings()

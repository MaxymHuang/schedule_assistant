from pydantic_settings import BaseSettings
from typing import Optional
import os
import secrets


class Settings(BaseSettings):
    # JWT Configuration
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # PostgreSQL Database configuration
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "equipment_lending"
    POSTGRES_USER: str = "equipment_user"
    POSTGRES_PASSWORD: str = "secure_password_123"
    
    # Application configuration
    ENVIRONMENT: str = "development"
    DOCKER_CONTAINER: Optional[str] = None
    
    @property
    def database_url(self) -> str:
        """Return the PostgreSQL database URL."""
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.ENVIRONMENT.lower() == "production"
    
    def validate_production_settings(self):
        """Validate settings for production deployment."""
        if self.is_production:
            # Check if we're in a containerized environment or have environment variables set
            # If so, skip validation as configuration is managed externally
            if (self.DOCKER_CONTAINER or 
                os.getenv("POSTGRES_PASSWORD") or 
                os.getenv("SECRET_KEY")):
                return
                
            # Only validate for non-containerized production deployments
            if self.SECRET_KEY == "your-secret-key-change-in-production":
                raise ValueError("SECRET_KEY must be changed in production")
            if self.POSTGRES_PASSWORD == "secure_password_123":
                raise ValueError("POSTGRES_PASSWORD must be changed in production")
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance and validate for production
settings = Settings()

# Validate production settings if in production mode
if settings.is_production:
    settings.validate_production_settings()

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os

class Settings(BaseSettings):
    APP_NAME: str = "FluentFlow — AI English Communication Coach"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    DATABASE_URL: str = "sqlite+aiosqlite:///./data/fluentflow.db"

    # AI Provider: "gemini", "openai", "groq", or "local_mock"
    AI_PROVIDER: str = "gemini"
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    ELEVENLABS_API_KEY: Optional[str] = None

    TTS_PROVIDER: str = "edge_tts"
    DEFAULT_VOICE: str = "en-US-AriaNeural"
    DEFAULT_SPEECH_RATE: str = "+0%"

    MAX_SESSION_DURATION_SECONDS: int = 1800
    STORE_TRANSCRIPTS_DEFAULT: bool = True
    RATE_LIMIT_TURNS_PER_MINUTE: int = 25

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

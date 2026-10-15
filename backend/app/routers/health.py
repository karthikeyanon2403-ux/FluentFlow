from fastapi import APIRouter
from app.config import settings
from app.services.session_manager import session_manager

router = APIRouter(prefix="/api", tags=["Health"])

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "ai_provider": "gemini" if settings.GEMINI_API_KEY else "openai" if settings.OPENAI_API_KEY else "intelligent_engine",
        "tts_provider": settings.TTS_PROVIDER,
        "default_voice": settings.DEFAULT_VOICE,
        "active_sessions_count": len(session_manager._sessions)
    }

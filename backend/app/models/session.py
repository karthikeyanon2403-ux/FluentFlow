from datetime import datetime, timezone
import json
from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text
from app.database import Base

class SessionRecord(Base):
    __tablename__ = "sessions"

    id = Column(String(64), primary_key=True, index=True)
    mode = Column(String(32), nullable=False) # confident_talk, grammar_coach, vocab_coach
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)
    turn_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    # JSON encoded session details & summary report
    transcript_json = Column(Text, nullable=True)
    summary_json = Column(Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "mode": self.mode,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
            "duration_seconds": self.duration_seconds,
            "turn_count": self.turn_count,
            "is_active": self.is_active,
            "summary": json.loads(self.summary_json) if self.summary_json else None,
            "transcript": json.loads(self.transcript_json) if self.transcript_json else []
        }

class UserPreferenceRecord(Base):
    __tablename__ = "preferences"

    id = Column(String(32), primary_key=True, default="default_user")
    speech_speed = Column(String(16), default="normal") # slow, normal, fast
    target_tone = Column(String(32), default="casual") # casual, professional, academic
    store_transcripts = Column(Boolean, default=True)
    preferred_voice = Column(String(64), default="en-US-AriaNeural")
    enable_confidence_analytics = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "speech_speed": self.speech_speed,
            "target_tone": self.target_tone,
            "store_transcripts": self.store_transcripts,
            "preferred_voice": self.preferred_voice,
            "enable_confidence_analytics": self.enable_confidence_analytics
        }

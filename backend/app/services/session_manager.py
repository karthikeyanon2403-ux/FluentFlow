import uuid
import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.models.schemas import CoachMode

class ActiveSession:
    def __init__(self, session_id: str, mode: CoachMode, speech_speed: str = "normal", target_tone: str = "casual", voice_id: str = "en-US-AriaNeural"):
        self.session_id = session_id
        self.mode = mode
        self.speech_speed = speech_speed
        self.target_tone = target_tone
        self.voice_id = voice_id
        self.start_time = time.time()
        self.turns: List[Dict[str, Any]] = []
        self.is_interrupted = False
        self.created_at = datetime.now(timezone.utc).isoformat()

    def add_turn(self, role: str, text: str, feedback: Optional[str] = None, audio_b64: Optional[str] = None):
        self.turns.append({
            "role": role,
            "text": text,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "feedback_snippet": feedback,
            "audio_base64": audio_b64
        })

    def interrupt(self):
        self.is_interrupted = True

    def reset_interruption(self):
        self.is_interrupted = False

    def get_duration(self) -> int:
        return int(time.time() - self.start_time)

class SessionManager:
    def __init__(self):
        self._sessions: Dict[str, ActiveSession] = {}

    def create_session(self, mode: CoachMode, speech_speed: str = "normal", target_tone: str = "casual", voice_id: str = "en-US-AriaNeural") -> ActiveSession:
        s_id = str(uuid.uuid4())
        session = ActiveSession(s_id, mode, speech_speed, target_tone, voice_id)
        self._sessions[s_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[ActiveSession]:
        return self._sessions.get(session_id)

    def remove_session(self, session_id: str):
        if session_id in self._sessions:
            del self._sessions[session_id]

session_manager = SessionManager()

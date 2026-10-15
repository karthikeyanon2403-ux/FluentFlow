from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

class CoachMode(str, Enum):
    CONFIDENT_TALK = "confident_talk"
    GRAMMAR_COACH = "grammar_coach"
    VOCAB_COACH = "vocab_coach"

class StartSessionRequest(BaseModel):
    mode: CoachMode = Field(..., description="The chosen coach mode")
    speech_speed: Optional[str] = Field("normal", description="Speech speed: slow, normal, fast")
    target_tone: Optional[str] = Field("casual", description="Tone: casual, professional, academic")
    voice_id: Optional[str] = Field("en-US-AriaNeural", description="Preferred TTS voice")

class StartSessionResponse(BaseModel):
    session_id: str
    mode: CoachMode
    greeting: str
    greeting_audio_base64: Optional[str] = None
    created_at: str

class MessageTurn(BaseModel):
    role: str # "user" or "assistant"
    text: str
    timestamp: Optional[str] = None
    feedback_snippet: Optional[str] = None # Inline correction note if applicable
    audio_base64: Optional[str] = None

class ProcessTextRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Transcribed user speech or text")

class ProcessTurnResponse(BaseModel):
    session_id: str
    user_text: str
    ai_response: str
    ai_audio_base64: Optional[str] = None
    correction_note: Optional[str] = None
    mode: CoachMode

class EndSessionRequest(BaseModel):
    duration_seconds: Optional[int] = Field(0, description="Session elapsed time in seconds")

class ConfidentTalkSummary(BaseModel):
    fluency_score: int # 1 - 100
    speaking_pace: str # e.g. "Relaxed and steady", "Good conversational flow"
    strengths: List[str]
    encouragement_note: str
    topics_discussed: List[str]

class GrammarCoachSummary(BaseModel):
    accuracy_score: int # 1 - 100
    common_mistakes: List[Dict[str, str]] # [{"original": "...", "corrected": "...", "explanation": "..."}]
    recurring_patterns: List[str]
    practice_exercises: List[str]

class VocabCoachSummary(BaseModel):
    expression_richness_score: int # 1 - 100
    new_expressions_learned: List[str]
    original_vs_improved: List[Dict[str, str]] # [{"original": "...", "improved": "...", "context": "..."}]
    useful_collocations: List[str]
    practice_suggestions: List[str]

class SessionSummaryReport(BaseModel):
    session_id: str
    mode: CoachMode
    duration_seconds: int
    total_turns: int
    overall_feedback: str
    details: Dict[str, Any] # Contains ConfidentTalkSummary / GrammarCoachSummary / VocabCoachSummary
    created_at: str

class UserPreferencesDTO(BaseModel):
    speech_speed: str = "normal"
    target_tone: str = "casual"
    store_transcripts: bool = True
    preferred_voice: str = "en-US-AriaNeural"
    enable_confidence_analytics: bool = True

class SessionListItem(BaseModel):
    id: str
    mode: CoachMode
    created_at: Optional[str]
    ended_at: Optional[str]
    duration_seconds: int
    turn_count: int
    is_active: bool
    summary: Optional[Dict[str, Any]] = None

import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, desc

from app.database import get_db
from app.models.session import SessionRecord, UserPreferenceRecord
from app.models.schemas import (
    CoachMode, StartSessionRequest, StartSessionResponse,
    ProcessTextRequest, ProcessTurnResponse, EndSessionRequest,
    SessionSummaryReport, SessionListItem
)
from app.services.session_manager import session_manager
from app.services.ai_service import ai_service
from app.services.tts_service import tts_service
from app.services.summary_service import summary_service

router = APIRouter(prefix="/api/sessions", tags=["Sessions"])

MODE_GREETINGS = {
    CoachMode.CONFIDENT_TALK: "Hi there! I'm your Confident Talk partner. Don't worry about making mistakes—just speak freely! What's on your mind today?",
    CoachMode.GRAMMAR_COACH: "Hello! I'm your Grammar Coach. We'll have a natural conversation, and I'll share helpful, gentle tips along the way. Where are you joining from today?",
    CoachMode.VOCAB_COACH: "Welcome! I'm your Vocabulary and Expression Coach. Together, we'll discover natural idioms and richer ways to express your ideas. What did you get up to earlier today?"
}

@router.post("/start", response_model=StartSessionResponse)
async def start_session(req: StartSessionRequest, db: AsyncSession = Depends(get_db)):
    active_session = session_manager.create_session(
        mode=req.mode,
        speech_speed=req.speech_speed or "normal",
        target_tone=req.target_tone or "casual",
        voice_id=req.voice_id or "en-US-AriaNeural"
    )

    greeting = MODE_GREETINGS.get(req.mode, "Hello! Let's practice speaking English together.")
    
    # Synthesize greeting audio
    rate_map = {"slow": "-15%", "normal": "+0%", "fast": "+15%"}
    speech_rate = rate_map.get(req.speech_speed, "+0%")
    greeting_audio = await tts_service.synthesize_to_base64(
        text=greeting,
        voice=req.voice_id,
        rate=speech_rate
    )

    active_session.add_turn("assistant", greeting, audio_b64=greeting_audio)

    # Record in database
    db_session = SessionRecord(
        id=active_session.session_id,
        mode=req.mode.value,
        created_at=datetime.now(timezone.utc),
        is_active=True,
        turn_count=1,
        transcript_json=json.dumps([{"role": "assistant", "text": greeting}])
    )
    db.add(db_session)
    await db.commit()

    return StartSessionResponse(
        session_id=active_session.session_id,
        mode=req.mode,
        greeting=greeting,
        greeting_audio_base64=greeting_audio,
        created_at=active_session.created_at
    )

@router.post("/{session_id}/turn", response_model=ProcessTurnResponse)
async def process_turn(session_id: str, req: ProcessTextRequest, db: AsyncSession = Depends(get_db)):
    session = session_manager.get_session(session_id)
    if not session:
        # Check database if session exists
        res = await db.execute(select(SessionRecord).where(SessionRecord.id == session_id))
        rec = res.scalar_one_or_none()
        if not rec:
            raise HTTPException(status_code=404, detail="Session not found or expired")
        session = session_manager.create_session(mode=CoachMode(rec.mode))
        session.session_id = session_id

    user_text = req.text.strip()
    if not user_text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    session.add_turn("user", user_text)

    # Generate AI response tailored to active mode
    history_tuples = [{"role": t["role"], "text": t["text"]} for t in session.turns[:-1]]
    ai_reply, feedback = await ai_service.generate_response(
        mode=session.mode,
        history=history_tuples,
        user_message=user_text,
        target_tone=session.target_tone
    )

    # Synthesize AI speech
    rate_map = {"slow": "-15%", "normal": "+0%", "fast": "+15%"}
    speech_rate = rate_map.get(session.speech_speed, "+0%")
    ai_audio = await tts_service.synthesize_to_base64(
        text=ai_reply,
        voice=session.voice_id,
        rate=speech_rate
    )

    session.add_turn("assistant", ai_reply, feedback=feedback, audio_b64=ai_audio)

    # Update DB transcript and turn count
    res = await db.execute(select(SessionRecord).where(SessionRecord.id == session_id))
    rec = res.scalar_one_or_none()
    if rec:
        rec.turn_count = len(session.turns)
        rec.transcript_json = json.dumps([
            {"role": t["role"], "text": t["text"], "feedback": t.get("feedback_snippet")}
            for t in session.turns
        ])
        await db.commit()

    return ProcessTurnResponse(
        session_id=session_id,
        user_text=user_text,
        ai_response=ai_reply,
        ai_audio_base64=ai_audio,
        correction_note=feedback,
        mode=session.mode
    )

@router.post("/{session_id}/end", response_model=SessionSummaryReport)
async def end_session(session_id: str, req: EndSessionRequest, db: AsyncSession = Depends(get_db)):
    session = session_manager.get_session(session_id)
    duration = req.duration_seconds if req.duration_seconds and req.duration_seconds > 0 else (session.get_duration() if session else 60)

    # Fetch DB record
    res = await db.execute(select(SessionRecord).where(SessionRecord.id == session_id))
    rec = res.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Session record not found")

    mode = CoachMode(rec.mode)
    turns = session.turns if session else (json.loads(rec.transcript_json) if rec.transcript_json else [])

    # Generate mode-specific evaluation summary
    summary_data = await summary_service.generate_summary(
        session_id=session_id,
        mode=mode,
        duration_seconds=duration,
        turns=turns,
        target_tone=session.target_tone if session else "casual"
    )

    now_iso = datetime.now(timezone.utc).isoformat()
    summary_data["created_at"] = now_iso

    # Persist summary
    rec.is_active = False
    rec.ended_at = datetime.now(timezone.utc)
    rec.duration_seconds = duration
    rec.turn_count = len(turns)
    rec.summary_json = json.dumps(summary_data)
    await db.commit()

    if session:
        session_manager.remove_session(session_id)

    return SessionSummaryReport(**summary_data)

@router.get("/{session_id}/summary", response_model=SessionSummaryReport)
async def get_session_summary(session_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SessionRecord).where(SessionRecord.id == session_id))
    rec = res.scalar_one_or_none()
    if not rec or not rec.summary_json:
        raise HTTPException(status_code=404, detail="Summary not found for this session")

    data = json.loads(rec.summary_json)
    return SessionSummaryReport(**data)

@router.get("", response_model=list[SessionListItem])
async def list_sessions(limit: int = 20, db: AsyncSession = Depends(get_db)):
    stmt = select(SessionRecord).order_by(desc(SessionRecord.created_at)).limit(limit)
    res = await db.execute(stmt)
    records = res.scalars().all()
    return [
        SessionListItem(
            id=r.id,
            mode=CoachMode(r.mode),
            created_at=r.created_at.isoformat() if r.created_at else None,
            ended_at=r.ended_at.isoformat() if r.ended_at else None,
            duration_seconds=r.duration_seconds,
            turn_count=r.turn_count,
            is_active=r.is_active,
            summary=json.loads(r.summary_json) if r.summary_json else None
        )
        for r in records
    ]

@router.delete("/{session_id}")
async def delete_session(session_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SessionRecord).where(SessionRecord.id == session_id))
    rec = res.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Session not found")
    await db.delete(rec)
    await db.commit()
    session_manager.remove_session(session_id)
    return {"status": "success", "message": f"Session {session_id} deleted"}

@router.delete("")
async def clear_all_sessions(db: AsyncSession = Depends(get_db)):
    await db.execute(delete(SessionRecord))
    await db.commit()
    session_manager._sessions.clear()
    return {"status": "success", "message": "All session history cleared"}

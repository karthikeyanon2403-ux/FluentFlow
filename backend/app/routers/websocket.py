import json
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.session_manager import session_manager
from app.services.ai_service import ai_service
from app.services.tts_service import tts_service
from app.models.schemas import CoachMode

router = APIRouter(prefix="/api/ws", tags=["WebSocket"])

@router.websocket("/conversation/{session_id}")
async def websocket_conversation(websocket: WebSocket, session_id: str):
    await websocket.accept()
    session = session_manager.get_session(session_id)
    if not session:
        # Create ad-hoc session if not started via REST
        session = session_manager.create_session(mode=CoachMode.CONFIDENT_TALK)
        session.session_id = session_id

    try:
        await websocket.send_json({
            "type": "connection_ready",
            "session_id": session_id,
            "mode": session.mode.value
        })

        while True:
            data = await websocket.receive_text()
            event = json.loads(data)
            event_type = event.get("type")

            if event_type == "ping":
                await websocket.send_json({"type": "pong"})

            elif event_type == "interrupt":
                # User spoke or clicked interrupt while AI was speaking
                session.interrupt()
                await websocket.send_json({"type": "interrupted", "session_id": session_id})

            elif event_type == "user_transcript":
                # User completed speech turn
                user_text = event.get("text", "").strip()
                if not user_text:
                    continue

                session.reset_interruption()
                session.add_turn("user", user_text)

                # Send AI thinking status
                await websocket.send_json({
                    "type": "ai_thinking",
                    "user_text": user_text
                })

                # Generate AI response
                history_tuples = [{"role": t["role"], "text": t["text"]} for t in session.turns[:-1]]
                ai_reply, feedback = await ai_service.generate_response(
                    mode=session.mode,
                    history=history_tuples,
                    user_message=user_text,
                    target_tone=session.target_tone
                )

                if session.is_interrupted:
                    continue

                # Notify client AI is speaking
                await websocket.send_json({
                    "type": "ai_speaking",
                    "ai_text": ai_reply,
                    "feedback_snippet": feedback
                })

                # Synthesize TTS audio
                rate_map = {"slow": "-15%", "normal": "+0%", "fast": "+15%"}
                speech_rate = rate_map.get(session.speech_speed, "+0%")
                ai_audio_b64 = await tts_service.synthesize_to_base64(
                    text=ai_reply,
                    voice=session.voice_id,
                    rate=speech_rate
                )

                if not session.is_interrupted:
                    await websocket.send_json({
                        "type": "ai_audio",
                        "audio_base64": ai_audio_b64,
                        "ai_text": ai_reply,
                        "feedback_snippet": feedback
                    })
                    session.add_turn("assistant", ai_reply, feedback=feedback, audio_b64=ai_audio_b64)

    except WebSocketDisconnect:
        print(f"[WebSocket] Client disconnected from session {session_id}")
    except Exception as e:
        print(f"[WebSocket Error] Exception in session {session_id}: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except:
            pass

import pytest
from app.models.schemas import CoachMode

@pytest.mark.asyncio
async def test_session_lifecycle(client):
    # 1. Start Session
    start_payload = {
        "mode": "confident_talk",
        "speech_speed": "normal",
        "target_tone": "casual"
    }
    res = await client.post("/api/sessions/start", json=start_payload)
    assert res.status_code == 200
    data = res.json()
    assert "session_id" in data
    assert data["mode"] == "confident_talk"
    assert len(data["greeting"]) > 0
    session_id = data["session_id"]

    # 2. Process Turn
    turn_payload = {"text": "I like reading books about history."}
    res = await client.post(f"/api/sessions/{session_id}/turn", json=turn_payload)
    assert res.status_code == 200
    turn_data = res.json()
    assert turn_data["session_id"] == session_id
    assert len(turn_data["ai_response"]) > 0

    # 3. End Session & Retrieve Summary
    end_payload = {"duration_seconds": 120}
    res = await client.post(f"/api/sessions/{session_id}/end", json=end_payload)
    assert res.status_code == 200
    summary_data = res.json()
    assert summary_data["session_id"] == session_id
    assert summary_data["mode"] == "confident_talk"
    assert "details" in summary_data
    assert "fluency_score" in summary_data["details"]

    # 4. List Sessions
    res = await client.get("/api/sessions")
    assert res.status_code == 200
    sessions_list = res.json()
    assert len(sessions_list) >= 1
    assert any(s["id"] == session_id for s in sessions_list)

    # 5. Delete Session
    res = await client.delete(f"/api/sessions/{session_id}")
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_grammar_coach_summary(client):
    # Start Grammar Coach session
    res = await client.post("/api/sessions/start", json={"mode": "grammar_coach"})
    session_id = res.json()["session_id"]

    # Process turn with ESL mistake
    await client.post(f"/api/sessions/{session_id}/turn", json={"text": "I am Thanjavur."})

    # End session
    res = await client.post(f"/api/sessions/{session_id}/end", json={"duration_seconds": 60})
    assert res.status_code == 200
    summary = res.json()
    assert summary["mode"] == "grammar_coach"
    assert "common_mistakes" in summary["details"]
    assert "practice_exercises" in summary["details"]

@pytest.mark.asyncio
async def test_vocab_coach_summary(client):
    # Start Vocab Coach session
    res = await client.post("/api/sessions/start", json={"mode": "vocab_coach"})
    session_id = res.json()["session_id"]

    # Process turn with basic vocabulary
    await client.post(f"/api/sessions/{session_id}/turn", json={"text": "The movie was very good."})

    # End session
    res = await client.post(f"/api/sessions/{session_id}/end", json={"duration_seconds": 90})
    assert res.status_code == 200
    summary = res.json()
    assert summary["mode"] == "vocab_coach"
    assert "new_expressions_learned" in summary["details"]
    assert "original_vs_improved" in summary["details"]

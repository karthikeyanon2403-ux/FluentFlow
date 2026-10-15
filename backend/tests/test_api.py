import pytest

@pytest.mark.asyncio
async def test_health_check(client):
    res = await client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "FluentFlow" in data["app_name"]

@pytest.mark.asyncio
async def test_preferences_get_and_update(client):
    # GET default
    res = await client.get("/api/preferences")
    assert res.status_code == 200
    data = res.json()
    assert "speech_speed" in data

    # PUT update
    update_data = {
        "speech_speed": "slow",
        "target_tone": "professional",
        "store_transcripts": True,
        "preferred_voice": "en-US-GuyNeural",
        "enable_confidence_analytics": True
    }
    res = await client.put("/api/preferences", json=update_data)
    assert res.status_code == 200
    updated = res.json()
    assert updated["speech_speed"] == "slow"
    assert updated["target_tone"] == "professional"

@pytest.mark.asyncio
async def test_invalid_session_turn(client):
    res = await client.post("/api/sessions/non-existent-id/turn", json={"text": "hello"})
    assert res.status_code == 404

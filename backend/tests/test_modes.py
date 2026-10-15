import pytest
from app.models.schemas import CoachMode
from app.services.ai_service import ai_service
from app.services.prompts import get_system_prompt, CONFIDENT_TALK_PROMPT, GRAMMAR_COACH_PROMPT, VOCAB_COACH_PROMPT

@pytest.mark.asyncio
async def test_confident_talk_avoids_unsolicited_corrections():
    """Confident talk must understand imperfect grammar without correcting it."""
    prompt = get_system_prompt(CoachMode.CONFIDENT_TALK)
    assert "ABSOLUTELY NEVER give unsolicited grammar corrections" in prompt
    assert "Your grammar is wrong" in prompt

    user_input = "Yesterday I go to market with my friend."
    response, feedback = await ai_service.generate_response(
        mode=CoachMode.CONFIDENT_TALK,
        history=[],
        user_message=user_input
    )

    assert feedback is None
    # Must NOT contain negative critique or grammar lecturing
    assert "grammar is wrong" not in response.lower()
    assert "you should say" not in response.lower()
    assert "went" not in response.lower() # Did not correct 'go' to 'went'
    # Must continue the conversation naturally
    assert len(response) > 10

@pytest.mark.asyncio
async def test_grammar_coach_provides_gentle_correction():
    """Grammar coach detects meaningful mistakes and continues conversation."""
    prompt = get_system_prompt(CoachMode.GRAMMAR_COACH)
    assert "A more natural way to say that is" in prompt

    user_input = "I am Thanjavur."
    response, feedback = await ai_service.generate_response(
        mode=CoachMode.GRAMMAR_COACH,
        history=[],
        user_message=user_input
    )

    # Must provide the correct prepositional form
    assert "I am from Thanjavur" in response or "from" in response.lower()
    # Must immediately ask a follow-up question
    assert "?" in response
    assert feedback is not None

@pytest.mark.asyncio
async def test_vocab_coach_suggests_rich_expression():
    """Vocabulary coach suggests richer expressions and continues conversation."""
    prompt = get_system_prompt(CoachMode.VOCAB_COACH)
    assert "natural expressions, collocations, phrasal verbs" in prompt

    user_input = "The movie was very good."
    response, feedback = await ai_service.generate_response(
        mode=CoachMode.VOCAB_COACH,
        history=[],
        user_message=user_input
    )

    # Must offer more expressive alternatives
    assert any(term in response.lower() for term in ["exceptional", "delightful", "captivating", "top-notch"])
    # Must continue the dialogue
    assert "?" in response
    assert feedback is not None

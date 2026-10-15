import asyncio
import base64
import os
import tempfile
import edge_tts
from app.config import settings

class TTSService:
    @staticmethod
    async def synthesize_to_base64(text: str, voice: str = None, rate: str = None) -> str:
        """
        Synthesizes text to speech using edge-tts and returns a base64 encoded MP3 string.
        """
        selected_voice = voice or settings.DEFAULT_VOICE
        selected_rate = rate or settings.DEFAULT_SPEECH_RATE

        if not text or not text.strip():
            return ""

        try:
            communicate = edge_tts.Communicate(
                text=text.strip(),
                voice=selected_voice,
                rate=selected_rate
            )

            # Stream audio into memory bytes
            audio_bytes = bytearray()
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_bytes.extend(chunk["data"])

            if audio_bytes:
                return base64.b64encode(audio_bytes).decode("utf-8")
        except Exception as e:
            print(f"[TTSService Error] Speech synthesis failed: {e}")

        return ""

tts_service = TTSService()

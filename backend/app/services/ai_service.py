import os
import re
import json
import httpx
from typing import List, Dict, Optional, Tuple
from app.config import settings
from app.models.schemas import CoachMode
from app.services.prompts import get_system_prompt

class AIService:
    def __init__(self):
        self.gemini_client = None
        self._init_providers()

    def _init_providers(self):
        if settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.gemini_client = genai
                print("[AIService] Google Gemini configured successfully.")
            except Exception as e:
                print(f"[AIService] Failed to configure Gemini: {e}")

    async def generate_response(
        self,
        mode: CoachMode,
        history: List[Dict[str, str]],
        user_message: str,
        target_tone: str = "casual"
    ) -> Tuple[str, Optional[str]]:
        """
        Generates an AI response based on the conversation history and selected mode.
        Returns: (ai_text_response, optional_inline_correction_snippet)
        """
        system_instruction = get_system_prompt(mode, target_tone)

        # 1. Try Gemini if configured
        if settings.GEMINI_API_KEY and self.gemini_client:
            try:
                model = self.gemini_client.GenerativeModel(
                    model_name="gemini-2.0-flash",
                    system_instruction=system_instruction
                )
                
                # Format history for Gemini chat
                formatted_contents = []
                for turn in history[-10:]:
                    role = "user" if turn.get("role") == "user" else "model"
                    formatted_contents.append({"role": role, "parts": [turn.get("text", "")]})
                formatted_contents.append({"role": role, "parts": [user_message]})

                chat = model.start_chat(history=formatted_contents[:-1])
                response = await chat.send_message_async(user_message)
                return response.text.strip(), None
            except Exception as e:
                print(f"[AIService] Gemini API error: {e}. Falling back to secondary engine.")

        # 2. Try OpenAI if configured
        if settings.OPENAI_API_KEY:
            try:
                from openai import AsyncOpenAI
                client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
                messages = [{"role": "system", "content": system_instruction}]
                for turn in history[-10:]:
                    messages.append({"role": turn.get("role", "user"), "content": turn.get("text", "")})
                messages.append({"role": "user", "content": user_message})

                completion = await client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages,
                    max_tokens=250,
                    temperature=0.7
                )
                return completion.choices[0].message.content.strip(), None
            except Exception as e:
                print(f"[AIService] OpenAI API error: {e}. Falling back to secondary engine.")

        # 3. Intelligent Built-in Fallback Coach Engine
        return self._intelligent_fallback_response(mode, user_message, history, target_tone)

    def _intelligent_fallback_response(
        self,
        mode: CoachMode,
        user_msg: str,
        history: List[Dict[str, str]],
        target_tone: str
    ) -> Tuple[str, Optional[str]]:
        text_lower = user_msg.lower().strip()

        # Handle Mode 1: Confident Talk
        # Strict Rule: NEVER correct grammar or vocabulary. Focus solely on conversational flow.
        if mode == CoachMode.CONFIDENT_TALK:
            if any(w in text_lower for w in ["hi", "hello", "hey", "good morning", "good evening"]):
                return "Hello! It is so wonderful to speak with you today. How has your day been going so far?", None
            elif any(w in text_lower for w in ["go to market", "went to market", "market", "shop", "shopping"]):
                return "That sounds like a productive trip! What were you shopping for, and did you find everything you needed?", None
            elif any(w in text_lower for w in ["learn", "english", "speak", "practice"]):
                return "You are doing fantastic! Speaking regularly is the best way to gain fluency. What topic would you like to chat about today?", None
            elif any(w in text_lower for w in ["weekend", "saturday", "sunday", "holiday"]):
                return "Weekends are great for recharging. Did you get to relax or spend time with family and friends?", None
            elif any(w in text_lower for w in ["work", "job", "office", "study", "college"]):
                return "Work and study can keep us so busy! What is a project or task you've been focusing on lately?", None
            else:
                return f"I see what you mean! That's really interesting. Could you tell me a little more about your thoughts on that?", None

        # Handle Mode 2: Grammar Coach
        # Strict Rule: Brief, gentle correction + continue conversation immediately.
        elif mode == CoachMode.GRAMMAR_COACH:
            # Pattern: "I am [Place]" (e.g. "I am Thanjavur" / "I am Chennai")
            place_match = re.search(r"\bi am ([a-z]+)\b", text_lower)
            if place_match and place_match.group(1) not in ["fine", "good", "happy", "learning", "trying", "here", "ready", "speaking"]:
                place = place_match.group(1).capitalize()
                return f"Oh, you're from {place}! A more natural way to express that is 'I am from {place}.' What do you love most about your hometown?", f"Say 'I am from {place}' instead of 'I am {place}'"
            
            # Pattern: "Yesterday I go" / "Yesterday I buy"
            if "yesterday" in text_lower and re.search(r"\b(i go|i buy|i see|i eat)\b", text_lower):
                past_verb = "went" if "go" in text_lower else "bought" if "buy" in text_lower else "saw" if "see" in text_lower else "ate"
                return f"Got it! Since this happened yesterday, you'd use the past tense: 'Yesterday I {past_verb}.' How was the experience?", f"Use past tense: 'Yesterday I {past_verb}'"

            # Pattern: "He don't" / "She don't"
            if re.search(r"\b(he|she|it) don't\b", text_lower):
                subj = re.search(r"\b(he|she|it) don't\b", text_lower).group(1)
                return f"I understand! Remember that for {subj}, we use 'doesn't'—so '{subj} doesn't.' What else happened with them?", f"Use '{subj} doesn't' instead of '{subj} don't'"

            # Pattern: "I have 20 years old"
            if "i have" in text_lower and "years old" in text_lower:
                return "Ah, in English we say 'I am [age] years old' rather than 'I have.' Are you enjoying your current stage of life?", "Say 'I am ... years old'"

            # General natural continuation with grammar polish if sentence seems informal
            if text_lower.startswith("i ") and " because " not in text_lower:
                return f"That's very clear! Your sentence structure is coming along well. Could you share an example of what you mean by that?", None
            return "That makes total sense! Your phrasing is understandable. How did you first get interested in that?", None

        # Handle Mode 3: Vocabulary & Expression Coach
        # Strict Rule: Provide rich collocations, nuance, tone distinction, and continue conversation.
        elif mode == CoachMode.VOCAB_COACH:
            if "very good" in text_lower:
                return "That's wonderful! Instead of 'very good', you could say 'exceptional', 'delightful', or 'top-notch' depending on the setting. What stood out to you the most about it?", "Try 'exceptional' or 'delightful'"
            elif "very bad" in text_lower:
                return "I hear you. A more vivid phrase might be 'dreadful', 'subpar', or 'disappointing.' What caused things to go so poorly?", "Try 'dreadful' or 'subpar'"
            elif "big problem" in text_lower:
                return "That sounds tough. In professional English, people often refer to that as a 'major challenge' or a 'pressing issue.' How are you planning to address it?", "Try 'major challenge' or 'pressing issue'"
            elif "movie" in text_lower or "film" in text_lower:
                return "I love talking about cinema! You might describe a great movie as 'gripping', 'thought-provoking', or 'visually stunning.' What was your favorite scene?", "Try 'gripping' or 'visually stunning'"
            elif "food" in text_lower or "eat" in text_lower:
                return "Food is such a sensory experience! Instead of just 'tasty', you could say 'flavorful', 'savory', or 'mouthwatering.' What flavors did you notice?", "Try 'flavorful' or 'mouthwatering'"
            else:
                return "Nicely expressed! To add even more polish, intermediate speakers often use phrases like 'from my perspective' or 'it strikes me that.' What other details can you share?", "Use phrases like 'from my perspective'"

        return "I'm listening! Please go on, I'd love to hear more about your thoughts.", None

ai_service = AIService()

# FluentFlow — AI English Communication Coach

**FluentFlow** is a real-time, voice-first AI English communication coach designed to help English learners transition from basic understanding to natural, confident, and fluent spoken English.

Rather than interacting like a traditional text chatbot, FluentFlow provides an immersive, **phone-call-style audio experience** featuring real-time speech recognition, natural conversational pauses, low-latency spoken responses, speech turn completion, live audio waveforms, barge-in / interruption handling, and structured post-call reports.

---

## 1. Product Modes

FluentFlow provides three distinct coaching modes with isolated system behaviors:

### 1. Confident Talk
* **Goal:** Overcome the fear of speaking and build conversational courage.
* **Behavior:** Acts like a warm, patient human friend on a phone call.
* **Strict Constraint:** **Zero unsolicited corrections.** Understands imperfect grammar (e.g., *"Yesterday I go to market"*) without judging, and responds naturally to the topic (*"Oh, nice! What did you buy at the market?"*). Never says *"Your grammar is wrong"* or *"You should say this instead"*.
* **Session Report:** Fluency praise, conversational courage metrics, speaking pace, and topics discussed.

### 2. Grammar Coach
* **Goal:** Improve grammatical accuracy without disrupting the natural flow of conversation.
* **Behavior:** Detects meaningful grammar mistakes (e.g., *"I am Thanjavur"*), offers a friendly, concise inline model (*"Oh, you're from Thanjavur! A more natural way to express that is 'I am from Thanjavur.' What do you like most about your hometown?"*), and immediately continues the dialogue.
* **Strict Constraint:** Does not sound like an examiner. Prioritizes recurring and important mistakes over minor slips.
* **Session Report:** Key mistakes detected with original vs. corrected examples, grammar rules explained, and 3 focused practice exercises.

### 3. Vocabulary & Expression Coach
* **Goal:** Help intermediate speakers express thoughts more vividly, precisely, and idiomatically.
* **Behavior:** Assumes the user knows basic English; naturally weaves in natural collocations, phrasal verbs, and expressive alternatives (e.g., replacing *"The movie was very good"* with *"captivating"* or *"delightful"*).
* **Strict Constraint:** Differentiates between casual, professional, and academic tone without demanding artificial or archaic language.
* **Session Report:** New expressions learned, original vs. polished comparison table, context recommendations, and collocations list.

---

## 2. System Architecture

```
FluentFlow/
├── backend/                        # Python FastAPI Backend
│   ├── app/
│   │   ├── config.py               # Pydantic Settings & environment variables
│   │   ├── database.py             # SQLite async engine via SQLAlchemy & aiosqlite
│   │   ├── main.py                 # FastAPI application, CORS, lifespan
│   │   ├── models/
│   │   │   ├── schemas.py          # Pydantic request/response & summary models
│   │   │   └── session.py          # SQLAlchemy SessionRecord & UserPreferenceRecord
│   │   ├── routers/
│   │   │   ├── health.py           # /api/health
│   │   │   ├── preferences.py      # /api/preferences (GET/PUT)
│   │   │   ├── sessions.py         # /api/sessions (start, turn, end, summary, list, delete)
│   │   │   └── websocket.py        # /api/ws/conversation/{id} (Realtime streaming)
│   │   └── services/
│   │       ├── ai_service.py       # Modular AI provider (Gemini, OpenAI, Fallback)
│   │       ├── prompts.py          # Isolated mode instructions & summary prompts
│   │       ├── session_manager.py  # In-memory session tracking & turn management
│   │       └── tts_service.py      # High-fidelity Neural TTS via edge-tts
│   ├── data/                       # Local SQLite storage (fluentflow.db)
│   ├── tests/                      # Pytest test suite (100% passing)
│   │   ├── test_api.py             # API endpoints & validation
│   │   ├── test_modes.py           # Mode-specific behavior & prompt verification
│   │   └── test_sessions.py        # End-to-end session lifecycles
│   └── .env.example                # Template for API keys & settings
├── frontend/                       # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── CallView.tsx        # Phone call interface with visualizer & controls
│   │   │   ├── DashboardView.tsx   # Mode selection, settings bar, start call CTA
│   │   │   ├── HistoryDrawer.tsx   # Past session history & reports
│   │   │   ├── Navbar.tsx          # App header & status indicators
│   │   │   ├── PreferencesModal.tsx# Voice, tone, speed, and privacy settings
│   │   │   └── SummaryModal.tsx    # Comprehensive post-call assessment modal
│   │   ├── services/
│   │   │   ├── apiService.ts       # Typed fetch client
│   │   │   └── voiceService.ts     # Mic stream, Web Audio analyser, SpeechRecognition
│   │   ├── types.ts                # TypeScript domain models
│   │   └── App.tsx                 # Core application state orchestrator
├── run_app.sh                      # One-command full-stack runner
├── start_backend.sh                # Dedicated backend launcher
└── start_frontend.sh               # Dedicated frontend launcher
```

---

## 3. Real-Time Voice Pipeline

1. **User Audio Input:** Captured via `navigator.mediaDevices.getUserMedia` with real-time volume analysis via the Web Audio API (`AnalyserNode`) to power dynamic waveforms.
2. **Speech Recognition:** Continuous speech recognition with intelligent turn-completion (debounces 1.8 seconds of silence to finalize turns naturally).
3. **AI Processing:** Fast turn processing with mode-specific instructions.
4. **Spoken Output:** Neural audio synthesis via Microsoft Edge TTS (`edge-tts`) producing crystal-clear natural voices (`en-US-AriaNeural`, `en-US-GuyNeural`, etc.) encoded in base64 MP3 chunks.
5. **Barge-in / Interruption:** If the user speaks or clicks "Interrupt" while the AI is speaking, audio playback halts instantly and the coach transitions back to listening.

---

## 4. Privacy, Security & Data Safety

* **Zero Raw Audio Storage:** Raw audio streams are processed in memory and never written to disk or recorded.
* **Secure Credentials:** API keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`) reside exclusively in the backend `.env` file and are never sent to the client browser.
* **Optional Transcripts:** Users can toggle transcript storage on or off in Settings.
* **Data Control:** Users can view and delete individual sessions or wipe their complete history at any time.

---

## 5. Quick Start Guide

### Prerequisites
* Python 3.10+
* Node.js v20+ & npm

### Starting Both Frontend and Backend (Recommended)

Simply execute the unified runner script:
```bash
./run_app.sh
```

* **Frontend:** [http://localhost:5173](http://localhost:5173)
* **Backend:** [http://localhost:8000](http://localhost:8000)
* **Swagger API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Manual Setup & Execution

#### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

---

## 6. Configuring AI Providers

FluentFlow includes an **Intelligent Conversational Engine** that works out of the box with zero external API keys required.

To connect your Google Gemini or OpenAI accounts for enhanced generative responses, edit `backend/.env`:

```env
# Google Gemini (Recommended for low-latency voice)
GEMINI_API_KEY=your_gemini_api_key_here

# OpenAI (Alternative)
OPENAI_API_KEY=your_openai_api_key_here
```

Get a free Gemini API key at: [Google AI Studio](https://aistudio.google.com/app/apikey).

---

## 7. Running Backend Tests

Run the full pytest suite covering health endpoints, mode rules, prompt isolation, and session reporting:

```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

All 9 test suites pass with 100% green status.

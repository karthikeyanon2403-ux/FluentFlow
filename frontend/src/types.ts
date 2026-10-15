export type CoachMode = 'confident_talk' | 'grammar_coach' | 'vocab_coach';

export type CallState = 
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'ai_thinking'
  | 'ai_speaking'
  | 'interrupted'
  | 'error';

export interface MessageTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp?: string;
  feedback_snippet?: string;
  audio_base64?: string;
}

export interface ConfidentTalkDetails {
  fluency_score: number;
  speaking_pace: string;
  strengths: string[];
  encouragement_note: string;
  topics_discussed: string[];
}

export interface GrammarCoachDetails {
  accuracy_score: number;
  common_mistakes: Array<{
    original: string;
    corrected: string;
    explanation: string;
  }>;
  recurring_patterns: string[];
  practice_exercises: string[];
}

export interface VocabCoachDetails {
  expression_richness_score: number;
  new_expressions_learned: string[];
  original_vs_improved: Array<{
    original: string;
    improved: string;
    context: string;
  }>;
  useful_collocations: string[];
  practice_suggestions: string[];
}

export interface SessionSummaryReport {
  session_id: string;
  mode: CoachMode;
  duration_seconds: number;
  total_turns: number;
  overall_feedback: string;
  details: ConfidentTalkDetails | GrammarCoachDetails | VocabCoachDetails | Record<string, any>;
  created_at?: string;
}

export interface UserPreferences {
  speech_speed: 'slow' | 'normal' | 'fast';
  target_tone: 'casual' | 'professional' | 'academic';
  store_transcripts: boolean;
  preferred_voice: string;
  enable_confidence_analytics: boolean;
}

export interface SessionListItem {
  id: string;
  mode: CoachMode;
  created_at?: string;
  ended_at?: string;
  duration_seconds: number;
  turn_count: number;
  is_active: boolean;
  summary?: SessionSummaryReport;
}

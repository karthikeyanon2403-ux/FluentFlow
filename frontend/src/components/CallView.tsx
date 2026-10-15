import React, { useState, useEffect } from 'react';
import { CoachMode, CallState, MessageTurn } from '../types';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Hand, 
  MessageSquare, 
  Send, 
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface CallViewProps {
  mode: CoachMode;
  callState: CallState;
  durationSeconds: number;
  turns: MessageTurn[];
  interimTranscript: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onInterrupt: () => void;
  onEndCall: () => void;
  onSendTextTurn: (text: string) => void;
  errorMessage?: string;
  micVolume: number;
}

export const CallView: React.FC<CallViewProps> = ({
  mode,
  callState,
  durationSeconds,
  turns,
  interimTranscript,
  isMuted,
  onToggleMute,
  onInterrupt,
  onEndCall,
  onSendTextTurn,
  errorMessage,
  micVolume
}) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const [textInput, setTextInput] = useState('');

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'confident_talk': return 'Confident Talk';
      case 'grammar_coach': return 'Grammar Coach';
      case 'vocab_coach': return 'Vocabulary Coach';
    }
  };

  const getModeColor = () => {
    switch (mode) {
      case 'confident_talk': return 'emerald';
      case 'grammar_coach': return 'indigo';
      case 'vocab_coach': return 'amber';
    }
  };

  const latestTurn = turns.length > 0 ? turns[turns.length - 1] : null;

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      onSendTextTurn(textInput.trim());
      setTextInput('');
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 sm:p-8 max-w-4xl mx-auto">
      {/* Top Header: Mode, Timer, Connection Badge */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${
            callState === 'ai_speaking' ? 'bg-indigo-400 animate-ping' :
            callState === 'listening' ? 'bg-emerald-400 animate-pulse' :
            callState === 'ai_thinking' ? 'bg-amber-400 animate-bounce' : 'bg-slate-500'
          }`} />
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              {getModeTitle()}
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Call time: {formatTime(durationSeconds)}
            </p>
          </div>
        </div>

        {/* State Pill */}
        <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium flex items-center gap-2">
          {callState === 'connecting' && <span className="text-slate-400">Connecting audio...</span>}
          {callState === 'listening' && (
            <span className="text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Listening to you...
            </span>
          )}
          {callState === 'ai_thinking' && (
            <span className="text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              AI Thinking...
            </span>
          )}
          {callState === 'ai_speaking' && (
            <span className="text-indigo-400 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 animate-bounce" />
              AI Speaking
            </span>
          )}
          {callState === 'interrupted' && (
            <span className="text-rose-400 flex items-center gap-1.5">
              <Hand className="w-3.5 h-3.5" />
              Interrupted
            </span>
          )}
          {callState === 'error' && (
            <span className="text-rose-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Audio Notice
            </span>
          )}
        </div>
      </div>

      {/* Center Phone Call Experience */}
      <div className="my-auto flex flex-col items-center justify-center text-center py-6">
        {/* Animated Visualizer Avatar */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Pulsing Ripple rings when AI speaks or User speaks */}
          {(callState === 'ai_speaking' || (callState === 'listening' && micVolume > 15)) && (
            <>
              <div className="absolute w-48 h-48 rounded-full bg-indigo-500/10 animate-ping" />
              <div className="absolute w-60 h-60 rounded-full bg-indigo-500/5 animate-pulse" />
            </>
          )}

          {/* Central Orb */}
          <div className={`w-36 h-36 rounded-full p-1.5 bg-gradient-to-tr from-indigo-500 via-teal-400 to-indigo-600 shadow-2xl transition-all duration-300 ${
            callState === 'ai_speaking' ? 'scale-105 shadow-indigo-500/40' : 'scale-100 shadow-indigo-500/10'
          }`}>
            <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center border border-slate-800">
              {callState === 'ai_speaking' ? (
                /* Dynamic Waveform bars */
                <div className="flex items-center gap-1.5 h-12">
                  <span className="w-1.5 h-6 bg-indigo-400 rounded-full animate-pulse-wave-1" />
                  <span className="w-1.5 h-10 bg-teal-400 rounded-full animate-pulse-wave-2" />
                  <span className="w-1.5 h-12 bg-indigo-300 rounded-full animate-pulse-wave-3" />
                  <span className="w-1.5 h-8 bg-teal-300 rounded-full animate-pulse-wave-4" />
                  <span className="w-1.5 h-5 bg-indigo-400 rounded-full animate-pulse-wave-5" />
                </div>
              ) : callState === 'listening' ? (
                /* Reactive Mic Level indicator */
                <div className="flex flex-col items-center gap-2">
                  <Mic className={`w-10 h-10 transition-colors ${micVolume > 15 ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-400 transition-all duration-75"
                      style={{ width: `${Math.min(100, micVolume * 1.5)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Live Subtitle / Prompt Bubble */}
        <div className="max-w-xl w-full min-h-[90px] flex items-center justify-center px-4">
          {interimTranscript ? (
            <div className="bg-slate-900/90 border border-emerald-500/30 text-emerald-200 px-5 py-3 rounded-2xl text-sm sm:text-base backdrop-blur-md shadow-lg animate-fade-in">
              <span className="text-xs uppercase text-emerald-400 font-bold block mb-1">You are saying:</span>
              "{interimTranscript}"
            </div>
          ) : latestTurn ? (
            <div className="bg-slate-900/80 border border-slate-800 text-slate-200 px-5 py-3.5 rounded-2xl text-sm sm:text-base backdrop-blur-md shadow-md">
              <span className="text-xs uppercase text-indigo-400 font-bold block mb-1">
                {latestTurn.role === 'assistant' ? 'AI Coach:' : 'You said:'}
              </span>
              "{latestTurn.text}"
              {latestTurn.feedback_snippet && (
                <div className="mt-2 text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1.5 rounded-lg text-left">
                  💡 {latestTurn.feedback_snippet}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Speak into your microphone naturally. Your coach is listening.</p>
          )}
        </div>

        {errorMessage && (
          <div className="mt-4 px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Bottom Phone Action Bar */}
      <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl p-4 sm:p-5 rounded-2xl shadow-2xl flex items-center justify-between gap-4 max-w-xl mx-auto w-full z-10">
        {/* Mic Mute Button */}
        <button
          onClick={onToggleMute}
          className={`p-3.5 rounded-full border transition-all ${
            isMuted 
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' 
              : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
          }`}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Interrupt AI Button */}
        <button
          onClick={onInterrupt}
          disabled={callState !== 'ai_speaking'}
          className={`px-4 py-2.5 rounded-full border text-xs font-semibold flex items-center gap-2 transition-all ${
            callState === 'ai_speaking'
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
              : 'bg-slate-950/50 border-slate-800 text-slate-600 cursor-not-allowed'
          }`}
          title="Interrupt coach and speak"
        >
          <Hand className="w-4 h-4" />
          <span>Interrupt</span>
        </button>

        {/* Toggle Transcript Panel */}
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className={`p-3.5 rounded-full border transition-all ${
            showTranscript
              ? 'bg-indigo-600 border-indigo-500 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
          }`}
          title="Toggle Live Transcript & Chat"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        {/* End Call Button (Big Red Hangup) */}
        <button
          onClick={onEndCall}
          className="px-6 py-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95"
          title="End Call and View Summary"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="hidden sm:inline">End Call</span>
        </button>
      </div>

      {/* Slide-out Live Transcript Drawer */}
      {showTranscript && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-950/95 border-l border-slate-800 shadow-2xl backdrop-blur-xl z-50 flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              Conversation Transcript
            </h3>
            <button 
              onClick={() => setShowTranscript(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Transcript List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {turns.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No turns yet. Speak to start the conversation.</p>
            ) : (
              turns.map((turn, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${turn.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-slate-400 mb-1 px-1">
                    {turn.role === 'user' ? 'You' : 'AI Coach'}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm ${
                      turn.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    {turn.text}
                    {turn.feedback_snippet && (
                      <div className="mt-2 text-[11px] bg-slate-950/60 p-2 rounded-lg border border-indigo-500/20 text-indigo-300">
                        💡 {turn.feedback_snippet}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Fallback Text Input Form */}
          <form onSubmit={handleSendText} className="p-3 border-t border-slate-800 bg-slate-900/50 flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Or type what you want to say..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

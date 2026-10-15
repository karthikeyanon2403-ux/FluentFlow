import React from 'react';
import { CoachMode } from '../types';
import { 
  PhoneCall, 
  MessageCircle, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Gauge, 
  Mic2,
  Clock,
  ArrowRight
} from 'lucide-react';

interface DashboardViewProps {
  selectedMode: CoachMode;
  onSelectMode: (mode: CoachMode) => void;
  onStartCall: () => void;
  isLoading: boolean;
  speechSpeed: string;
  onChangeSpeed: (speed: 'slow' | 'normal' | 'fast') => void;
  targetTone: string;
  onChangeTone: (tone: 'casual' | 'professional' | 'academic') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  selectedMode,
  onSelectMode,
  onStartCall,
  isLoading,
  speechSpeed,
  onChangeSpeed,
  targetTone,
  onChangeTone
}) => {
  const modes = [
    {
      id: 'confident_talk' as CoachMode,
      title: 'Confident Talk',
      tagline: 'Speak without fear of judgment',
      badge: 'Flow & Confidence',
      description: 'Practice speaking freely with a warm, patient partner. Zero unsolicited grammar corrections. Perfect for breaking the hesitation barrier.',
      color: 'emerald',
      icon: MessageCircle,
      gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
      borderColor: 'border-emerald-500/40',
      activeBorder: 'border-emerald-400 ring-2 ring-emerald-500/20',
      accentText: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      sample: 'User: "Yesterday I go to market." ➔ AI: "Nice! What did you buy at the market?"'
    },
    {
      id: 'grammar_coach' as CoachMode,
      title: 'Grammar Coach',
      tagline: 'Learn naturally while talking',
      badge: 'Accuracy & Clarity',
      description: 'Engage in natural conversation while receiving friendly, concise inline corrections for key grammatical mistakes without interruption.',
      color: 'indigo',
      icon: CheckCircle2,
      gradient: 'from-indigo-500/10 via-blue-500/5 to-transparent',
      borderColor: 'border-indigo-500/40',
      activeBorder: 'border-indigo-400 ring-2 ring-indigo-500/20',
      accentText: 'text-indigo-400',
      badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
      sample: 'User: "I am Thanjavur." ➔ AI: "Oh, you\'re from Thanjavur! What do you like about it?"'
    },
    {
      id: 'vocab_coach' as CoachMode,
      title: 'Vocabulary & Expression Coach',
      tagline: 'Sound more natural & precise',
      badge: 'Nuance & Idioms',
      description: 'Expand beyond basic words. Discover native-like collocations, phrasal verbs, and appropriate expressions for casual and workplace communication.',
      color: 'amber',
      icon: Sparkles,
      gradient: 'from-amber-500/10 via-purple-500/5 to-transparent',
      borderColor: 'border-amber-500/40',
      activeBorder: 'border-amber-400 ring-2 ring-amber-500/20',
      accentText: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      sample: 'User: "Movie was very good." ➔ AI: "You could say \'captivating\'! What made it enjoyable?"'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4">
          <Mic2 className="w-3.5 h-3.5" />
          Real-Time Spoken English Practice
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Speak English with <span className="bg-gradient-to-r from-indigo-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">confidence.</span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Talk to a responsive AI partner like on a real phone call. Choose the coaching mode that fits your goals today.
        </p>
      </div>

      {/* Mode Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;

          return (
            <div
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className={`relative cursor-pointer rounded-2xl p-6 transition-all duration-200 border bg-slate-900/60 backdrop-blur-sm flex flex-col justify-between ${
                isSelected ? mode.activeBorder : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-slate-800/80 border border-slate-700/60 ${mode.accentText}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${mode.badgeBg}`}>
                    {mode.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-1">{mode.title}</h3>
                <p className="text-xs font-medium text-slate-400 mb-3">{mode.tagline}</p>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{mode.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/70">
                <p className="text-[11px] text-slate-400 font-mono italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/50">
                  {mode.sample}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Call Settings Bar & CTA */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-md shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-6 w-full sm:w-auto">
          {/* Speed Selector */}
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Coach Speed:</span>
            <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
              {(['slow', 'normal', 'fast'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => onChangeSpeed(s)}
                  className={`px-2.5 py-1 rounded-md font-medium capitalize transition-all ${
                    speechSpeed === s
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Tone Selector */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Topic Tone:</span>
            <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
              {(['casual', 'professional', 'academic'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => onChangeTone(t)}
                  className={`px-2.5 py-1 rounded-md font-medium capitalize transition-all ${
                    targetTone === t
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={onStartCall}
          disabled={isLoading}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-teal-500 hover:from-indigo-600 hover:to-teal-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <PhoneCall className="w-4 h-4" />
              <span>Start Voice Call</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Privacy Guarantee Note */}
      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>Privacy-first: No raw audio is saved. Transcripts are stored locally only if enabled.</span>
      </div>
    </div>
  );
};

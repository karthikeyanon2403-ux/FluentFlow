import React, { useState } from 'react';
import type { SessionSummaryReport } from '../types';
import { 
  Trophy, 
  Clock, 
  MessageSquare, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  BookOpen, 
  Repeat, 
  X, 
  Copy, 
  Check 
} from 'lucide-react';

interface SummaryModalProps {
  summary: SessionSummaryReport | null;
  onClose: () => void;
  onStartNew: () => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({ summary, onClose, onStartNew }) => {
  const [copied, setCopied] = useState(false);
  if (!summary) return null;

  const { mode, duration_seconds, total_turns, overall_feedback, details } = summary;

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'confident_talk': return 'Confident Talk';
      case 'grammar_coach': return 'Grammar Coach';
      case 'vocab_coach': return 'Vocabulary Coach';
      default: return 'Communication Coach';
    }
  };

  const handleCopySummary = () => {
    const text = `FluentFlow Session Summary (${getModeTitle()})
Duration: ${formatDuration(duration_seconds)}
Turns: ${total_turns}
Feedback: ${overall_feedback}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {getModeTitle()} Report
              </span>
              <h2 className="text-xl font-bold text-white mt-1">Session Complete!</h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 my-6">
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Duration</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-white">{formatDuration(duration_seconds)}</p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Turns</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-white">{total_turns} spoken</p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Score</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-amber-300">
              {(details as any).fluency_score || (details as any).accuracy_score || (details as any).expression_richness_score || 85}%
            </p>
          </div>
        </div>

        {/* Overall Assessment Banner */}
        <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl mb-6">
          <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed font-medium">
            "{overall_feedback}"
          </p>
        </div>

        {/* Mode-Specific Evaluation Section */}
        <div className="space-y-6 max-h-[45vh] overflow-y-auto pr-1">
          {/* Confident Talk Breakdown */}
          {mode === 'confident_talk' && (
            <>
              {(details as any).strengths && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Speaking Strengths
                  </h4>
                  <div className="space-y-2">
                    {((details as any).strengths as string[]).map((str, i) => (
                      <div key={i} className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{str}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(details as any).encouragement_note && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
                  <span className="text-xs font-semibold text-emerald-400 uppercase block mb-1">Encouragement for next time</span>
                  <p className="text-xs text-emerald-200 leading-relaxed font-medium">
                    {(details as any).encouragement_note}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Grammar Coach Breakdown */}
          {mode === 'grammar_coach' && (
            <>
              {(details as any).common_mistakes && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Key Grammar Refinements
                  </h4>
                  <div className="space-y-3">
                    {((details as any).common_mistakes as any[]).map((m, i) => (
                      <div key={i} className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs">
                        <div className="flex items-center gap-2 mb-1 text-rose-300">
                          <span className="font-semibold text-[11px] uppercase text-rose-400">Original:</span>
                          <span>"{m.original}"</span>
                        </div>
                        <div className="flex items-center gap-2 mb-1.5 text-emerald-300">
                          <span className="font-semibold text-[11px] uppercase text-emerald-400">Natural form:</span>
                          <span className="font-medium">"{m.corrected}"</span>
                        </div>
                        <p className="text-[11px] text-slate-400 italic">Rule: {m.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(details as any).practice_exercises && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    Quick Practice Exercises
                  </h4>
                  <div className="space-y-2">
                    {((details as any).practice_exercises as string[]).map((ex, i) => (
                      <div key={i} className="text-xs text-indigo-200 bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/15">
                        {i + 1}. {ex}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Vocabulary Coach Breakdown */}
          {mode === 'vocab_coach' && (
            <>
              {(details as any).original_vs_improved && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Polished Expressions
                  </h4>
                  <div className="space-y-3">
                    {((details as any).original_vs_improved as any[]).map((item, i) => (
                      <div key={i} className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs">
                        <div className="flex items-center gap-2 mb-1 text-slate-400">
                          <span className="font-semibold text-[11px] uppercase text-slate-400">Basic phrasing:</span>
                          <span>"{item.original}"</span>
                        </div>
                        <div className="flex items-center gap-2 mb-1 text-amber-300 font-medium">
                          <span className="font-semibold text-[11px] uppercase text-amber-400">Polished:</span>
                          <span>"{item.improved}"</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-1">Context: {item.context}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(details as any).useful_collocations && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-teal-400" />
                    Useful Collocations & Idioms
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {((details as any).useful_collocations as string[]).map((c, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-medium">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleCopySummary}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Summary'}</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:text-white text-xs font-medium"
            >
              Back to Home
            </button>
            <button
              onClick={onStartNew}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <Repeat className="w-4 h-4" />
              <span>Start Another Call</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import type { SessionListItem, SessionSummaryReport } from '../types';
import { History, X, Trash2, Clock, MessageSquare, ChevronRight } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SessionListItem[];
  onSelectSession: (summary: SessionSummaryReport) => void;
  onClearAll: () => void;
  onDeleteSession: (id: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  onSelectSession,
  onClearAll,
  onDeleteSession
}) => {
  if (!isOpen) return null;

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return 'Recent';
    const d = new Date(isoStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-slide-left">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">Conversation History</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sessions.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <History className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p className="text-sm">No saved sessions yet.</p>
              <p className="text-xs text-slate-400 mt-1">Completed conversations will appear here.</p>
            </div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className="group relative bg-slate-950/70 hover:bg-slate-800/80 p-4 rounded-2xl border border-slate-800/80 transition-all cursor-pointer"
                onClick={() => s.summary && onSelectSession(s.summary)}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {s.mode.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formatDate(s.created_at)}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(s.duration_seconds)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {s.turn_count} turns
                  </span>
                </div>

                {s.summary?.overall_feedback && (
                  <p className="text-xs text-slate-300 line-clamp-2 italic mb-2">
                    "{s.summary.overall_feedback}"
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-indigo-400 font-medium pt-2 border-t border-slate-800/60">
                  <span className="flex items-center gap-1">
                    View report
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(s.id);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                    title="Delete session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {sessions.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/40">
            <button
              onClick={onClearAll}
              className="w-full py-2.5 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All History</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { UserPreferences } from '../types';
import { Settings, X, Shield, Volume2, Gauge, Clock, Check } from 'lucide-react';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSave: (prefs: UserPreferences) => Promise<void>;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSave
}) => {
  const [formData, setFormData] = useState<UserPreferences>(preferences);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between pb-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Settings & Preferences</h3>
              <p className="text-xs text-slate-400">Customize your voice coach experience</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 my-6">
          {/* Speaking Speed */}
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2 mb-2">
              <Gauge className="w-4 h-4 text-indigo-400" />
              AI Speaking Speed
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['slow', 'normal', 'fast'] as const).map((spd) => (
                <button
                  type="button"
                  key={spd}
                  onClick={() => setFormData({ ...formData, speech_speed: spd })}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium capitalize transition-all ${
                    formData.speech_speed === spd
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}
                </button>
              ))}
            </div>
          </div>

          {/* Tone Preference */}
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-teal-400" />
              Communication Tone
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['casual', 'professional', 'academic'] as const).map((tn) => (
                <button
                  type="button"
                  key={tn}
                  onClick={() => setFormData({ ...formData, target_tone: tn })}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium capitalize transition-all ${
                    formData.target_tone === tn
                      ? 'bg-teal-600 border-teal-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {tn}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2 mb-2">
              <Volume2 className="w-4 h-4 text-amber-400" />
              Coach Neural Voice
            </label>
            <select
              value={formData.preferred_voice}
              onChange={(e) => setFormData({ ...formData, preferred_voice: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="en-US-AriaNeural">Aria (US Female - Natural & Friendly)</option>
              <option value="en-US-GuyNeural">Guy (US Male - Warm & Conversational)</option>
              <option value="en-US-JennyNeural">Jenny (US Female - Clear & Encouraging)</option>
              <option value="en-GB-SoniaNeural">Sonia (British Female - Articulate)</option>
              <option value="en-GB-RyanNeural">Ryan (British Male - Engaging)</option>
            </select>
          </div>

          {/* Privacy & Storage */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-200 block">Save Session Transcripts</span>
                <span className="text-[11px] text-slate-400">Keep history so you can review feedback reports later</span>
              </div>
              <input
                type="checkbox"
                checked={formData.store_transcripts}
                onChange={(e) => setFormData({ ...formData, store_transcripts: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-800"
              />
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Privacy Policy:</strong> FluentFlow does not record or store raw audio files on any servers. Speech is processed in memory during the conversation turn.
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 text-xs font-medium hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

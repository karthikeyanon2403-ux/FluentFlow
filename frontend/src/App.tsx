import React, { useState, useEffect, useRef } from 'react';
import type { CoachMode, CallState, MessageTurn, SessionSummaryReport, UserPreferences, SessionListItem } from './types';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { CallView } from './components/CallView';
import { SummaryModal } from './components/SummaryModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { PreferencesModal } from './components/PreferencesModal';
import { apiService } from './services/apiService';
import { voiceService } from './services/voiceService';

export const App: React.FC = () => {
  // Navigation / View State
  const [currentView, setCurrentView] = useState<'dashboard' | 'call'>('dashboard');
  const [selectedMode, setSelectedMode] = useState<CoachMode>('confident_talk');
  
  // Call Session State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [callState, setCallState] = useState<CallState>('idle');
  const [turns, setTurns] = useState<MessageTurn[]>([]);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isStartingCall, setIsStartingCall] = useState(false);

  // Summary & Modals
  const [activeSummary, setActiveSummary] = useState<SessionSummaryReport | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SessionListItem[]>([]);
  const [backendConnected, setBackendConnected] = useState(false);

  // User Preferences
  const [preferences, setPreferences] = useState<UserPreferences>({
    speech_speed: 'normal',
    target_tone: 'casual',
    store_transcripts: true,
    preferred_voice: 'en-US-AriaNeural',
    enable_confidence_analytics: true
  });

  // Call timer reference
  const timerRef = useRef<any>(null);

  // 1. Initial Health & Preferences Load
  useEffect(() => {
    const initApp = async () => {
      try {
        await apiService.getHealth();
        setBackendConnected(true);
      } catch (e) {
        console.warn('Backend not yet reachable:', e);
      }

      try {
        const prefs = await apiService.getPreferences();
        setPreferences(prefs);
      } catch (e) {
        console.warn('Could not load preferences:', e);
      }

      try {
        const history = await apiService.listSessions();
        setSavedSessions(history);
      } catch (e) {
        console.warn('Could not load history:', e);
      }
    };

    initApp();

    voiceService.setVolumeCallback((vol) => {
      setMicVolume(vol);
      // Auto-interrupt if AI is speaking and user starts talking loudly
      if (vol > 35 && callState === 'ai_speaking') {
        handleInterrupt();
      }
    });

    return () => {
      voiceService.cleanup();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // 2. Call Timer Management
  useEffect(() => {
    if (currentView === 'call') {
      timerRef.current = setInterval(() => {
        setDurationSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentView]);

  // 3. Start Call Flow
  const handleStartCall = async () => {
    setIsStartingCall(true);
    setErrorMessage(undefined);

    // Request microphone permission first
    const hasMic = await voiceService.requestMicPermission();
    if (!hasMic) {
      setErrorMessage("Microphone access was denied. Please allow microphone permissions in your browser to talk with your coach.");
      setIsStartingCall(false);
      return;
    }

    try {
      const res = await apiService.startSession(
        selectedMode,
        preferences.speech_speed,
        preferences.target_tone
      );

      setSessionId(res.session_id);
      setDurationSeconds(0);
      setTurns([]);
      setCurrentView('call');
      setCallState('ai_speaking');

      const initialGreetingTurn: MessageTurn = {
        id: 'turn-0',
        role: 'assistant',
        text: res.greeting,
        timestamp: new Date().toLocaleTimeString(),
        audio_base64: res.greeting_audio_base64
      };
      setTurns([initialGreetingTurn]);

      // Play Greeting Audio
      if (res.greeting_audio_base64) {
        await voiceService.playAudio(res.greeting_audio_base64, () => {
          startListeningForUser();
        });
      } else {
        startListeningForUser();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to start voice session');
    } finally {
      setIsStartingCall(false);
    }
  };

  // 4. Start Listening Loop
  const startListeningForUser = () => {
    setCallState('listening');
    setInterimTranscript('');

    voiceService.startListening(
      (interim) => {
        setInterimTranscript(interim);
      },
      (finalTurn) => {
        setInterimTranscript('');
        handleProcessSpeechTurn(finalTurn);
      },
      (err) => {
        setErrorMessage(err);
      }
    );
  };

  // 5. Process User Speech Turn
  const handleProcessSpeechTurn = async (spokenText: string) => {
    if (!sessionId || !spokenText.trim()) return;

    voiceService.stopListening();
    setCallState('ai_thinking');

    const userTurn: MessageTurn = {
      id: `turn-${Date.now()}`,
      role: 'user',
      text: spokenText,
      timestamp: new Date().toLocaleTimeString()
    };
    setTurns((prev) => [...prev, userTurn]);

    try {
      const reply = await apiService.sendTurn(sessionId, spokenText);

      setCallState('ai_speaking');
      const aiTurn: MessageTurn = {
        id: `turn-${Date.now() + 1}`,
        role: 'assistant',
        text: reply.ai_response,
        feedback_snippet: reply.correction_note,
        timestamp: new Date().toLocaleTimeString(),
        audio_base64: reply.ai_audio_base64
      };
      setTurns((prev) => [...prev, aiTurn]);

      if (reply.ai_audio_base64) {
        await voiceService.playAudio(reply.ai_audio_base64, () => {
          startListeningForUser();
        });
      } else {
        startListeningForUser();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not process turn');
      startListeningForUser();
    }
  };

  // 6. User Interruption Handling
  const handleInterrupt = () => {
    voiceService.stopCurrentAudio();
    setCallState('interrupted');
    setTimeout(() => {
      startListeningForUser();
    }, 400);
  };

  // 7. Toggle Mic Mute
  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      startListeningForUser();
    } else {
      setIsMuted(true);
      voiceService.stopListening();
      setCallState('idle');
    }
  };

  // 8. End Call & Generate Summary
  const handleEndCall = async () => {
    voiceService.cleanup();
    if (!sessionId) {
      setCurrentView('dashboard');
      return;
    }

    try {
      const summary = await apiService.endSession(sessionId, durationSeconds);
      setActiveSummary(summary);
      // Refresh history list
      const updatedHistory = await apiService.listSessions();
      setSavedSessions(updatedHistory);
    } catch (err: any) {
      console.error('Failed to generate summary:', err);
    } finally {
      setCurrentView('dashboard');
      setCallState('idle');
    }
  };

  const handleSavePreferences = async (newPrefs: UserPreferences) => {
    const updated = await apiService.updatePreferences(newPrefs);
    setPreferences(updated);
  };

  const handleClearHistory = async () => {
    await apiService.clearAllSessions();
    setSavedSessions([]);
  };

  const handleDeleteSession = async (id: string) => {
    await apiService.deleteSession(id);
    setSavedSessions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenPreferences={() => setIsPreferencesOpen(true)}
        backendConnected={backendConnected}
      />

      <main className="flex-1">
        {currentView === 'dashboard' ? (
          <DashboardView
            selectedMode={selectedMode}
            onSelectMode={setSelectedMode}
            onStartCall={handleStartCall}
            isLoading={isStartingCall}
            speechSpeed={preferences.speech_speed}
            onChangeSpeed={(spd) => {
              const updated = { ...preferences, speech_speed: spd };
              setPreferences(updated);
              apiService.updatePreferences(updated);
            }}
            targetTone={preferences.target_tone}
            onChangeTone={(tn) => {
              const updated = { ...preferences, target_tone: tn };
              setPreferences(updated);
              apiService.updatePreferences(updated);
            }}
          />
        ) : (
          <CallView
            mode={selectedMode}
            callState={callState}
            durationSeconds={durationSeconds}
            turns={turns}
            interimTranscript={interimTranscript}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onInterrupt={handleInterrupt}
            onEndCall={handleEndCall}
            onSendTextTurn={handleProcessSpeechTurn}
            errorMessage={errorMessage}
            micVolume={micVolume}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      <SummaryModal
        summary={activeSummary}
        onClose={() => setActiveSummary(null)}
        onStartNew={() => {
          setActiveSummary(null);
          handleStartCall();
        }}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={savedSessions}
        onSelectSession={(summary) => {
          setIsHistoryOpen(false);
          setActiveSummary(summary);
        }}
        onClearAll={handleClearHistory}
        onDeleteSession={handleDeleteSession}
      />

      <PreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        preferences={preferences}
        onSave={handleSavePreferences}
      />
    </div>
  );
};

export default App;

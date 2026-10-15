import type { CoachMode, SessionSummaryReport, UserPreferences, SessionListItem } from '../types';

const API_BASE = '/api';

export const apiService = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Backend health check failed');
    return res.json();
  },

  async startSession(mode: CoachMode, speechSpeed = 'normal', targetTone = 'casual') {
    const res = await fetch(`${API_BASE}/sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode,
        speech_speed: speechSpeed,
        target_tone: targetTone
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to start session');
    }
    return res.json();
  },

  async sendTurn(sessionId: string, text: string) {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to process speech turn');
    }
    return res.json();
  },

  async endSession(sessionId: string, durationSeconds: number): Promise<SessionSummaryReport> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration_seconds: durationSeconds })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to end session');
    }
    return res.json();
  },

  async getSessionSummary(sessionId: string): Promise<SessionSummaryReport> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/summary`);
    if (!res.ok) throw new Error('Failed to fetch summary');
    return res.json();
  },

  async listSessions(): Promise<SessionListItem[]> {
    const res = await fetch(`${API_BASE}/sessions`);
    if (!res.ok) return [];
    return res.json();
  },

  async deleteSession(sessionId: string) {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete session');
    return res.json();
  },

  async clearAllSessions() {
    const res = await fetch(`${API_BASE}/sessions`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear sessions');
    return res.json();
  },

  async getPreferences(): Promise<UserPreferences> {
    const res = await fetch(`${API_BASE}/preferences`);
    if (!res.ok) throw new Error('Failed to fetch preferences');
    return res.json();
  },

  async updatePreferences(prefs: UserPreferences): Promise<UserPreferences> {
    const res = await fetch(`${API_BASE}/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs)
    });
    if (!res.ok) throw new Error('Failed to update preferences');
    return res.json();
  }
};

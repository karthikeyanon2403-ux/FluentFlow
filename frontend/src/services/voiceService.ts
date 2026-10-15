// Voice Service: Microphone, Web Audio analyser, SpeechRecognition, and audio playback

// Web Speech API type definitions for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export class VoiceService {
  private recognition: any = null;
  private currentAudio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private isListening: boolean = false;
  private volumeCallback: ((volume: number) => void) | null = null;
  private animFrameId: number | null = null;

  constructor() {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
    }
  }

  public isSpeechRecognitionSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public async requestMicPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.micStream = stream;
      this.initAudioAnalyser(stream);
      return true;
    } catch (err) {
      console.error('[VoiceService] Mic permission error:', err);
      return false;
    }
  }

  private initAudioAnalyser(stream: MediaStream) {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);
      this.startVolumeMonitoring();
    } catch (e) {
      console.warn('[VoiceService] AudioContext analyser initialization warning:', e);
    }
  }

  public setVolumeCallback(cb: (vol: number) => void) {
    this.volumeCallback = cb;
  }

  private startVolumeMonitoring() {
    if (!this.analyser) return;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const updateVolume = () => {
      if (this.analyser && this.isListening) {
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        if (this.volumeCallback) {
          this.volumeCallback(normalized);
        }
      } else if (this.volumeCallback) {
        this.volumeCallback(0);
      }
      this.animFrameId = requestAnimationFrame(updateVolume);
    };

    updateVolume();
  }

  public startListening(
    onInterim: (text: string) => void,
    onFinalTurn: (text: string) => void,
    onError: (err: string) => void
  ) {
    if (!this.recognition) {
      onError("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge, or use text chat.");
      return;
    }

    if (this.isListening) return;

    let silenceTimer: any = null;
    let accumulatedText = '';

    this.recognition.onstart = () => {
      this.isListening = true;
    };

    this.recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          accumulatedText += ' ' + transcript;
        } else {
          interim += transcript;
        }
      }

      const activeText = (accumulatedText + ' ' + interim).trim();
      if (activeText) {
        onInterim(activeText);

        // Turn completion: if user pauses for 1.8 seconds, complete the speech turn
        if (silenceTimer) clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
          if (activeText.length > 0) {
            onFinalTurn(activeText);
            accumulatedText = '';
          }
        }, 1800);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn('[VoiceService] Recognition event error:', event.error);
      if (event.error !== 'no-speech') {
        onError(`Audio recognition note: ${event.error}`);
      }
    };

    this.recognition.onend = () => {
      // Auto-restart if we should still be listening
      if (this.isListening) {
        try {
          this.recognition.start();
        } catch (e) {
          // Ignore if already active
        }
      }
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (err: any) {
      console.error('[VoiceService] Recognition start error:', err);
    }
  }

  public stopListening() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }

  public playAudio(base64Mp3: string, onEnded?: () => void): Promise<void> {
    return new Promise((resolve) => {
      this.stopCurrentAudio();

      if (!base64Mp3) {
        if (onEnded) onEnded();
        resolve();
        return;
      }

      try {
        const audio = new Audio(`data:audio/mp3;base64,${base64Mp3}`);
        this.currentAudio = audio;

        audio.onended = () => {
          this.currentAudio = null;
          if (onEnded) onEnded();
          resolve();
        };

        audio.onerror = (e) => {
          console.warn('[VoiceService] Audio playback error:', e);
          this.currentAudio = null;
          if (onEnded) onEnded();
          resolve();
        };

        audio.play().catch((err) => {
          console.warn('[VoiceService] Autoplay policy prevented playback:', err);
          if (onEnded) onEnded();
          resolve();
        });
      } catch (err) {
        console.error('[VoiceService] Audio creation failed:', err);
        if (onEnded) onEnded();
        resolve();
      }
    });
  }

  public stopCurrentAudio() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
      this.currentAudio = null;
    }
  }

  public cleanup() {
    this.stopListening();
    this.stopCurrentAudio();
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

export const voiceService = new VoiceService();

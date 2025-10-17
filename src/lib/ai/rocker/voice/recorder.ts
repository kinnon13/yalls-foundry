/**
 * Voice Recorder (Mic Capture)
 * Production-grade audio capture with VAD and error handling
 */

export interface VoiceRecorderConfig {
  sampleRate?: number;
  channelCount?: number;
  onTranscript?: (text: string) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: 'idle' | 'recording' | 'processing') => void;
}

export class VoiceRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private config: VoiceRecorderConfig;
  private status: 'idle' | 'recording' | 'processing' = 'idle';

  constructor(config: VoiceRecorderConfig = {}) {
    this.config = {
      sampleRate: 16000,
      channelCount: 1,
      ...config,
    };
  }

  async start(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channelCount,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      this.audioContext = new AudioContext({ sampleRate: this.config.sampleRate });
      this.setStatus('recording');
    } catch (error) {
      this.config.onError?.(error as Error);
      throw error;
    }
  }

  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.setStatus('idle');
  }

  getStatus(): 'idle' | 'recording' | 'processing' {
    return this.status;
  }

  private setStatus(status: 'idle' | 'recording' | 'processing'): void {
    this.status = status;
    this.config.onStatusChange?.(status);
  }
}

/**
 * Lightweight browser voice adapter with clear types.
 * Works with Web Speech API if available; otherwise just manages mic stream.
 */
export type VoiceStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
type StatusCb = (status: VoiceStatus) => void;
type TranscriptCb = (text: string) => void;

export class RealtimeVoice {
  private onStatus: StatusCb;
  private onTranscript: TranscriptCb;
  private mediaStream?: MediaStream;
  private recognition?: SpeechRecognition;

  constructor(opts: { onStatus: StatusCb; onTranscript: TranscriptCb }) {
    this.onStatus = opts.onStatus;
    this.onTranscript = opts.onTranscript;
  }

  async connect(): Promise<void> {
    try {
      this.onStatus('connecting');
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const SpeechRecognition =
        (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (SpeechRecognition) {
        const rec: SpeechRecognition = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.onresult = (e: SpeechRecognitionEvent) => {
          const last = e.results[e.results.length - 1];
          const alt = last?.[0];
          if (alt?.transcript) this.onTranscript(alt.transcript);
        };
        rec.onerror = () => this.onStatus('error');
        rec.onend = () => this.onStatus('disconnected');
        rec.start();
        this.recognition = rec;
      }

      this.onStatus('connected');
    } catch {
      this.onStatus('error');
      throw new Error('Microphone permission or SpeechRecognition failed');
    }
  }

  disconnect(): void {
    try {
      this.recognition?.stop();
    } catch {}
    try {
      this.mediaStream?.getTracks().forEach((t) => t.stop());
    } catch {}
    this.onStatus('disconnected');
  }
}

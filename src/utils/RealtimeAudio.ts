export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.audioContext = new AudioContext({
        sampleRate: 24000,
      });
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };
      
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  stop() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const encodeAudioForAPI = (float32Array: Float32Array): string => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  const uint8Array = new Uint8Array(int16Array.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
};

const createWavFromPCM = (pcmData: Uint8Array): Uint8Array => {
  const int16Data = new Int16Array(pcmData.length / 2);
  for (let i = 0; i < pcmData.length; i += 2) {
    int16Data[i / 2] = (pcmData[i + 1] << 8) | pcmData[i];
  }
  
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);
  
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + int16Data.byteLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, int16Data.byteLength, true);

  const wavArray = new Uint8Array(wavHeader.byteLength + int16Data.byteLength);
  wavArray.set(new Uint8Array(wavHeader), 0);
  wavArray.set(new Uint8Array(int16Data.buffer), wavHeader.byteLength);
  
  return wavArray;
};

class AudioQueue {
  private queue: Uint8Array[] = [];
  private isPlaying = false;
  private audioContext: AudioContext;
  private currentSource: AudioBufferSourceNode | null = null;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  async addToQueue(audioData: Uint8Array) {
    this.queue.push(audioData);
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  stopAll() {
    this.queue = [];
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (e) {
        // Source may already be stopped
      }
      this.currentSource = null;
    }
    this.isPlaying = false;
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.currentSource = null;
      return;
    }

    this.isPlaying = true;
    const audioData = this.queue.shift()!;

    try {
      const wavData = createWavFromPCM(audioData);
      const arrayBuffer = new ArrayBuffer(wavData.buffer.byteLength);
      new Uint8Array(arrayBuffer).set(new Uint8Array(wavData.buffer));
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      this.currentSource = source;
      
      source.onended = () => {
        this.currentSource = null;
        this.playNext();
      };
      source.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
      this.currentSource = null;
      this.playNext();
    }
  }
}

let audioQueueInstance: AudioQueue | null = null;

const playAudioData = async (audioContext: AudioContext, audioData: Uint8Array) => {
  if (!audioQueueInstance) {
    audioQueueInstance = new AudioQueue(audioContext);
  }
  await audioQueueInstance.addToQueue(audioData);
};

// Singleton to prevent multiple voice instances
let globalVoiceInstance: RealtimeVoice | null = null;

export class RealtimeVoice {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private recorder: AudioRecorder | null = null;
  private onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected') => void;
  private onTranscript?: (text: string, isFinal: boolean) => void;
  private onCommand?: (cmd: { 
    type: 'navigate' | 'click_element' | 'fill_field' | 'create_post'; 
    path?: string;
    element_name?: string;
    field_name?: string;
    value?: string;
    content?: string;
  }) => void;
  private lastTranscript: string = '';
  private instanceId: string;

  constructor(
    onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected') => void,
    onTranscript?: (text: string, isFinal: boolean) => void,
    onCommand?: (cmd: { 
      type: 'navigate' | 'click_element' | 'fill_field' | 'create_post';
      path?: string;
      element_name?: string;
      field_name?: string;
      value?: string;
      content?: string;
    }) => void
  ) {
    this.instanceId = Math.random().toString(36).substring(7);
    console.log(`[Rocker Voice ${this.instanceId}] Creating new instance`);
    
    // If there's already a global instance, disconnect it first
    if (globalVoiceInstance && globalVoiceInstance !== this) {
      console.log(`[Rocker Voice ${this.instanceId}] Disconnecting old instance`);
      globalVoiceInstance.disconnect();
    }
    
    this.onStatusChange = onStatusChange;
    this.onTranscript = onTranscript;
    this.onCommand = onCommand;
    globalVoiceInstance = this;
  }

  private detectNavigationPath(transcript: string): string | 'back' | null {
    const t = transcript.toLowerCase();
    console.log(`[Rocker Voice ${this.instanceId}] Detecting navigation from: "${t}"`);

    // Basic wake word stripping
    const cleaned = t.replace(/^\s*(hey\s+rocker|ok\s+rocker|rocker)[,\s:]*/i, '').trim();
    console.log(`[Rocker Voice ${this.instanceId}] Cleaned transcript: "${cleaned}"`);

    // Go back
    if (/(go|navigate|take) back|previous page|backwards/.test(cleaned)) {
      console.log(`[Rocker Voice ${this.instanceId}] ✓ Matched: back`);
      return 'back';
    }

    // Dashboard
    if (/(dashboard|home\s*dashboard|open my dashboard)/.test(cleaned)) {
      console.log(`[Rocker Voice ${this.instanceId}] ✓ Matched: /dashboard`);
      return '/dashboard';
    }

    // Home
    if (/(home|homepage|go home)$/.test(cleaned)) {
      console.log(`[Rocker Voice ${this.instanceId}] ✓ Matched: / (home)`);
      return '/';
    }

    // Horses - expanded patterns
    if (/(horses?|open horses?|browse horses?|horse page|horse list|find horses?)/.test(cleaned)) {
      console.log(`[Rocker Voice ${this.instanceId}] ✓ Matched: /horses`);
      return '/horses';
    }

    // Marketplace / Shop - expanded patterns
    if (/(marketplace|market place|shop|store|browse marketplace|open marketplace|open shop)/.test(cleaned)) {
      console.log(`[Rocker Voice ${this.instanceId}] ✓ Matched: /marketplace`);
      return '/marketplace';
    }

    // Events
    if (/(events?|open events?|browse events?|event page)/.test(cleaned)) {
      console.log(`[Rocker Voice ${this.instanceId}] ✓ Matched: /events`);
      return '/events';
    }

    // Profile
    if (/(my profile|profile page|open profile|view profile)/.test(cleaned)) {
      console.log(`[Rocker Voice ${this.instanceId}] ✓ Matched: /profile`);
      return '/profile';
    }

    // Saved posts
    if (/(saved posts?|bookmarks?|open saved|my saved)/.test(cleaned)) {
      console.log(`[Rocker Voice ${this.instanceId}] ✓ Matched: /posts/saved`);
      return '/posts/saved';
    }

    // Business hub -> route to dashboard businesses tab
    if (/(business|business hub|my businesses|company)/.test(cleaned)) {
      console.log(`[Rocker Voice ${this.instanceId}] ✓ Matched: /dashboard?tab=businesses`);
      return '/dashboard?tab=businesses';
    }

    // Admin control room
    if (/(control room|admin|admin panel)/.test(cleaned)) {
      console.log(`[Rocker Voice ${this.instanceId}] ✓ Matched: /dashboard?tab=control`);
      return '/dashboard?tab=control';
    }

    // Search requests → open search page (we let the user refine there)
    if (/^search\b|find\b/.test(cleaned)) {
      console.log(`[Rocker Voice ${this.instanceId}] ✓ Matched: /search`);
      return '/search';
    }

    console.log(`[Rocker Voice ${this.instanceId}] ✗ No navigation match found`);
    return null;
  }
  stopPlayback() {
    if (audioQueueInstance) {
      audioQueueInstance.stopAll();
    }
    // Send cancel response to API
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'response.cancel'
      }));
    }
  }

  async connect(ephemeralToken: string) {
    console.log(`[Rocker Voice ${this.instanceId}] Connecting...`);
    this.onStatusChange?.('connecting');
    this.audioContext = new AudioContext({ sampleRate: 24000 });

    const model = "gpt-4o-realtime-preview-2024-12-17";
    const wsUrl = `wss://api.openai.com/v1/realtime?model=${model}`;
    
    this.ws = new WebSocket(wsUrl, [
      'realtime',
      `openai-insecure-api-key.${ephemeralToken}`,
      'openai-beta.realtime-v1'
    ]);

    this.ws.onopen = () => {
      console.log(`[Rocker Voice ${this.instanceId}] WebSocket connected`);
      this.onStatusChange?.('connected');
      
      // Send session configuration after connection
      this.ws!.send(JSON.stringify({
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          voice: 'alloy',
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 1000
          },
          temperature: 0.8
        }
      }));

      this.startRecording();
    };

    this.ws.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      
      // Handle tool calls from OpenAI
      if (message.type === 'response.function_call_arguments.done') {
        console.log(`[Rocker Voice ${this.instanceId}] Tool call:`, message.name, message.arguments);
        
        try {
          const args = JSON.parse(message.arguments);
          
          // Handle navigation
          if (message.name === 'navigate') {
            console.log(`[Rocker Voice ${this.instanceId}] 🔥 NAVIGATE TOOL CALLED:`, args.path);
            this.stopPlayback();
            this.onCommand?.({ type: 'navigate', path: args.path });
          }
          
          // Handle click element
          else if (message.name === 'click_element') {
            console.log(`[Rocker Voice ${this.instanceId}] 🔥 CLICK TOOL CALLED:`, args.element_name);
            // Emit as command to be handled by context
            this.onCommand?.({ type: 'click_element' as any, element_name: args.element_name } as any);
          }
          
          // Handle fill field
          else if (message.name === 'fill_field') {
            console.log(`[Rocker Voice ${this.instanceId}] 🔥 FILL TOOL CALLED:`, args);
            this.onCommand?.({ type: 'fill_field' as any, ...args } as any);
          }
          
          // Handle create post
          else if (message.name === 'create_post') {
            console.log(`[Rocker Voice ${this.instanceId}] 🔥 CREATE_POST TOOL CALLED:`, args);
            this.onCommand?.({ type: 'create_post' as any, content: args.content } as any);
          }
        } catch (err) {
          console.error(`[Rocker Voice ${this.instanceId}] Error parsing tool arguments:`, err);
        }
      }
      
      if (message.type === 'response.audio.delta') {
        const binaryString = atob(message.delta);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        await playAudioData(this.audioContext!, bytes);
      } else if (message.type === 'response.audio_transcript.delta') {
        this.onTranscript?.(message.delta, false);
      } else if (message.type === 'response.audio_transcript.done') {
        this.onTranscript?.(message.transcript, true);
      } else if (message.type === 'input_audio_buffer.speech_started') {
        console.log(`[Rocker Voice ${this.instanceId}] User started speaking`);
      } else if (message.type === 'input_audio_buffer.speech_stopped') {
        console.log(`[Rocker Voice ${this.instanceId}] User stopped speaking`);
      } else if (message.type === 'conversation.item.input_audio_transcription.completed') {
        // Check for voice commands like navigation
        const transcript = message.transcript?.toLowerCase() || '';
        this.lastTranscript = transcript;
        console.log(`[Rocker Voice ${this.instanceId}] Transcript:`, transcript);
        
        if (transcript.includes('stop')) {
          console.log(`[Rocker Voice ${this.instanceId}] Stop command detected`);
          this.stopPlayback();
        }
        
        // Fallback: Check for navigation patterns if no tool was called
        const path = this.detectNavigationPath(transcript);
        if (path) {
          console.log(`[Rocker Voice ${this.instanceId}] 🔥 NAVIGATION PATTERN DETECTED:`, path);
          this.stopPlayback();
          this.onCommand?.({ type: 'navigate', path });
        }
      }
    };

    this.ws.onerror = (error) => {
      console.error(`[Rocker Voice ${this.instanceId}] WebSocket error:`, error);
    };

    this.ws.onclose = () => {
      console.log(`[Rocker Voice ${this.instanceId}] WebSocket closed`);
      this.onStatusChange?.('disconnected');
      this.cleanup();
    };
  }

  private async startRecording() {
    try {
      this.recorder = new AudioRecorder((audioData) => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          const encoded = encodeAudioForAPI(audioData);
          this.ws.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: encoded
          }));
        }
      });
      await this.recorder.start();
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }

  disconnect() {
    console.log(`[Rocker Voice ${this.instanceId}] Disconnecting...`);
    this.cleanup();
    this.ws?.close();
    if (globalVoiceInstance === this) {
      globalVoiceInstance = null;
    }
  }

  private cleanup() {
    console.log(`[Rocker Voice ${this.instanceId}] Cleaning up...`);
    this.recorder?.stop();
    this.recorder = null;
    this.audioContext?.close();
    this.audioContext = null;
    audioQueueInstance = null;
  }
}

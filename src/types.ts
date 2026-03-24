export type Language = 'en' | 'fr' | 'de';

export type ProviderId = 'openai' | 'openai-mini';

export type Voice = 'marin' | 'cedar' | 'verse' | 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer';

export interface VoiceConfig {
  voice: Voice;
  temperature: number;   // 0.0 - 1.5
  empathy: number;       // 0 - 100
  tone: number;          // 0 (formal) - 100 (casual)
  verbosity: number;     // 0 (concise) - 100 (verbose)
}

export interface TranscriptEntry {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export type AppStep = 'select' | 'configure' | 'connecting' | 'active';

export interface UsageData {
  audioInTokens: number;
  audioOutTokens: number;
  textInTokens: number;
  textOutTokens: number;
}

export interface RealtimeHandler {
  connect(instructions: string, voiceConfig: VoiceConfig): Promise<void>;
  disconnect(): void;
  mute(muted: boolean): void;
}

export interface RealtimeCallbacks {
  onTranscript: (role: 'user' | 'assistant', text: string, isFinal: boolean) => void;
  onUsageUpdate: (usage: UsageData) => void;
  onAiSpeaking: (speaking: boolean) => void;
  onError: (msg: string) => void;
  onConnected: () => void;
  onDisconnected: () => void;
}

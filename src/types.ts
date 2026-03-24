export type Language = 'en' | 'fr' | 'de';

export type ProviderId = 'openai' | 'openai-mini';

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
  connect(instructions: string): Promise<void>;
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

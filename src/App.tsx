import { useState, useRef, useCallback, useEffect } from 'react';
import { useI18n } from './i18n';
import type { ProviderId, AppStep, RealtimeHandler, RealtimeCallbacks, UsageData, VoiceConfig } from './types';
import { Header } from './components/Header';
import { ProviderCard } from './components/ProviderCard';
import { ConfigPanel } from './components/ConfigPanel';
import { Conversation } from './components/Conversation';
import { createOpenAIProvider } from './providers/openai';
import { ArrowLeft, AlertCircle } from 'lucide-react';

const PROVIDERS: ProviderId[] = ['openai', 'openai-mini'];

const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  voice: 'marin',
  temperature: 0.8,
  empathy: 50,
  tone: 50,
  verbosity: 30,
};

/**
 * Build system instructions from user text + slider values.
 * The sliders inject behavioral directives into the prompt.
 */
function buildInstructions(userText: string, vc: VoiceConfig): string {
  const parts: string[] = [];

  if (userText.trim()) {
    parts.push(userText.trim());
  } else {
    parts.push('You are a helpful assistant.');
  }

  // Empathy
  if (vc.empathy < 20) {
    parts.push('Be direct and matter-of-fact. Avoid emotional language.');
  } else if (vc.empathy > 80) {
    parts.push('Be very empathetic and warm. Show genuine care and emotional understanding. Acknowledge feelings before responding.');
  } else if (vc.empathy > 60) {
    parts.push('Be empathetic and considerate in your responses.');
  }

  // Tone
  if (vc.tone < 20) {
    parts.push('Use a formal, professional tone. Avoid slang and colloquialisms.');
  } else if (vc.tone > 80) {
    parts.push('Be very casual and friendly. Use conversational language, contractions, and a relaxed tone.');
  } else if (vc.tone > 60) {
    parts.push('Use a friendly, conversational tone.');
  }

  // Verbosity
  if (vc.verbosity < 20) {
    parts.push('Be extremely concise. Use as few words as possible. One or two sentences max.');
  } else if (vc.verbosity < 40) {
    parts.push('Keep responses short and to the point.');
  } else if (vc.verbosity > 80) {
    parts.push('Give detailed, thorough responses. Elaborate and explain your reasoning.');
  } else if (vc.verbosity > 60) {
    parts.push('Provide moderately detailed responses with some explanation.');
  }

  return parts.join('\n\n');
}

export default function App() {
  const { t } = useI18n();
  const [step, setStep] = useState<AppStep>('select');
  const [provider, setProvider] = useState<ProviderId | null>(null);
  const [instructions, setInstructions] = useState('');
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>(DEFAULT_VOICE_CONFIG);
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlerRef = useRef<RealtimeHandler | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const createCallbacks = useCallback((): RealtimeCallbacks => ({
    onTranscript() {},
    onUsageUpdate(u) { setUsage({ ...u }); },
    onAiSpeaking(speaking) { setAiSpeaking(speaking); },
    onError(msg) {
      setError(msg);
      stopSession();
    },
    onConnected() {
      setStep('active');
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    },
    onDisconnected() { stopSession(); },
  }), []);

  function stopSession() {
    handlerRef.current?.disconnect();
    handlerRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    setStep('select');
    setElapsed(0);
    setUsage(null);
    setAiSpeaking(false);
    setMuted(false);
  }

  async function startSession() {
    if (!provider) return;
    setError(null);
    setStep('connecting');

    const callbacks = createCallbacks();
    const handler = createOpenAIProvider(
      callbacks,
      provider === 'openai-mini' ? 'gpt-realtime-mini' : undefined,
    );
    handlerRef.current = handler;

    const finalInstructions = buildInstructions(instructions, voiceConfig);

    try {
      await handler.connect(finalInstructions, voiceConfig);
    } catch (err: any) {
      setError(err.message);
      setStep('configure');
    }
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    handlerRef.current?.mute(next);
  }

  useEffect(() => {
    return () => {
      handlerRef.current?.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-surface-secondary">
      <Header onLogoClick={stopSession} />

      <main className="max-w-4xl mx-auto px-6 pb-12">
        {error && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600 text-xs font-medium"
            >
              {t('tryAgain')}
            </button>
          </div>
        )}

        {step === 'select' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold mb-6 text-content-primary">{t('selectModel')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PROVIDERS.map((id) => (
                <ProviderCard
                  key={id}
                  id={id}
                  onClick={() => {
                    setProvider(id);
                    setStep('configure');
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {step === 'configure' && provider && (
          <div className="max-w-xl mx-auto">
            <button
              onClick={() => { setStep('select'); setProvider(null); }}
              className="flex items-center gap-2 text-sm text-content-secondary hover:text-content-primary mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('back')}
            </button>

            <ConfigPanel
              instructions={instructions}
              onInstructionsChange={setInstructions}
              voiceConfig={voiceConfig}
              onVoiceConfigChange={setVoiceConfig}
              onStart={startSession}
            />
          </div>
        )}

        {(step === 'connecting' || step === 'active') && provider && (
          <Conversation
            provider={provider}
            elapsedSeconds={elapsed}
            usage={usage}
            aiSpeaking={aiSpeaking}
            muted={muted}
            onMute={toggleMute}
            onEnd={stopSession}
            status={step}
          />
        )}
      </main>
    </div>
  );
}

import { useState, useRef, useCallback, useEffect } from 'react';
import { useI18n } from './i18n';
import type { ProviderId, AppStep, RealtimeHandler, RealtimeCallbacks, UsageData } from './types';
import { Header } from './components/Header';
import { ProviderCard } from './components/ProviderCard';
import { Conversation } from './components/Conversation';
import { createOpenAIProvider } from './providers/openai';
import { ArrowLeft, Play, AlertCircle } from 'lucide-react';

const PROVIDERS: ProviderId[] = ['openai', 'openai-mini'];

export default function App() {
  const { t } = useI18n();
  const [step, setStep] = useState<AppStep>('select');
  const [provider, setProvider] = useState<ProviderId | null>(null);
  const [instructions, setInstructions] = useState('');
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlerRef = useRef<RealtimeHandler | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const createCallbacks = useCallback((): RealtimeCallbacks => ({
    onTranscript() {},
    onUsageUpdate(u) {
      setUsage({ ...u });
    },
    onAiSpeaking(speaking) {
      setAiSpeaking(speaking);
    },
    onError(msg) {
      setError(msg);
      stopSession();
    },
    onConnected() {
      setStep('active');
      timerRef.current = setInterval(() => {
        setElapsed((s) => s + 1);
      }, 1000);
    },
    onDisconnected() {
      stopSession();
    },
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

    try {
      await handler.connect(instructions || 'You are a helpful assistant. Be concise and friendly.');
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

            <div className="bg-white rounded-2xl border border-border p-6 shadow-card">
              <label className="block text-sm font-medium text-content-primary mb-2">
                {t('personality')}
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder={t('personalityPlaceholder')}
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface-secondary text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none transition-all"
              />

              <button
                onClick={startSession}
                className="mt-5 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-medium text-sm transition-all shadow-subtle hover:shadow-card"
              >
                <Play className="w-4 h-4" />
                {t('startConversation')}
              </button>
            </div>
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

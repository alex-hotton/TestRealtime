import { useI18n } from '../i18n';
import type { ProviderId, UsageData } from '../types';
import { MicOff, Mic, Square, TrendingUp } from 'lucide-react';

/**
 * Pricing per 1M tokens:
 *   gpt-realtime-1.5:  audio in $32, out $64, text in $4, out $16
 *   gpt-realtime-mini: audio in $0.60, out $2.40, text in $0.60, out $2.40
 *
 * Audio token rates: user 1tk/100ms (10/sec), AI 1tk/50ms (20/sec)
 * Multi-turn: full history re-sent each turn (cached tokens ~10x cheaper)
 */

const RATES: Record<ProviderId, { audioIn: number; audioOut: number; textIn: number; textOut: number }> = {
  openai: {
    audioIn: 32 / 1_000_000,
    audioOut: 64 / 1_000_000,
    textIn: 4 / 1_000_000,
    textOut: 16 / 1_000_000,
  },
  'openai-mini': {
    audioIn: 0.60 / 1_000_000,
    audioOut: 2.40 / 1_000_000,
    textIn: 0.60 / 1_000_000,
    textOut: 2.40 / 1_000_000,
  },
};

function computeCost(provider: ProviderId, usage: UsageData | null): number {
  const r = RATES[provider];
  if (r && usage) {
    return (
      usage.audioInTokens * r.audioIn +
      usage.audioOutTokens * r.audioOut +
      usage.textInTokens * r.textIn +
      usage.textOutTokens * r.textOut
    );
  }
  return 0;
}

const AGENT_LABEL: Record<ProviderId, string> = {
  openai: 'Nova',
  'openai-mini': 'Spark',
};

interface Props {
  provider: ProviderId;
  elapsedSeconds: number;
  usage: UsageData | null;
  aiSpeaking: boolean;
  muted: boolean;
  onMute: () => void;
  onEnd: () => void;
  status: 'connecting' | 'active';
}

export function Conversation({ provider, elapsedSeconds, usage, aiSpeaking, muted, onMute, onEnd, status }: Props) {
  const { t } = useI18n();

  const cost = computeCost(provider, usage);
  const costPerSec = elapsedSeconds > 0 ? cost / elapsedSeconds : 0;
  const proj5min = costPerSec * 300;
  const proj1hr = costPerSec * 3600;

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const fmtCost = (c: number) => {
    if (c < 0.001) return '$' + c.toFixed(5);
    if (c < 0.01) return '$' + c.toFixed(4);
    if (c < 1) return '$' + c.toFixed(3);
    return '$' + c.toFixed(2);
  };

  const isConnecting = status === 'connecting';

  return (
    <div className="flex flex-col items-center">
      {/* Model badge */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border shadow-subtle">
          <div className={`w-2 h-2 rounded-full ${isConnecting ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
          <span className="text-sm font-medium text-content-primary">{AGENT_LABEL[provider]}</span>
          <span className="text-xs text-content-tertiary font-mono">{fmt(elapsedSeconds)}</span>
        </div>
      </div>

      {/* Orb */}
      <div className="relative w-52 h-52 mb-12">
        {/* Outer glow rings */}
        <div className={`absolute inset-0 rounded-full transition-all duration-700 ${
          aiSpeaking
            ? 'scale-[1.6] opacity-[0.08]'
            : isConnecting ? 'scale-[1.2] opacity-[0.05]' : 'scale-[1.3] opacity-[0.06]'
        }`}
          style={{ background: 'radial-gradient(circle, #5E6AD2, transparent 70%)' }}
        />
        <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
          aiSpeaking
            ? 'scale-[1.35] opacity-[0.12]'
            : isConnecting ? 'scale-[1.1] opacity-[0.08]' : 'scale-[1.15] opacity-[0.1]'
        }`}
          style={{ background: 'radial-gradient(circle, #5E6AD2, transparent 70%)' }}
        />

        {/* Main orb */}
        <div className={`absolute inset-0 rounded-full orb-shape transition-all duration-500 ${
          aiSpeaking ? 'orb-speaking' : isConnecting ? 'orb-connecting' : 'orb-idle'
        }`}>
          {/* Inner gradient layers */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className="absolute inset-0 orb-gradient" />
            <div className={`absolute inset-0 orb-shimmer transition-opacity duration-500 ${
              aiSpeaking ? 'opacity-60' : 'opacity-30'
            }`} />
          </div>

          {/* Glass highlight */}
          <div className="absolute top-3 left-6 right-6 h-1/3 rounded-full bg-gradient-to-b from-white/20 to-transparent" />
        </div>

        {/* Ripple rings when speaking */}
        {aiSpeaking && (
          <>
            <div className="absolute inset-0 rounded-full border border-accent/20 animate-ripple" />
            <div className="absolute inset-0 rounded-full border border-accent/15 animate-ripple" style={{ animationDelay: '0.6s' }} />
            <div className="absolute inset-0 rounded-full border border-accent/10 animate-ripple" style={{ animationDelay: '1.2s' }} />
          </>
        )}
      </div>

      {/* Status */}
      <p className="text-sm text-content-tertiary mb-10">
        {isConnecting ? t('connecting') : aiSpeaking ? t('speaking') : t('listening')}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-6 mb-10">
        <button
          onClick={onMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            muted
              ? 'bg-red-500 text-white shadow-lg'
              : 'bg-white border border-border text-content-secondary hover:bg-surface-tertiary shadow-subtle'
          }`}
          title={muted ? t('unmute') : t('mute')}
        >
          {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          onClick={onEnd}
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg hover:shadow-xl active:scale-95"
          title={t('endConversation')}
        >
          <Square className="w-5 h-5 fill-current" />
        </button>
      </div>

      {/* Cost panel */}
      <div className="w-full max-w-sm bg-white rounded-2xl border border-border shadow-subtle p-5">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] text-content-tertiary uppercase tracking-wider">{t('cost')}</span>
            <div className="text-2xl font-semibold font-mono text-content-primary mt-0.5">{fmtCost(cost)}</div>
            {usage && (
              <div className="text-[10px] text-content-tertiary font-mono mt-1 leading-relaxed">
                <span className="inline-block mr-3">audio in {usage.audioInTokens} tk</span>
                <span className="inline-block mr-3">out {usage.audioOutTokens} tk</span>
                <span className="inline-block">text {usage.textInTokens + usage.textOutTokens} tk</span>
              </div>
            )}
          </div>
          {elapsedSeconds > 5 && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-[10px] text-content-tertiary mb-1">
                <TrendingUp className="w-3 h-3" />
                {t('projections')}
              </div>
              <div className="text-xs font-mono text-content-secondary space-y-0.5">
                <div>5 min <span className="text-content-primary font-medium">{fmtCost(proj5min)}</span></div>
                <div>1 hr <span className="text-content-primary font-medium">{fmtCost(proj1hr)}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

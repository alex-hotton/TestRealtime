import type { ProviderId } from '../types';
import { useI18n } from '../i18n';
import { Sparkles, Bolt } from 'lucide-react';

interface Props {
  id: ProviderId;
  onClick: () => void;
}

const config: Record<ProviderId, {
  agent: string;
  subtitle: string;
  model: string;
  costLabel: string;
  icon: typeof Sparkles;
  gradient: string;
  glow: string;
}> = {
  openai: {
    agent: 'Nova',
    subtitle: 'OpenAI Realtime 1.5',
    model: 'gpt-realtime-1.5',
    costLabel: '~$0.10/min',
    icon: Sparkles,
    gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
    glow: 'rgba(20, 184, 166, 0.25)',
  },
  'openai-mini': {
    agent: 'Spark',
    subtitle: 'OpenAI Realtime Mini',
    model: 'gpt-realtime-mini',
    costLabel: '~$0.002/min',
    icon: Bolt,
    gradient: 'from-violet-400 via-purple-500 to-indigo-600',
    glow: 'rgba(139, 92, 246, 0.25)',
  },
};

export function ProviderCard({ id, onClick }: Props) {
  const { t } = useI18n();
  const c = config[id];
  const Icon = c.icon;

  return (
    <button
      onClick={onClick}
      className="group relative w-full rounded-[28px] p-[1px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: `linear-gradient(135deg, ${c.glow}, transparent, ${c.glow})`,
      }}
    >
      <div className="relative overflow-hidden rounded-[27px] bg-white px-7 py-8 transition-all duration-300 group-hover:bg-surface-secondary/50">
        {/* Gradient orb background */}
        <div
          className={`absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br ${c.gradient} opacity-[0.07] blur-2xl transition-all duration-500 group-hover:opacity-[0.12] group-hover:scale-110`}
        />

        {/* Icon */}
        <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${c.gradient} flex items-center justify-center mb-5 shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Agent name */}
        <h3 className="relative text-2xl font-bold text-content-primary mb-1 tracking-tight">
          {c.agent}
        </h3>
        <p className="relative text-sm text-content-secondary mb-1">{c.subtitle}</p>
        <p className="relative text-xs text-content-tertiary font-mono mb-5">{c.model}</p>

        {/* Description */}
        <p className="relative text-sm text-content-secondary leading-relaxed mb-6">
          {t(id === 'openai' ? 'provider_openai_4o_desc' : 'provider_openai_mini_desc')}
        </p>

        {/* Cost badge */}
        <div className="relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-secondary border border-border">
          <span className="text-sm font-semibold font-mono text-content-primary">{c.costLabel}</span>
          <span className="text-[10px] text-content-tertiary uppercase tracking-wider font-medium">
            {id === 'openai' ? t('premium') : t('fast')}
          </span>
        </div>
      </div>
    </button>
  );
}

import { useI18n } from '../i18n';
import type { Voice, VoiceConfig } from '../types';
import { Play } from 'lucide-react';

const VOICES: { id: Voice; label: string }[] = [
  { id: 'marin', label: 'Marin' },
  { id: 'cedar', label: 'Cedar' },
  { id: 'verse', label: 'Verse' },
  { id: 'alloy', label: 'Alloy' },
  { id: 'ash', label: 'Ash' },
  { id: 'ballad', label: 'Ballad' },
  { id: 'coral', label: 'Coral' },
  { id: 'echo', label: 'Echo' },
  { id: 'sage', label: 'Sage' },
  { id: 'shimmer', label: 'Shimmer' },
];

interface Props {
  instructions: string;
  onInstructionsChange: (v: string) => void;
  voiceConfig: VoiceConfig;
  onVoiceConfigChange: (v: VoiceConfig) => void;
  onStart: () => void;
}

function Slider({ label, value, onChange, leftLabel, rightLabel }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  leftLabel: string;
  rightLabel: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-content-primary">{label}</span>
        <span className="text-xs font-mono text-content-tertiary">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-surface-tertiary rounded-full appearance-none cursor-pointer accent-accent"
      />
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-content-tertiary">{leftLabel}</span>
        <span className="text-[10px] text-content-tertiary">{rightLabel}</span>
      </div>
    </div>
  );
}

export function ConfigPanel({ instructions, onInstructionsChange, voiceConfig, onVoiceConfigChange, onStart }: Props) {
  const { t } = useI18n();

  const update = (partial: Partial<VoiceConfig>) =>
    onVoiceConfigChange({ ...voiceConfig, ...partial });

  return (
    <div className="bg-white rounded-2xl border border-border p-6 shadow-card space-y-6">
      {/* Personality */}
      <div>
        <label className="block text-sm font-medium text-content-primary mb-2">
          {t('personality')}
        </label>
        <textarea
          value={instructions}
          onChange={(e) => onInstructionsChange(e.target.value)}
          placeholder={t('personalityPlaceholder')}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-border bg-surface-secondary text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none transition-all"
        />
      </div>

      {/* Voice selector */}
      <div>
        <label className="block text-sm font-medium text-content-primary mb-2">
          {t('voiceLabel')}
        </label>
        <div className="flex flex-wrap gap-2">
          {VOICES.map((v) => (
            <button
              key={v.id}
              onClick={() => update({ voice: v.id })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                voiceConfig.voice === v.id
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-surface-secondary text-content-secondary hover:bg-surface-tertiary border border-transparent hover:border-border'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-content-tertiary mt-1.5">{t('voiceHint')}</p>
      </div>

      {/* Sliders */}
      <div className="space-y-5">
        <Slider
          label={t('empathyLabel')}
          value={voiceConfig.empathy}
          onChange={(v) => update({ empathy: v })}
          leftLabel={t('empathyLow')}
          rightLabel={t('empathyHigh')}
        />
        <Slider
          label={t('toneLabel')}
          value={voiceConfig.tone}
          onChange={(v) => update({ tone: v })}
          leftLabel={t('toneFormal')}
          rightLabel={t('toneCasual')}
        />
        <Slider
          label={t('verbosityLabel')}
          value={voiceConfig.verbosity}
          onChange={(v) => update({ verbosity: v })}
          leftLabel={t('verbosityConcise')}
          rightLabel={t('verbosityVerbose')}
        />

        {/* Temperature */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-content-primary">{t('temperatureLabel')}</span>
            <span className="text-xs font-mono text-content-tertiary">{voiceConfig.temperature.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={15}
            value={Math.round(voiceConfig.temperature * 10)}
            onChange={(e) => update({ temperature: Number(e.target.value) / 10 })}
            className="w-full h-1.5 bg-surface-tertiary rounded-full appearance-none cursor-pointer accent-accent"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-content-tertiary">{t('temperatureLow')}</span>
            <span className="text-[10px] text-content-tertiary">{t('temperatureHigh')}</span>
          </div>
        </div>
      </div>

      {/* Start */}
      <button
        onClick={onStart}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-medium text-sm transition-all shadow-subtle hover:shadow-card active:scale-[0.98]"
      >
        <Play className="w-4 h-4" />
        {t('startConversation')}
      </button>
    </div>
  );
}

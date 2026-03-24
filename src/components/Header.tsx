import { useI18n } from '../i18n';
import type { Language } from '../types';
import { Mic } from 'lucide-react';

const langs: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'de', label: 'DE' },
];

export function Header({ onLogoClick }: { onLogoClick?: () => void }) {
  const { lang, setLang, t } = useI18n();

  return (
    <header className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full">
      <button onClick={onLogoClick} className="flex items-center gap-3 hover:opacity-70 transition-opacity">
        <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
          <Mic className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-content-primary">
            {t('title')}
          </h1>
          <p className="text-sm text-content-tertiary hidden sm:block">
            {t('subtitle')}
          </p>
        </div>
      </button>

      <div className="flex items-center gap-1 bg-surface-tertiary rounded-lg p-1">
        {langs.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              lang === l.code
                ? 'bg-white text-content-primary shadow-subtle'
                : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
    </header>
  );
}

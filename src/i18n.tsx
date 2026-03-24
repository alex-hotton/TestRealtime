import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { Language } from './types';

const translations = {
  en: {
    title: 'Realtime AI Voice',
    subtitle: 'Test real-time voice conversations with leading AI models',
    selectModel: 'Choose a model',
    personality: 'AI Personality',
    personalityPlaceholder: 'Describe the personality and behavior...\n\nExample: You are a friendly travel guide who speaks with enthusiasm.',
    startConversation: 'Start conversation',
    endConversation: 'End conversation',
    connecting: 'Connecting...',
    listening: 'Listening...',
    speaking: 'Speaking...',
    ready: 'Ready — start speaking',
    cost: 'Estimated cost',
    tryAgain: 'Try again',
    back: 'Back',
    mute: 'Mute',
    unmute: 'Unmute',
    premium: 'Premium',
    fast: 'Fast & Affordable',
    perMin: '/min',
    projections: 'Projections',
    voiceLabel: 'Voice',
    voiceHint: 'Marin & Cedar recommended for best quality',
    empathyLabel: 'Empathy',
    empathyLow: 'Neutral',
    empathyHigh: 'Highly empathetic',
    toneLabel: 'Tone',
    toneFormal: 'Formal',
    toneCasual: 'Casual',
    verbosityLabel: 'Verbosity',
    verbosityConcise: 'Concise',
    verbosityVerbose: 'Detailed',
    temperatureLabel: 'Creativity',
    temperatureLow: 'Precise',
    temperatureHigh: 'Creative',
    provider_openai_4o_desc: 'Highest quality voice with nuanced understanding and natural conversation flow.',
    provider_openai_mini_desc: 'Same protocol, ~50x cheaper. Great for testing and high-volume use cases.',
  },
  fr: {
    title: 'IA Vocale Temps Réel',
    subtitle: 'Testez des conversations vocales en temps réel avec les meilleurs modèles IA',
    selectModel: 'Choisissez un modèle',
    personality: 'Personnalité de l\'IA',
    personalityPlaceholder: 'Décrivez la personnalité et le comportement...\n\nExemple : Vous êtes un guide touristique sympathique et enthousiaste.',
    startConversation: 'Démarrer la conversation',
    endConversation: 'Terminer la conversation',
    connecting: 'Connexion...',
    listening: 'Écoute...',
    speaking: 'Parle...',
    ready: 'Prêt — commencez à parler',
    cost: 'Coût estimé',
    tryAgain: 'Réessayer',
    back: 'Retour',
    mute: 'Couper le micro',
    unmute: 'Activer le micro',
    premium: 'Premium',
    fast: 'Rapide & Abordable',
    perMin: '/min',
    projections: 'Projections',
    voiceLabel: 'Voix',
    voiceHint: 'Marin & Cedar recommandés pour la meilleure qualité',
    empathyLabel: 'Empathie',
    empathyLow: 'Neutre',
    empathyHigh: 'Très empathique',
    toneLabel: 'Ton',
    toneFormal: 'Formel',
    toneCasual: 'Décontracté',
    verbosityLabel: 'Verbosité',
    verbosityConcise: 'Concis',
    verbosityVerbose: 'Détaillé',
    temperatureLabel: 'Créativité',
    temperatureLow: 'Précis',
    temperatureHigh: 'Créatif',
    provider_openai_4o_desc: 'Voix de haute qualité avec une compréhension nuancée et une conversation naturelle.',
    provider_openai_mini_desc: 'Même protocole, ~50x moins cher. Idéal pour les tests et les gros volumes.',
  },
  de: {
    title: 'KI-Stimme Echtzeit',
    subtitle: 'Testen Sie Echtzeit-Sprachgespräche mit führenden KI-Modellen',
    selectModel: 'Modell wählen',
    personality: 'KI-Persönlichkeit',
    personalityPlaceholder: 'Beschreiben Sie die Persönlichkeit und das Verhalten...\n\nBeispiel: Sie sind ein freundlicher und enthusiastischer Reiseführer.',
    startConversation: 'Gespräch starten',
    endConversation: 'Gespräch beenden',
    connecting: 'Verbindung wird hergestellt...',
    listening: 'Hört zu...',
    speaking: 'Spricht...',
    ready: 'Bereit — sprechen Sie los',
    cost: 'Geschätzte Kosten',
    tryAgain: 'Erneut versuchen',
    back: 'Zurück',
    mute: 'Stummschalten',
    unmute: 'Ton einschalten',
    premium: 'Premium',
    fast: 'Schnell & Günstig',
    perMin: '/Min',
    projections: 'Hochrechnungen',
    voiceLabel: 'Stimme',
    voiceHint: 'Marin & Cedar empfohlen für beste Qualität',
    empathyLabel: 'Empathie',
    empathyLow: 'Neutral',
    empathyHigh: 'Sehr empathisch',
    toneLabel: 'Ton',
    toneFormal: 'Formell',
    toneCasual: 'Locker',
    verbosityLabel: 'Ausführlichkeit',
    verbosityConcise: 'Knapp',
    verbosityVerbose: 'Ausführlich',
    temperatureLabel: 'Kreativität',
    temperatureLow: 'Präzise',
    temperatureHigh: 'Kreativ',
    provider_openai_4o_desc: 'Höchste Sprachqualität mit nuanciertem Verständnis und natürlichem Gesprächsfluss.',
    provider_openai_mini_desc: 'Gleiches Protokoll, ~50x günstiger. Ideal für Tests und Massennutzung.',
  },
} as const;

type TranslationKey = keyof typeof translations.en;

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue>(null!);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('lang') as Language;
    if (saved && ['en', 'fr', 'de'].includes(saved)) return saved;
    const browser = navigator.language.slice(0, 2);
    if (browser === 'fr') return 'fr';
    if (browser === 'de') return 'de';
    return 'en';
  });

  const handleSetLang = useCallback((l: Language) => {
    setLang(l);
    localStorage.setItem('lang', l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[lang][key] ?? translations.en[key] ?? key,
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

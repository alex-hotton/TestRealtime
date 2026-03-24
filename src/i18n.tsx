import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { Language } from './types';

const translations = {
  en: {
    title: 'Realtime AI Voice',
    subtitle: 'Test real-time voice conversations with leading AI models',
    selectModel: 'Choose a model',
    personality: 'AI Personality',
    personalityPlaceholder: 'Describe the personality and behavior of the AI assistant...\n\nExample: You are a friendly travel guide who speaks with enthusiasm about destinations around the world.',
    startConversation: 'Start conversation',
    endConversation: 'End conversation',
    connecting: 'Connecting...',
    listening: 'Listening...',
    speaking: 'Speaking...',
    ready: 'Ready — start speaking',
    cost: 'Estimated cost',
    inputTime: 'Input',
    outputTime: 'Output',
    total: 'Total',
    micPermission: 'Microphone access is required for voice conversations.',
    errorOccurred: 'An error occurred',
    tryAgain: 'Try again',
    back: 'Back',
    mute: 'Mute',
    unmute: 'Unmute',
    transcript: 'Transcript',
    you: 'You',
    ai: 'AI',
    premium: 'Premium',
    balanced: 'Balanced',
    fast: 'Fast & Affordable',
    perMin: '/min',
    estimated: 'estimated from duration',
    projections: 'Projections',
    provider_openai_4o_desc: 'Highest quality voice with nuanced understanding and natural conversation flow.',
    provider_openai_mini_desc: 'Same protocol, ~50x cheaper. Great for testing and high-volume use cases.',
    provider_xai_desc: 'Fast and expressive with web search built-in. Great balance of quality and cost.',
  },
  fr: {
    title: 'IA Vocale Temps Réel',
    subtitle: 'Testez des conversations vocales en temps réel avec les meilleurs modèles IA',
    selectModel: 'Choisissez un modèle',
    personality: 'Personnalité de l\'IA',
    personalityPlaceholder: 'Décrivez la personnalité et le comportement de l\'assistant IA...\n\nExemple : Vous êtes un guide touristique sympathique qui parle avec enthousiasme des destinations du monde entier.',
    startConversation: 'Démarrer la conversation',
    endConversation: 'Terminer la conversation',
    connecting: 'Connexion...',
    listening: 'Écoute...',
    speaking: 'Parle...',
    ready: 'Prêt — commencez à parler',
    cost: 'Coût estimé',
    inputTime: 'Entrée',
    outputTime: 'Sortie',
    total: 'Total',
    micPermission: 'L\'accès au microphone est nécessaire pour les conversations vocales.',
    errorOccurred: 'Une erreur est survenue',
    tryAgain: 'Réessayer',
    back: 'Retour',
    mute: 'Couper le micro',
    unmute: 'Activer le micro',
    transcript: 'Transcription',
    you: 'Vous',
    ai: 'IA',
    premium: 'Premium',
    balanced: 'Équilibré',
    fast: 'Rapide & Abordable',
    perMin: '/min',
    estimated: 'estimé depuis la durée',
    projections: 'Projections',
    provider_openai_4o_desc: 'Voix de haute qualité avec une compréhension nuancée et une conversation naturelle.',
    provider_openai_mini_desc: 'Même protocole, ~50x moins cher. Idéal pour les tests et les gros volumes.',
    provider_xai_desc: 'Rapide et expressif avec recherche web intégrée. Bon équilibre qualité/prix.',
  },
  de: {
    title: 'KI-Stimme Echtzeit',
    subtitle: 'Testen Sie Echtzeit-Sprachgespräche mit führenden KI-Modellen',
    selectModel: 'Modell wählen',
    personality: 'KI-Persönlichkeit',
    personalityPlaceholder: 'Beschreiben Sie die Persönlichkeit und das Verhalten des KI-Assistenten...\n\nBeispiel: Sie sind ein freundlicher Reiseführer, der mit Begeisterung über Reiseziele auf der ganzen Welt spricht.',
    startConversation: 'Gespräch starten',
    endConversation: 'Gespräch beenden',
    connecting: 'Verbindung wird hergestellt...',
    listening: 'Hört zu...',
    speaking: 'Spricht...',
    ready: 'Bereit — sprechen Sie los',
    cost: 'Geschätzte Kosten',
    inputTime: 'Eingabe',
    outputTime: 'Ausgabe',
    total: 'Gesamt',
    micPermission: 'Mikrofonzugriff ist für Sprachgespräche erforderlich.',
    errorOccurred: 'Ein Fehler ist aufgetreten',
    tryAgain: 'Erneut versuchen',
    back: 'Zurück',
    mute: 'Stummschalten',
    unmute: 'Ton einschalten',
    transcript: 'Transkript',
    you: 'Sie',
    ai: 'KI',
    premium: 'Premium',
    balanced: 'Ausgewogen',
    fast: 'Schnell & Günstig',
    perMin: '/Min',
    estimated: 'geschätzt nach Dauer',
    projections: 'Hochrechnungen',
    provider_openai_4o_desc: 'Höchste Sprachqualität mit nuanciertem Verständnis und natürlichem Gesprächsfluss.',
    provider_openai_mini_desc: 'Gleiches Protokoll, ~50x günstiger. Ideal für Tests und Massennutzung.',
    provider_xai_desc: 'Schnell und ausdrucksstark mit integrierter Websuche. Gutes Preis-Leistungs-Verhältnis.',
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

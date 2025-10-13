import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import en from './locales/en.json';
import ml from './locales/ml.json';
import hi from './locales/hi.json';
import ta from './locales/ta.json';
import ar from './locales/ar.json';
import de from './locales/de.json';

const resources = {
  en: { translation: en },
  ml: { translation: ml },
  hi: { translation: hi },
  ta: { translation: ta },
  ar: { translation: ar },
  de: { translation: de },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from '../translations/en.json';
import fr from '../translations/fr.json';
import ar from '../translations/ar.json';
import ru from '../translations/ru.json';
import es from '../translations/es.json';
import vi from '../translations/vi.json';
import id from '../translations/id.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      ar: { translation: ar },
      ru: { translation: ru },
      es: { translation: es },
      vi: { translation: vi },
      id: { translation: id }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

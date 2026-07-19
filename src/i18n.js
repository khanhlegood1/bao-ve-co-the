import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationEN from './locales/en.json';
import translationVI from './locales/vi.json';

const resources = {
  en: {
    translation: translationEN
  },
  vi: {
    translation: translationVI
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('lng') || 'vi', // Mặc định là Tiếng Việt hoặc ngôn ngữ đã lưu
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React đã tự động bảo vệ chống XSS
    }
  });

export default i18n;
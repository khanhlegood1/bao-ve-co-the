import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageToggle = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('lng', lng);
  };

  const currentLanguage = i18n.language;

  return (
    <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl shadow-sm border border-gray-200 inline-flex">
      <button
        onClick={() => changeLanguage('vi')}
        className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
          currentLanguage.startsWith('vi')
            ? 'bg-white text-blue-600 shadow-sm border border-gray-150'
            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
        }`}
      >
        <span className="text-base">🇻🇳</span>
        <span>VI</span>
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
          currentLanguage.startsWith('en')
            ? 'bg-white text-blue-600 shadow-sm border border-gray-150'
            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
        }`}
      >
        <span className="text-base">🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
};

export default LanguageToggle;
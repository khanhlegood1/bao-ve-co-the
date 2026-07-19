import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './components/LanguageToggle';
import './i18n'; // Kích hoạt cấu hình i18n cho toàn bộ app

function App() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-6 font-sans">
      <header className="w-full max-w-2xl flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-3xl">🛡️</span>
          <h1 className="text-2xl font-bold text-gray-850 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            {t('app_title')}
          </h1>
        </div>
        <LanguageToggle />
      </header>

      <main className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 space-y-6 transition-all duration-350">
        <div className="border-b border-gray-100 pb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {t('welcome')}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {t('description')}
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-indigo-700 mb-4 flex items-center space-x-2">
            <span>✨</span>
            <span>{t('health_tips')}</span>
          </h3>
          <ul className="space-y-4">
            <li className="flex items-start space-x-3 text-gray-700">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold mt-0.5">
                1
              </span>
              <span className="leading-relaxed">{t('tip_1')}</span>
            </li>
            <li className="flex items-start space-x-3 text-gray-700">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold mt-0.5">
                2
              </span>
              <span className="leading-relaxed">{t('tip_2')}</span>
            </li>
            <li className="flex items-start space-x-3 text-gray-700">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold mt-0.5">
                3
              </span>
              <span className="leading-relaxed">{t('tip_3')}</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App;
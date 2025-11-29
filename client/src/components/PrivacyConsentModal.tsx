
import React, { useState } from 'react';
import { FixedModal } from '@/components/FixedModal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface PrivacyConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export default function PrivacyConsentModal({ isOpen, onClose, onAccept }: PrivacyConsentModalProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [agreedToCookies, setAgreedToCookies] = useState(false);

  const canAccept = agreedToTerms && agreedToPrivacy && agreedToCookies;

  const handleAccept = () => {
    if (canAccept) {
      onAccept();
      onClose();
    }
  };

  return (
    <FixedModal open={isOpen} onOpenChange={() => {}} className="max-w-md w-full aspect-square">
      <div className="h-full flex flex-col p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-shield-alt text-white text-2xl"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Согласие на обработку данных
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Для продолжения работы необходимо ваше согласие
          </p>
        </div>

        {/* Content - scrollable area */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-6">
          {/* Информация о сборе данных */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
            <div className="flex items-start space-x-3">
              <i className="fas fa-database text-blue-600 dark:text-blue-400 mt-0.5"></i>
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100 text-sm mb-2">
                  Какие данные мы собираем
                </h3>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Email адрес для связи и уведомлений</li>
                  <li>• Имя пользователя и профильная информация</li>
                  <li>• Данные о Telegram каналах и группах</li>
                  <li>• Статистика использования сервиса</li>
                  <li>• IP адрес и данные браузера</li>
                  <li>• Файлы cookie для улучшения работы</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Цели обработки */}
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-700">
            <div className="flex items-start space-x-3">
              <i className="fas fa-bullseye text-green-600 dark:text-green-400 mt-0.5"></i>
              <div>
                <h3 className="font-medium text-green-900 dark:text-green-100 text-sm mb-2">
                  Для чего используются данные
                </h3>
                <ul className="text-xs text-green-800 dark:text-green-200 space-y-1">
                  <li>• Предоставление доступа к каталогу каналов</li>
                  <li>• Отправка уведомлений о статусе заявок</li>
                  <li>• Аналитика и улучшение сервиса</li>
                  <li>• Защита от мошенничества и спама</li>
                  <li>• Техническая поддержка пользователей</li>
                  <li>• Соблюдение законных требований</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={setAgreedToTerms}
                className="mt-0.5"
              />
              <div className="flex-1">
                <label htmlFor="terms" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                  Пользовательское соглашение
                </label>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Я согласен с условиями использования сервиса, включая правила размещения каналов, ответственность сторон и порядок урегулирования споров.
                  <a href="/public-offer" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
                    Читать полностью
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <Checkbox
                id="privacy"
                checked={agreedToPrivacy}
                onCheckedChange={setAgreedToPrivacy}
                className="mt-0.5"
              />
              <div className="flex-1">
                <label htmlFor="privacy" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                  Согласие на обработку персональных данных
                </label>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Я даю согласие на обработку моих персональных данных в соответствии с Федеральным законом №152-ФЗ "О персональных данных" для целей предоставления услуг каталога.
                  <a href="/privacy-policy" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
                    Читать полностью
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <Checkbox
                id="cookies"
                checked={agreedToCookies}
                onCheckedChange={setAgreedToCookies}
                className="mt-0.5"
              />
              <div className="flex-1">
                <label htmlFor="cookies" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                  Согласие на использование файлов cookie
                </label>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Я согласен на использование файлов cookie и аналогичных технологий для анализа трафика, персонализации контента и улучшения пользовательского опыта.
                </p>
              </div>
            </div>
          </div>

          {/* Безопасность данных */}
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-700">
            <div className="flex items-start space-x-3">
              <i className="fas fa-lock text-purple-600 dark:text-purple-400 mt-0.5"></i>
              <div>
                <h3 className="font-medium text-purple-900 dark:text-purple-100 text-sm mb-2">
                  Защита ваших данных
                </h3>
                <ul className="text-xs text-purple-800 dark:text-purple-200 space-y-1">
                  <li>• Шифрование данных при передаче (SSL/TLS)</li>
                  <li>• Безопасное хранение в защищенных серверах</li>
                  <li>• Ограниченный доступ только авторизованного персонала</li>
                  <li>• Регулярные проверки безопасности</li>
                  <li>• Соблюдение международных стандартов</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-700">
            <div className="flex items-start space-x-3">
              <i className="fas fa-shield-alt text-yellow-600 dark:text-yellow-400 mt-0.5"></i>
              <div>
                <h3 className="font-medium text-yellow-900 dark:text-yellow-100 text-sm mb-2">
                  Ваши права в отношении персональных данных
                </h3>
                <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1">
                  <li>• Право на доступ к своим персональным данным</li>
                  <li>• Право на исправление неточных данных</li>
                  <li>• Право на удаление данных (право на забвение)</li>
                  <li>• Право на ограничение обработки</li>
                  <li>• Право на переносимость данных</li>
                  <li>• Право отозвать согласие в любое время</li>
                  <li>• Право подать жалобу в надзорный орган</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Контакты */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-start space-x-3">
              <i className="fas fa-envelope text-gray-600 dark:text-gray-400 mt-0.5"></i>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-2">
                  Связь с нами
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  По вопросам обработки персональных данных обращайтесь через раздел "Поддержка" или напишите нам в Telegram. Мы ответим в течение 24 часов.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleAccept}
            disabled={!canAccept}
            className={`w-full ${
              canAccept
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            } rounded-xl font-medium`}
          >
            <i className="fas fa-check mr-2"></i>
            Принять все условия
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
          >
            <i className="fas fa-times mr-2"></i>
            Отклонить
          </Button>
          
          {!canAccept && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Для продолжения необходимо согласие со всеми условиями
            </p>
          )}
        </div>
      </div>
    </FixedModal>
  );
}

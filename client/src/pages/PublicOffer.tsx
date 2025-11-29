
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, CreditCard, RefreshCw, MessageSquare, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import SEOFooter from "@/components/SEOFooter";

export default function PublicOffer() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/')}
            className="mb-6 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-800/60 backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад на главную
          </Button>
          
          <div className="text-center bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 dark:border-gray-700/30">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3">
              Публичная оферта
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Условия предоставления услуг, порядок пополнения баланса и разрешения споров
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Общие положения */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-400/10 dark:to-purple-400/10 rounded-t-lg">
              <CardTitle className="flex items-center text-gray-900 dark:text-white text-xl">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg mr-3">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                1. Общие положения
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6 text-gray-700 dark:text-gray-300">
              <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-xl border-l-4 border-blue-500">
                <p className="text-base leading-relaxed">
                  Настоящая публичная оферта определяет условия предоставления услуг на платформе 
                  размещения каналов Telegram. Используя наши услуги, вы принимаете данные условия полностью.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  Услуги платформы:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "Размещение каналов, ботов и групп Telegram в каталоге",
                    "Продвижение каналов",
                    "Модерация и проверка контента",
                    "Система рейтингов и отзывов"
                  ].map((service, index) => (
                    <div key={index} className="flex items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                      <CheckCircle className="h-4 w-4 mr-3 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{service}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Пополнение баланса */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-400/10 dark:to-emerald-400/10 rounded-t-lg">
              <CardTitle className="flex items-center text-gray-900 dark:text-white text-xl">
                <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg mr-3">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                2. Порядок пополнения баланса
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6 text-gray-700 dark:text-gray-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-xl">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-blue-500" />
                    2.1. Способы пополнения
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Через сервис ROBOKASSA</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Минимальная сумма: 100 рублей</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Максимальная сумма: 100 000 рублей</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-5 rounded-xl">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                    <ArrowLeft className="h-5 w-5 mr-2 text-purple-500 rotate-90" />
                    2.2. Процедура пополнения
                  </h4>
                  <ol className="space-y-2">
                    {[
                      "Перейдите в раздел \"Профиль\" → \"Пополнить баланс\"",
                      "Укажите сумму пополнения",
                      "Введите данные карты",
                      "Оплатите"
                    ].map((step, index) => (
                      <li key={index} className="flex items-start">
                        <span className="bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-sm">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-5 rounded-xl">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-orange-500" />
                    2.3. Обработка заявок
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <Clock className="h-4 w-4 mr-2 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Рабочие дни: 10:00-00:00 МСК</span>
                    </li>
                    <li className="flex items-start">
                      <Clock className="h-4 w-4 mr-2 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Время обработки: до 24 часов</span>
                    </li>
                    <li className="flex items-start">
                      <AlertCircle className="h-4 w-4 mr-2 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Причина отклонения указывается в ЛК</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Возврат средств */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10 dark:from-orange-400/10 dark:to-red-400/10 rounded-t-lg">
              <CardTitle className="flex items-center text-gray-900 dark:text-white text-xl">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg mr-3">
                  <RefreshCw className="h-5 w-5 text-white" />
                </div>
                3. Порядок возврата средств
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6 text-gray-700 dark:text-gray-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-green-50/50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold mb-3 text-green-800 dark:text-green-300 flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      3.1. Основания для возврата
                    </h4>
                    <ul className="space-y-2">
                      {[
                        "Техническая ошибка при зачислении средств",
                        "Двойное списание средств",
                        "Невозможность предоставления услуги по вине платформы",
                        "Блокировка аккаунта без нарушений"
                      ].map((reason, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-red-50/50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800">
                    <h4 className="font-semibold mb-3 text-red-800 dark:text-red-300 flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      3.2. Случаи отказа в возврате
                    </h4>
                    <ul className="space-y-2">
                      {[
                        "Услуга была успешно оказана",
                        "Блокировка за нарушение правил",
                        "Размещение запрещенного контента",
                        "Истечение срока действия"
                      ].map((reason, index) => (
                        <li key={index} className="flex items-start">
                          <AlertCircle className="h-4 w-4 mr-2 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold mb-3 text-blue-800 dark:text-blue-300 flex items-center">
                  <RefreshCw className="h-5 w-5 mr-2" />
                  3.3. Процедура возврата
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { step: "1", text: "Подача заявки через форму обратной связи" },
                    { step: "2", text: "Указание причины с документальным обоснованием" },
                    { step: "3", text: "Рассмотрение заявки в течение 5 рабочих дней" },
                    { step: "4", text: "При одобрении - возврат в течение 3-10 дней" }
                  ].map((item, index) => (
                    <div key={index} className="text-center">
                      <div className="bg-blue-500 text-white text-sm rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">
                        {item.step}
                      </div>
                      <p className="text-xs">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Разрешение претензий */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-400/10 dark:to-pink-400/10 rounded-t-lg">
              <CardTitle className="flex items-center text-gray-900 dark:text-white text-xl">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mr-3">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                4. Порядок разрешения претензий
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6 text-gray-700 dark:text-gray-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-5 rounded-xl">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-purple-500" />
                    4.1. Подача претензии
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Письменно через форму обратной связи</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Указание ФИО, контактов, сути претензии</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Приложение подтверждающих документов</span>
                    </li>
                    <li className="flex items-start">
                      <Clock className="h-4 w-4 mr-2 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Срок подачи: 30 дней</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-xl">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-blue-500" />
                    4.2. Рассмотрение претензий
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <Clock className="h-4 w-4 mr-2 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Срок рассмотрения: до 10 рабочих дней</span>
                    </li>
                    <li className="flex items-start">
                      <MessageSquare className="h-4 w-4 mr-2 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Ответ на email или в личный кабинет</span>
                    </li>
                    <li className="flex items-start">
                      <AlertCircle className="h-4 w-4 mr-2 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Возможен запрос дополнительных документов</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Решение на основании фактов</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-5 rounded-xl">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-green-500" />
                    4.3. Досудебное урегулирование
                  </h4>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <p className="text-sm">
                      Все споры подлежат обязательному досудебному урегулированию. 
                      Обращение в суд возможно только после получения письменного ответа 
                      на претензию или истечения срока её рассмотрения.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ответственность сторон */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 dark:from-indigo-400/10 dark:to-blue-400/10 rounded-t-lg">
              <CardTitle className="flex items-center text-gray-900 dark:text-white text-xl">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg mr-3">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                5. Ответственность сторон
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6 text-gray-700 dark:text-gray-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold mb-4 text-blue-800 dark:text-blue-300 flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    5.1. Ответственность платформы
                  </h4>
                  <ul className="space-y-3">
                    {[
                      "Обеспечение работоспособности сервиса в рабочее время",
                      "Сохранность персональных данных пользователей",
                      "Честная модерация контента согласно правилам"
                    ].map((item, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-4 w-4 mr-2 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-5 rounded-xl border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold mb-4 text-green-800 dark:text-green-300 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    5.2. Ответственность пользователя
                  </h4>
                  <ul className="space-y-3">
                    {[
                      "Соблюдение правил платформы",
                      "Размещение только легального контента",
                      "Достоверность предоставляемой информации",
                      "Своевременная оплата услуг"
                    ].map((item, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Контактная информация */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-400/10 dark:to-pink-400/10 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white text-xl">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mr-3">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                6. Контактная информация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6 text-gray-700 dark:text-gray-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/50 dark:bg-gray-800/50 p-5 rounded-xl">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />
                    Техническая поддержка
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">Email:</span>
                      <span className="text-sm text-blue-600 dark:text-blue-400">tgflovv@gmail.com</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">Telegram:</span>
                      <span className="text-sm text-blue-600 dark:text-blue-400">@tgflovv</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">Режим работы:</span>
                      <span className="text-sm text-green-600 dark:text-green-400">без выходных</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/50 dark:bg-gray-800/50 p-5 rounded-xl">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-green-500" />
                    Финансовые вопросы
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">Email:</span>
                      <span className="text-sm text-blue-600 dark:text-blue-400">tgflovv@gmail.com</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">Telegram:</span>
                      <span className="text-sm text-blue-600 dark:text-blue-400">@tgflovv</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />
              
              <div className="text-center bg-white/30 dark:bg-gray-800/30 p-4 rounded-xl">
                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <p>Дата последнего обновления: <span className="font-medium">{new Date().toLocaleDateString('ru-RU')}</span></p>
                  <p>Версия документа: <span className="font-medium">2.0</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <SEOFooter />
    </div>
  );
}

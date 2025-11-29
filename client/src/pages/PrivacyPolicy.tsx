
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Database, Eye, Lock, Users, FileText, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { useLocation } from "wouter";
import SEOFooter from "@/components/SEOFooter";

export default function PrivacyPolicy() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3">
              Политика обработки персональных данных
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Информация о том, как мы собираем, используем и защищаем ваши персональные данные
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Общие положения */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-400/10 dark:to-purple-400/10 rounded-t-lg">
              <CardTitle className="flex items-center text-gray-900 dark:text-white text-xl">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mr-3">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                1. Общие положения
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6 text-gray-700 dark:text-gray-300">
              <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-xl border-l-4 border-blue-500">
                <p className="text-base leading-relaxed">
                  Настоящая Политика обработки персональных данных разработана в соответствии 
                  с Федеральным законом от 27.07.2006 №152-ФЗ "О персональных данных" и 
                  определяет порядок обработки персональных данных и меры по их защите.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-purple-500" />
                  Основные термины:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      term: "Персональные данные",
                      desc: "любая информация, относящаяся к прямо или косвенно определенному физическому лицу"
                    },
                    {
                      term: "Обработка персональных данных",
                      desc: "любое действие с персональными данными"
                    },
                    {
                      term: "Оператор",
                      desc: "организация, осуществляющая обработку персональных данных"
                    },
                    {
                      term: "Субъект персональных данных",
                      desc: "физическое лицо, к которому относятся персональные данные"
                    }
                  ].map((item, index) => (
                    <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                      <h5 className="font-medium text-purple-800 dark:text-purple-300 mb-2">{item.term}</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Цели обработки */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-400/10 dark:to-emerald-400/10 rounded-t-lg">
              <CardTitle className="flex items-center text-gray-900 dark:text-white text-xl">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg mr-3">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                2. Цели обработки персональных данных
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6 text-gray-700 dark:text-gray-300">
              <p className="text-lg font-medium">Мы обрабатываем персональные данные в следующих целях:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "Регистрация и идентификация пользователей на платформе",
                  "Предоставление доступа к функциям каталога каналов Telegram",
                  "Обработка заявок на размещение каналов, ботов и групп",
                  "Обработка платежей и пополнений баланса",
                  "Техническая поддержка пользователей",
                  "Предотвращение мошенничества и обеспечение безопасности",
                  "Улучшение качества предоставляемых услуг",
                  "Выполнение требований законодательства"
                ].map((purpose, index) => (
                  <div key={index} className="flex items-start p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircle className="h-5 w-5 mr-3 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{purpose}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Категории персональных данных */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-400/10 dark:to-pink-400/10 rounded-t-lg">
              <CardTitle className="flex items-center text-gray-900 dark:text-white text-xl">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg mr-3">
                  <Database className="h-5 w-5 text-white" />
                </div>
                3. Категории обрабатываемых персональных данных
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6 text-gray-700 dark:text-gray-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold mb-3 text-blue-800 dark:text-blue-300 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    3.1. Обязательные данные
                  </h4>
                  <ul className="space-y-2">
                    {["Почта", "Логин (имя пользователя)", "Пароль (в зашифрованном виде)"].map((item, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-5 rounded-xl border border-purple-200 dark:border-purple-800">
                  <h4 className="font-semibold mb-3 text-purple-800 dark:text-purple-300 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    3.2. Данные через Telegram
                  </h4>
                  <ul className="space-y-2">
                    {[
                      "ID пользователя Telegram",
                      "Имя пользователя (username)",
                      "Имя и фамилия",
                      "Фотография профиля"
                    ].map((item, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-5 rounded-xl border border-orange-200 dark:border-orange-800">
                  <h4 className="font-semibold mb-3 text-orange-800 dark:text-orange-300 flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    3.3. Дополнительные данные
                  </h4>
                  <ul className="space-y-2">
                    {[
                      "Информация о каналах и группах",
                      "История транзакций",
                      "Логи активности",
                      "IP-адрес и данные устройства",
                      "Настройки и предпочтения"
                    ].map((item, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Правовые основания */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10 dark:from-orange-400/10 dark:to-red-400/10 rounded-t-lg">
              <CardTitle className="flex items-center text-gray-900 dark:text-white text-xl">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg mr-3">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                4. Правовые основания обработки
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6 text-gray-700 dark:text-gray-300">
              <p className="text-lg font-medium">Обработка персональных данных осуществляется на следующих правовых основаниях:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "Согласие субъекта персональных данных (ст. 6 ФЗ-152)",
                  "Исполнение договора, стороной которого является субъект персональных данных",
                  "Выполнение правовых обязательств оператора",
                  "Защита жизненно важных интересов субъекта персональных данных",
                  "Осуществление и защита правомерных интересов оператора"
                ].map((basis, index) => (
                  <div key={index} className="flex items-start p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <FileText className="h-5 w-5 mr-3 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{basis}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Способы обработки */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-r from-red-500/10 to-pink-500/10 dark:from-red-400/10 dark:to-pink-400/10 rounded-t-lg">
              <CardTitle className="flex items-center text-gray-900 dark:text-white text-xl">
                <div className="p-2 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg mr-3">
                  <Lock className="h-5 w-5 text-white" />
                </div>
                5. Способы и сроки обработки персональных данных
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6 text-gray-700 dark:text-gray-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-5 rounded-xl border border-red-200 dark:border-red-800">
                  <h4 className="font-semibold mb-3 text-red-800 dark:text-red-300 flex items-center">
                    <Lock className="h-5 w-5 mr-2" />
                    5.1. Способы обработки
                  </h4>
                  <ul className="space-y-2">
                    {[
                      "Автоматизированная обработка с использованием вычислительной техники",
                      "Неавтоматизированная обработка (в исключительных случаях)",
                      "Смешанная обработка данных"
                    ].map((method, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-4 w-4 mr-2 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{method}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold mb-3 text-blue-800 dark:text-blue-300 flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    5.2. Сроки обработки
                  </h4>
                  <ul className="space-y-2">
                    {[
                      { period: "Активные пользователи", duration: "весь период использования" },
                      { period: "Заблокированные аккаунты", duration: "до 3 лет" },
                      { period: "Финансовые данные", duration: "до 5 лет" },
                      { period: "Логи безопасности", duration: "до 1 года" }
                    ].map((item, index) => (
                      <li key={index} className="flex items-start">
                        <Clock className="h-4 w-4 mr-2 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <span className="font-medium">{item.period}:</span> {item.duration}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Передача данных */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-400/10 dark:to-purple-400/10 rounded-t-lg">
              <CardTitle className="flex items-center text-gray-900 dark:text-white text-xl">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg mr-3">
                  <Users className="h-5 w-5 text-white" />
                </div>
                6. Передача персональных данных третьим лицам
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6 text-gray-700 dark:text-gray-300">
              <p className="text-lg font-medium">Мы можем передавать ваши персональные данные:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "Государственным органам при наличии законного требования",
                  "Платежным системам для обработки транзакций",
                  "Техническим подрядчикам при условии соблюдения конфиденциальности",
                  "Правоохранительным органам в случаях, предусмотренных законом"
                ].map((case_, index) => (
                  <div key={index} className="flex items-start p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <Users className="h-5 w-5 mr-3 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{case_}</span>
                  </div>
                ))}
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-xl border-l-4 border-yellow-400">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Важно!</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-200">
                      Мы не продаем, не сдаем в аренду и не передаем ваши персональные 
                      данные третьим лицам для маркетинговых целей без вашего явного согласия.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Права субъектов */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-r from-green-500/10 to-blue-500/10 dark:from-green-400/10 dark:to-blue-400/10 rounded-t-lg">
              <CardTitle className="flex items-center text-gray-900 dark:text-white text-xl">
                <div className="p-2 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg mr-3">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                7. Права субъектов персональных данных
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6 text-gray-700 dark:text-gray-300">
              <p className="text-lg font-medium">В соответствии с законодательством вы имеете право:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "Получать информацию об обработке ваших персональных данных",
                  "Требовать уточнения, блокирования или уничтожения неточных данных",
                  "Отзывать согласие на обработку персональных данных",
                  "Обжаловать действия оператора в надзорном органе или суде",
                  "Получать копию ваших персональных данных",
                  "Требовать ограничения обработки или переносимости данных"
                ].map((right, index) => (
                  <div key={index} className="flex items-start p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircle className="h-5 w-5 mr-3 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{right}</span>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border-l-4 border-blue-400">
                <div className="flex items-start">
                  <Shield className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Для реализации ваших прав</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-200">
                      обращайтесь по email: <span className="font-medium">tgflovv@gmail.com</span> 
                      или через форму обратной связи в личном кабинете.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Меры защиты */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-r from-red-500/10 to-orange-500/10 dark:from-red-400/10 dark:to-orange-400/10 rounded-t-lg">
              <CardTitle className="flex items-center text-gray-900 dark:text-white text-xl">
                <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg mr-3">
                  <Lock className="h-5 w-5 text-white" />
                </div>
                8. Меры защиты персональных данных
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6 text-gray-700 dark:text-gray-300">
              <p className="text-lg font-medium">Для защиты ваших персональных данных мы применяем:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { icon: Lock, text: "Шифрование данных при передаче (SSL/TLS протоколы)" },
                  { icon: Shield, text: "Хеширование паролей с использованием криптографических алгоритмов" },
                  { icon: Users, text: "Ограничение доступа к персональным данным" },
                  { icon: CheckCircle, text: "Регулярное обновление систем безопасности" },
                  { icon: Eye, text: "Мониторинг несанкционированного доступа" },
                  { icon: Database, text: "Резервное копирование и восстановление данных" },
                  { icon: FileText, text: "Обучение сотрудников правилам обработки персональных данных" }
                ].map((measure, index) => (
                  <div key={index} className="flex items-start p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <measure.icon className="h-5 w-5 mr-3 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{measure.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Согласие на обработку */}
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-400/10 dark:to-emerald-400/10 backdrop-blur-sm border-2 border-green-200 dark:border-green-800 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white text-xl">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg mr-3">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                9. Согласие на обработку персональных данных
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6 text-gray-700 dark:text-gray-300">
              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                <h4 className="font-semibold mb-4 text-green-800 dark:text-green-300 flex items-center text-lg">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Используя наш сервис, вы даете согласие на:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "Обработку ваших персональных данных в целях, указанных в настоящей Политике",
                    "Использование файлов cookie и аналогичных технологий",
                    "Получение уведомлений о состоянии вашего аккаунта",
                    "Передачу данных третьим лицам в случаях, описанных выше"
                  ].map((consent, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{consent}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    Согласие действует с момента регистрации до момента его отзыва или удаления аккаунта.
                  </p>
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
                <h4 className="font-semibold mb-2 text-orange-800 dark:text-orange-300">Отзыв согласия:</h4>
                <p className="text-sm text-orange-700 dark:text-orange-200">
                  Вы можете отозвать согласие на обработку персональных данных в любое время, 
                  направив соответствующее заявление на email: <span className="font-medium">tgflovv@gmail.com</span>. 
                  При отзыве согласия ваш аккаунт будет заблокирован, а данные удалены 
                  в соответствии с требованиями законодательства.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Контактная информация */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-400/10 dark:to-pink-400/10 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white text-xl">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mr-3">
                  <Users className="h-5 w-5 text-white" />
                </div>
                10. Контактная информация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6 text-gray-700 dark:text-gray-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/50 dark:bg-gray-800/50 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
                  <h4 className="font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-purple-500" />
                    По вопросам обработки персональных данных
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">Email:</span>
                      <span className="text-sm text-purple-600 dark:text-purple-400">tgflovv@gmail.com</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">Ответственный:</span>
                      <span className="text-sm">Администратор платформы</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">Время рассмотрения:</span>
                      <span className="text-sm text-green-600 dark:text-green-400">до 30 дней</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/50 dark:bg-gray-800/50 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                    <Eye className="h-5 w-5 mr-2 text-blue-500" />
                    Надзорный орган
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">Орган:</span>
                      <span className="text-sm">Роскомнадзор</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">Сайт:</span>
                      <span className="text-sm text-blue-600 dark:text-blue-400">rkn.gov.ru</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">Телефон:</span>
                      <span className="text-sm text-blue-600 dark:text-blue-400">8-800-707-7-707</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />
              
              <div className="text-center bg-white/30 dark:bg-gray-800/30 p-4 rounded-xl">
                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <p>Дата вступления в силу: <span className="font-medium">{new Date().toLocaleDateString('ru-RU')}</span></p>
                  <p>Дата последнего обновления: <span className="font-medium">{new Date().toLocaleDateString('ru-RU')}</span></p>
                  <p>Версия документа: <span className="font-medium">1.0</span></p>
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

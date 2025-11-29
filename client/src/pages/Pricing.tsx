
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, TrendingUp, Zap, Crown, CheckCircle, Clock, DollarSign, Target } from "lucide-react";
import { useLocation } from "wouter";
import SEOFooter from "@/components/SEOFooter";

export default function Pricing() {
  const [, setLocation] = useLocation();

  const pricingPlans = [
    {
      id: 'basic',
      name: 'Размещение канала',
      price: '30 ₽',
      duration: 'бессрочно',
      icon: Star,
      color: 'from-blue-500 to-blue-600',
      features: [
        'Размещение в каталоге',
        'Отображение в поиске',
        'Возможность получать отзывы',
        'Базовая статистика просмотров',
        'Модерация контента'
      ],
      description: 'Базовое размещение для обычных каналов'
    },
    {
      id: 'adult',
      name: 'Размещение 18+ канала',
      price: '60 ₽',
      duration: 'бессрочно',
      icon: Crown,
      color: 'from-red-500 to-red-600',
      features: [
        'Размещение контента 18+',
        'Специальная модерация',
        'Отдельная категория',
        'Фильтрация по возрасту',
        'Повышенная проверка'
      ],
      description: 'Размещение для контента с возрастными ограничениями'
    },
    {
      id: 'top',
      name: 'Топ продвижение',
      price: '50 ₽',
      duration: '1 день',
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      features: [
        'Размещение в топе категории',
        'Приоритет в поиске',
        'Специальная отметка "ТОП"',
        'Увеличение видимости в 5 раз',
        'Детальная статистика'
      ],
      description: 'Продвижение канала в топ на день'
    },
    {
      id: 'ultra',
      name: 'Ультра топ',
      price: '500 ₽',
      duration: '1 день',
      icon: Zap,
      color: 'from-purple-500 to-purple-600',
      features: [
        'Максимальный приоритет',
        'Размещение в главном топе',
        'Отметка "УЛЬТРА ТОП"',
        'Показ на главной странице',
        'Максимальная видимость',
        'Приоритетная поддержка'
      ],
      description: 'Максимальное продвижение с наивысшим приоритетом'
    }
  ];

  const additionalServices = [
    {
      name: 'Пополнение баланса',
      description: 'Минимальная сумма: 100 ₽, максимальная: 100 000 ₽',
      icon: DollarSign,
      features: ['Без комиссии', 'Мгновенное зачисление', 'Все способы оплаты']
    },
    {
      name: 'Модерация',
      description: 'Проверка контента в течение 24 часов',
      icon: CheckCircle,
      features: ['Бесплатная проверка', 'Соответствие правилам', 'Быстрое рассмотрение']
    },
    {
      name: 'Статистика',
      description: 'Подробная аналитика просмотров и переходов',
      icon: Target,
      features: ['Ежедневные отчеты', 'Графики динамики', 'Анализ аудитории']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
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
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3">
              Тарифы и цены
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Прозрачные цены на все услуги платформы. Выберите подходящий тариф для продвижения вашего канала
            </p>
          </div>
        </div>

        {/* Основные тарифы */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Основные услуги
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingPlans.map((plan) => {
              const IconComponent = plan.icon;
              return (
                <Card key={plan.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className={`bg-gradient-to-r ${plan.color} text-white rounded-t-lg`}>
                    <CardTitle className="flex items-center text-xl">
                      <div className="p-2 bg-white/20 rounded-lg mr-3">
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div>{plan.name}</div>
                        <div className="text-sm font-normal opacity-90">{plan.description}</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {plan.price}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {plan.duration}
                      </div>
                    </div>
                    
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Дополнительные услуги */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Дополнительные услуги
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {additionalServices.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card key={index} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="bg-gradient-to-r from-gray-500/10 to-gray-600/10 dark:from-gray-400/10 dark:to-gray-500/10 rounded-t-lg">
                    <CardTitle className="flex items-center text-gray-900 dark:text-white text-lg">
                      <div className="p-2 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg mr-3">
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      {service.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                      {service.description}
                    </p>
                    <ul className="space-y-2">
                      {service.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Информация об оплате */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-400/10 dark:to-purple-400/10 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 dark:text-white text-xl">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg mr-3">
                <Clock className="h-5 w-5 text-white" />
              </div>
              Условия оплаты и активации
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6 text-gray-700 dark:text-gray-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/50 dark:bg-gray-800/50 p-5 rounded-xl">
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-blue-500" />
                  Способы оплаты
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm">Банковские карты (Visa, MasterCard, МИР)</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm">Система быстрых платежей (СБП)</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm">Электронные кошельки</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm">Интернет-банкинг</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white/50 dark:bg-gray-800/50 p-5 rounded-xl">
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-orange-500" />
                  Сроки активации
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="text-sm">Размещение: после модерации (до 24 часов)</span>
                  </li>
                  <li className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm">Топ продвижение: в течение 1 часа</span>
                  </li>
                  <li className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-purple-500" />
                    <span className="text-sm">Ультра топ: в течение 1 часа</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm">Пополнение баланса: мгновенно</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-amber-50/50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold mb-2 text-amber-800 dark:text-amber-300 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Важная информация
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Все услуги активируются автоматически после успешной оплаты и прохождения модерации. 
                Возврат средств возможен только в случаях, предусмотренных публичной офертой. 
                При возникновении вопросов обращайтесь в техническую поддержку.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CTA секция */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-xl">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">
                Готовы начать продвижение?
              </h3>
              <p className="text-lg mb-6 opacity-90">
                Зарегистрируйтесь и получите доступ ко всем возможностям платформы
              </p>
              <div className="space-x-4">
                <Button 
                  onClick={() => setLocation('/auth')}
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-gray-100"
                >
                  Зарегистрироваться
                </Button>
                <Button 
                  onClick={() => setLocation('/faq')}
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  Узнать больше
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <SEOFooter />
    </div>
  );
}

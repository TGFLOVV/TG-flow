import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Sidebar from "@/components/Sidebar";

import { useState } from "react";
import Header from "@/components/Header";
import SEOFooter from "@/components/SEOFooter";

export default function FAQ() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const faqItems = [
    {
      question: "Что такое TG Flow?",
      answer: "TG Flow - это каталог популярных Telegram каналов и групп, разделенных по категориям для удобного поиска интересного контента."
    },
    {
      question: "Как добавить свой канал в каталог?",
      answer: "Для добавления канала подайте заявку через форму на главной странице. Заявки рассматриваются модераторами в течение 10 минут."
    },
    {
      question: "Какие требования к каналам?",
      answer: "Канал должен быть активным, с качественным контентом и соответствовать выбранной категории. Запрещены каналы с нарушением авторских прав, спамом или неподобающим контентом."
    },
    {
      question: "Как работает поиск каналов?",
      answer: "Вы можете искать каналы по названию, описанию или категории. Используйте фильтры для более точного поиска интересного контента."
    },
    {
      question: "Можно ли изменить информацию о канале?",
      answer: "Да, владельцы каналов могут обратиться к модераторам для изменения категории или обновления информации о своем канале."
    },
    {
      question: "Как работает рейтинговая система?",
      answer: "Каналы ранжируются по количеству подписчиков, активности и качеству контента. Популярные каналы отображаются выше в поиске."
    },
    {
      question: "Безопасно ли пользоваться каталогом?",
      answer: "Да, все каналы проходят модерацию. Мы не собираем персональные данные без согласия и соблюдаем политику конфиденциальности."
    },
    {
      question: "Как часто обновляется информация о каналах?",
      answer: "Статистика каналов обновляется автоматически каждые 24 часа для поддержания актуальной информации."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/70 to-blue-50/70 dark:from-gray-900/70 dark:to-gray-800/70 text-gray-900 dark:text-white flex flex-col">
        <Sidebar 
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
      <div className="lg:ml-64 flex-1 flex flex-col min-h-screen">
        <Header 
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        <main className="flex-1 p-2 lg:p-4 header-padding overflow-x-hidden">
        <div className="max-w-4xl mx-auto w-full">
          <div className="mb-3 lg:mb-4">
            <h1 className="text-xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">Часто задаваемые вопросы</h1>
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">Найдите ответы на популярные вопросы</p>
          </div>

          <Card className="bg-white/80 dark:bg-gray-900/80 border-gray-300 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">FAQ</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`item-${index}`}
                    className="border-b border-gray-200 dark:border-gray-800"
                  >
                    <AccordionTrigger className="text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 dark:text-gray-400">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-900/80 border-gray-300 dark:border-gray-800 mt-6">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Не нашли ответ?</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Свяжитесь с нашей поддержкой</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button
                    onClick={() => window.open('https://t.me/tgflovv', '_blank')}
                    className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    <i className="fab fa-telegram text-blue-500 dark:text-blue-400"></i>
                    <span className="hover:underline">@tgflovv</span>
                  </button>
                  <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400">
                    <i className="fas fa-envelope text-purple-500 dark:text-purple-400"></i>
                    <span>TGFLOVV@gmail.com</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      </div>
      <SEOFooter />
    </div>
  );
}

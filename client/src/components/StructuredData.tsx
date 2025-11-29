import { useEffect } from 'react';

interface StructuredDataProps {
  currentCategory?: string;
  pageType?: 'home' | 'catalog' | 'category' | 'channel';
}

export default function StructuredData({ 
  currentCategory = "",
  pageType = 'home'
}: StructuredDataProps) {

  // Ensure currentCategory is always a string
  const categoryName = typeof currentCategory === 'string' ? currentCategory : String(currentCategory || '');

  useEffect(() => {
    // Создаем базовые структурированные данные
    const baseStructuredData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "TG Flow - ТГ ФЛОВ",
      "alternateName": ["ТГ ФЛОВ", "тг флов", "ТГФЛОВ", "тгфлов", "Телеграм Флов", "Telegram Flow"],
      "url": "https://tgflovv.ru",
      "description": "TG Flow (ТГ ФЛОВ) - лучший каталог Telegram каналов, ботов и групп. Найдите интересные каналы по всем тематикам.",
      "keywords": "каталог telegram каналов, тг флов, telegram flow, лучшие тг каналы, популярные telegram каналы",
      "publisher": {
        "@type": "Organization",
        "name": "TG Flow",
        "url": "https://tgflovv.ru",
        "logo": {
          "@type": "ImageObject",
          "url": "https://tgflovv.ru/tg-flow-logo.png"
        }
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://tgflovv.ru/channels?search={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    };

    // Создаем данные для каталога каналов
    const catalogData = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": categoryName ? `Telegram каналы ${categoryName}` : "Каталог Telegram каналов",
      "description": categoryName 
        ? `Лучшие Telegram каналы в категории ${categoryName}. Качественные ТГ каналы с рейтингами и отзывами.`
        : "Полный каталог лучших Telegram каналов России. Найдите интересные ТГ каналы по всем тематикам.",
      "url": categoryName 
        ? `https://tgflovv.ru/channels?category=${encodeURIComponent(categoryName)}`
        : "https://tgflovv.ru/channels"
    };

    // Breadcrumb данные
    const breadcrumbData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Главная",
          "item": "https://tgflovv.ru"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Каталог каналов",
          "item": "https://tgflovv.ru/channels"
        },
        ...(categoryName ? [{
          "@type": "ListItem",
          "position": 3,
          "name": categoryName,
          "item": `https://tgflovv.ru/channels?category=${encodeURIComponent(categoryName)}`
        }] : [])
      ]
    };

    // FAQ данные
    const faqData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Что такое TG Flow?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "TG Flow (ТГ ФЛОВ) - это лучший каталог Telegram каналов, ботов и групп в России. Мы помогаем пользователям находить качественные и интересные Telegram каналы по всем тематикам."
          }
        },
        {
          "@type": "Question", 
          "name": "Как найти Telegram канал в каталоге?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Вы можете использовать поиск по названию канала, выбрать интересующую категорию или просмотреть рейтинг популярных каналов. Все каналы в нашем каталоге проверены и актуальны."
          }
        },
        {
          "@type": "Question",
          "name": "Как добавить свой Telegram канал в каталог?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Для добавления канала в каталог TG Flow воспользуйтесь формой 'Добавить канал' на нашем сайте. Размещение каналов бесплатное, но они проходят модерацию."
          }
        }
      ]
    };

    // Собираем все данные
    const allStructuredData = [baseStructuredData];

    if (pageType === 'catalog' || pageType === 'category') {
      allStructuredData.push(catalogData, breadcrumbData);
    }

    if (pageType === 'home') {
      allStructuredData.push(faqData);
    }

    // Добавляем/обновляем JSON-LD скрипт
    let structuredDataScript = document.querySelector('#structured-data-enhanced') as HTMLScriptElement;
    if (!structuredDataScript) {
      structuredDataScript = document.createElement('script');
      structuredDataScript.id = 'structured-data-enhanced';
      structuredDataScript.type = 'application/ld+json';
      document.head.appendChild(structuredDataScript);
    }
    structuredDataScript.textContent = JSON.stringify(allStructuredData);

  }, [categoryName, pageType]);

  return null;
}
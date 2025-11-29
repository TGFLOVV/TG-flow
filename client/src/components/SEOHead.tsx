import { useEffect } from 'react';

interface Channel {
  name: string;
  description?: string;
  category?: string;
}

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  channels?: Channel[];
  currentCategory?: string;
}

export default function SEOHead({ 
  title = "TG Flow - ТГ ФЛОВ | Каталог Telegram каналов | Лучшие ТГ каналы",
  description = "TG Flow (ТГ ФЛОВ) - лучший каталог Telegram каналов, ботов и групп. Найдите интересные каналы по всем тематикам. Бесплатное размещение.",
  keywords = "",
  canonicalUrl = "https://tgflovv.ru/",
  ogImage = "https://tgflovv.ru/og-image.svg",
  channels = [],
  currentCategory = ""
}: SEOHeadProps) {

  // Базовые ключевые слова
  const baseKeywords = [
    "тг флов", "tg flow", "тгфлов", "тг flow", "телеграм флов", "telegram flow",
    "каталог", "каталог тг", "telegram каналы", "тг каналы", "каталог telegram", 
    "каталог телеграм", "telegram catalog", "тг каталог", "лучшие тг каналы",
    "популярные telegram каналы", "каталог ботов telegram", "telegram боты", 
    "telegram группы", "каталог telegram каналов", "каталог тг каналов", 
    "telegram channels", "телеграм каналы", "телеграмм каналы", "телеграм",
    "telegram russia", "русские telegram каналы", "российские tg каналы",
    "список telegram каналов", "подборка telegram каналов", "рейтинг telegram каналов",
    "топ telegram каналов", "новые telegram каналы", "популярные каналы телеграм",
    "интересные тг каналы", "полезные telegram каналы", "качественные tg каналы",
    "проверенные telegram каналы", "telegram channels russia", "каналы телеграм бесплатно",
    "добавить канал в каталог", "разместить канал telegram", "продвижение telegram канала",
    "реклама telegram канала", "telegram канал новости", "telegram канал бизнес",
    "найти telegram канал", "поиск telegram каналов", "подписаться telegram",
    "telegram канал технологии", "telegram канал развлечения", "telegram канал спорт",
    "telegram канал музыка", "telegram канал фильмы", "telegram канал игры",
    "telegram канал криптовалюты", "telegram канал инвестиции", "telegram канал финансы",
    "telegram канал образование", "telegram канал психология", "telegram канал здоровье",
    "telegram канал мода", "telegram канал красота", "telegram канал путешествия",
    "telegram канал кулинария", "telegram канал искусство", "telegram канал дизайн",
    "telegram канал программирование", "telegram канал маркетинг", "telegram канал стартапы",
    "telegram канал работа", "telegram канал карьера", "telegram канал саморазвитие",
    "telegram канал мотивация", "telegram канал юмор", "telegram канал мемы",
    "telegram канал политика", "telegram канал общество", "telegram канал культура",
    "telegram канал наука", "telegram канал экология", "telegram канал автомобили",
    "telegram канал недвижимость", "telegram канал строительство", "telegram канал ремонт",
    "лучшие каналы telegram", "топовые тг каналы", "крутые telegram каналы",
    "интересные телеграм каналы", "полезные тг каналы", "популярные телеграм каналы",
    "качественные telegram каналы", "проверенные тг каналы", "рекомендуемые telegram каналы",
    "telegram каналы 2025", "новые тг каналы 2025", "лучшие telegram каналы 2025",
    "русскоязычные telegram каналы", "российские телеграм каналы", "каналы telegram россия",
    "telegram каналы москва", "telegram каналы спб", "telegram каналы украина",
    "telegram каналы беларусь", "telegram каналы казахстан", "telegram каналы снг"
  ];

  // Генерируем ключевые слова на основе каналов
  const generateChannelKeywords = () => {
    if (!channels || channels.length === 0) return [];

    const channelKeywords: string[] = [];

    channels.forEach(channel => {
      if (channel.name) {
        // Добавляем название канала с различными комбинациями
        const channelName = channel.name.toLowerCase().replace(/[^а-яё\w\s]/gi, '');
        channelKeywords.push(
          `${channelName} telegram`,
          `${channelName} тг`,
          `${channelName} канал`,
          `${channelName} telegram канал`,
          `${channelName} тг канал`,
          `найти ${channelName}`,
          `подписаться ${channelName}`,
          `${channelName} ссылка`,
          `${channelName} телеграм`,
          `${channelName} телеграмм`,
          `канал ${channelName}`,
          `тг ${channelName}`,
          `telegram ${channelName}`
        );

        // Добавляем категорию канала если есть
        if (channel.category) {
          const category = channel.category.toLowerCase();
          channelKeywords.push(
            `${channelName} ${category}`,
            `${category} ${channelName}`,
            `telegram ${category} ${channelName}`,
            `тг ${category} ${channelName}`,
            `${channelName} канал ${category}`,
            `${category} telegram канал ${channelName}`
          );
        }

        // Добавляем ключевые слова на основе описания
        if (channel.description) {
          const descWords = channel.description.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3);

          descWords.forEach(word => {
            channelKeywords.push(
              `${word} telegram`,
              `${word} тг канал`,
              `${word} телеграм`,
              `${channelName} ${word}`,
              `telegram ${word}`,
              `каналы ${word}`,
              `тг ${word}`
            );
          });
        }
      }
    });

    return [...new Set(channelKeywords)]; // Убираем дубликаты
  };

  // Генерируем ключевые слова для текущей категории
  const generateCategoryKeywords = () => {
    if (!currentCategory) return [];

    const category = currentCategory.toLowerCase();
    return [
      `telegram каналы ${category}`,
      `тг каналы ${category}`,
      `${category} telegram`,
      `${category} тг`,
      `${category} телеграм`,
      `${category} телеграмм`,
      `каталог ${category}`,
      `лучшие ${category} telegram`,
      `топ ${category} тг`,
      `популярные ${category} telegram`,
      `интересные ${category} тг`,
      `полезные ${category} telegram`,
      `качественные ${category} тг`,
      `${category} каналы telegram`,
      `${category} каналы тг`,
      `найти ${category} telegram`,
      `подборка ${category} тг`,
      `список ${category} telegram`,
      `рейтинг ${category} тг`
    ];
  };

  // Объединяем все ключевые слова
  const allKeywords = [
    ...baseKeywords,
    ...generateChannelKeywords(),
    ...generateCategoryKeywords(),
    ...(keywords ? keywords.split(', ') : [])
  ];

  const finalKeywords = [...new Set(allKeywords)].join(', ');

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "TG Flow - Каталог Telegram каналов",
    "url": "https://tgflovv.ru",
    "description": description,
    "publisher": {
      "@type": "Organization",
      "name": "TG Flow",
      "url": "https://tgflovv.ru"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://tgflovv.ru/channels?search={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "sameAs": [
      "https://tgflovv.ru/channels",
      "https://tgflovv.ru/sitemap.xml"
    ]
  };

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
      }
    ]
  };

  useEffect(() => {
    // Обновляем title
    document.title = title;

    // Обновляем meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }

    // Keywords meta tag is no longer used by search engines
    // Removed obsolete keywords meta tag

    // Обновляем canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // Обновляем Open Graph мета-теги
    const updateOGMeta = (property: string, content: string) => {
      let ogMeta = document.querySelector(`meta[property="${property}"]`);
      if (!ogMeta) {
        ogMeta = document.createElement('meta');
        ogMeta.setAttribute('property', property);
        document.head.appendChild(ogMeta);
      }
      ogMeta.setAttribute('content', content);
    };

    updateOGMeta('og:title', title);
    updateOGMeta('og:description', description);
    updateOGMeta('og:url', canonicalUrl);
    updateOGMeta('og:image', ogImage);

    // Обновляем Twitter мета-теги
    const updateTwitterMeta = (name: string, content: string) => {
      let twitterMeta = document.querySelector(`meta[property="twitter:${name}"]`);
      if (!twitterMeta) {
        twitterMeta = document.createElement('meta');
        twitterMeta.setAttribute('property', `twitter:${name}`);
        document.head.appendChild(twitterMeta);
      }
      twitterMeta.setAttribute('content', content);
    };

    updateTwitterMeta('title', title);
    updateTwitterMeta('description', description);
    updateTwitterMeta('url', canonicalUrl);
    updateTwitterMeta('image', ogImage);

    // Добавляем структурированные данные JSON-LD
    let structuredDataScript = document.querySelector('#structured-data') as HTMLScriptElement;
    if (!structuredDataScript) {
      structuredDataScript = document.createElement('script');
      structuredDataScript.id = 'structured-data';
      structuredDataScript.type = 'application/ld+json';
      document.head.appendChild(structuredDataScript);
    }
    structuredDataScript.textContent = JSON.stringify([structuredData, breadcrumbData]);

    // Добавляем дополнительные SEO мета-теги
    const additionalMetas = [
      { name: 'author', content: 'TG Flow' },
      { name: 'publisher', content: 'TG Flow' },
      { name: 'copyright', content: '© 2025 TG Flow. Все права защищены.' },
      { name: 'language', content: 'ru' },
      { name: 'geo.region', content: 'RU' },
      { name: 'geo.country', content: 'Russia' },
      { name: 'ICBM', content: '55.7558, 37.6173' },
      { name: 'geo.position', content: '55.7558;37.6173' },
      { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
      { name: 'googlebot', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
      { name: 'bingbot', content: 'index, follow' },
      { name: 'yandex', content: 'index, follow' },
      { name: 'rating', content: 'general' },
      { name: 'distribution', content: 'global' },
      { name: 'revisit-after', content: '1 days' },
      { name: 'expires', content: 'never' },
      { name: 'format-detection', content: 'telephone=no' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'theme-color', content: '#8B5CF6' },
      { name: 'msapplication-TileColor', content: '#8B5CF6' },
      { name: 'application-name', content: 'TG Flow' },
      { name: 'msapplication-tooltip', content: 'Каталог Telegram каналов' },
      { name: 'msapplication-starturl', content: 'https://tgflovv.ru/' },
      { name: 'msapplication-task', content: 'name=Каталог каналов; action-uri=https://tgflovv.ru/channels; icon-uri=https://tgflovv.ru/favicon.ico' }
    ];

    additionalMetas.forEach(({ name, content }) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    });

  }, [title, description, keywords, canonicalUrl, ogImage, structuredData, breadcrumbData]);

  return null; // Компонент не рендерит ничего видимого
}

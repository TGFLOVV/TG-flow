
import React from 'react';

interface HiddenSEOKeywordsProps {
  currentCategory?: string;
  additionalKeywords?: string[];
}

export default function HiddenSEOKeywords({ currentCategory, additionalKeywords = [] }: HiddenSEOKeywordsProps) {
  // Ensure currentCategory is always a string
  const categoryName = typeof currentCategory === 'string' ? currentCategory : String(currentCategory || '');

  // Огромный список SEO ключевых слов
  const seoKeywords = [
    // Основные брендовые запросы
    "тг флов", "tg flow", "тгфлов", "тг flow", "телеграм флов", "telegram flow",
    "тгфловв", "тг фловв", "tgflovv", "тг флоу", "telegram флов", "телеграм флоу",

    // Каталоги и директории
    "каталог", "каталог тг", "каталог telegram", "каталог телеграм", "telegram catalog",
    "тг каталог", "directory telegram", "справочник telegram", "список telegram",
    "каталог telegram каналов", "каталог тг каналов", "полный каталог telegram",
    "большой каталог тг", "огромный каталог telegram", "весь каталог тг",

    // Поиск каналов
    "telegram каналы", "тг каналы", "телеграм каналы", "телеграмм каналы",
    "telegram channels", "найти telegram канал", "поиск telegram каналов",
    "подборка telegram каналов", "рейтинг telegram каналов", "топ telegram каналов",
    "список telegram каналов", "все telegram каналы", "лучшие telegram каналы",

    // Качество и популярность
    "лучшие тг каналы", "популярные telegram каналы", "качественные tg каналы",
    "проверенные telegram каналы", "интересные тг каналы", "полезные telegram каналы",
    "крутые telegram каналы", "топовые тг каналы", "рекомендуемые telegram каналы",
    "отличные telegram каналы", "превосходные тг каналы", "замечательные telegram каналы",

    // Географические запросы
    "telegram russia", "русские telegram каналы", "российские tg каналы",
    "telegram channels russia", "каналы телеграм россия", "тг каналы россия",
    "telegram каналы москва", "telegram каналы спб", "russian telegram channels",
    "telegram каналы украина", "telegram каналы беларусь", "telegram каналы казахстан",

    // Типы контента
    "telegram боты", "telegram группы", "каталог ботов telegram", "telegram bots",
    "telegram groups", "telegram channels list", "телеграм боты", "телеграм группы",
    "список telegram ботов", "каталог telegram групп", "рейтинг telegram ботов",

    // Размещение и продвижение
    "добавить канал в каталог", "разместить канал telegram", "продвижение telegram канала",
    "реклама telegram канала", "каналы телеграм бесплатно", "бесплатное размещение",
    "добавить в каталог telegram", "опубликовать telegram канал", "зарегистрировать канал",

    // Тематические категории - Новости
    "telegram канал новости", "тг новости", "новости telegram", "новостные telegram каналы",
    "лучшие новости telegram", "актуальные новости тг", "свежие новости telegram",
    "политические новости telegram", "экономические новости тг", "спортивные новости telegram",

    // Тематические категории - Бизнес
    "telegram канал бизнес", "бизнес telegram", "предпринимательство telegram",
    "стартапы telegram", "бизнес идеи telegram", "заработок telegram", "инвестиции telegram",
    "трейдинг telegram", "forex telegram", "криптовалюты telegram", "биткоин telegram",

    // Тематические категории - Технологии
    "telegram канал технологии", "it telegram", "программирование telegram",
    "разработка telegram", "веб разработка telegram", "python telegram", "javascript telegram",
    "react telegram", "node.js telegram", "backend telegram", "frontend telegram",

    // Тематические категории - Развлечения
    "telegram канал развлечения", "юмор telegram", "мемы telegram", "приколы telegram",
    "смешные telegram", "развлекательные telegram", "комедия telegram", "анекдоты telegram",
    "забавные telegram", "веселые telegram", "шутки telegram", "юмористические telegram",

    // Тематические категории - Спорт
    "telegram канал спорт", "спорт telegram", "футбол telegram", "хоккей telegram",
    "баскетбол telegram", "теннис telegram", "бокс telegram", "mma telegram",
    "спортивные новости telegram", "результаты матчей telegram", "ставки на спорт telegram",

    // Тематические категории - Музыка
    "telegram канал музыка", "музыка telegram", "песни telegram", "новинки музыки telegram",
    "классическая музыка telegram", "рок музыка telegram", "поп музыка telegram",
    "рэп музыка telegram", "электронная музыка telegram", "джаз telegram",

    // Тематические категории - Фильмы
    "telegram канал фильмы", "кино telegram", "сериалы telegram", "новинки кино telegram",
    "трейлеры telegram", "обзоры фильмов telegram", "рецензии кино telegram",
    "голливудские фильмы telegram", "российские фильмы telegram", "документальные фильмы telegram",

    // Тематические категории - Игры
    "telegram канал игры", "игры telegram", "компьютерные игры telegram",
    "мобильные игры telegram", "новинки игр telegram", "обзоры игр telegram",
    "геймерские telegram", "киберспорт telegram", "стримы telegram", "геймплей telegram",

    // Тематические категории - Образование
    "telegram канал образование", "обучение telegram", "курсы telegram", "уроки telegram",
    "учеба telegram", "знания telegram", "образовательные telegram", "самообразование telegram",
    "университет telegram", "школа telegram", "экзамены telegram", "студенческие telegram",

    // Тематические категории - Здоровье
    "telegram канал здоровье", "медицина telegram", "здоровый образ жизни telegram",
    "фитнес telegram", "спорт zal telegram", "диеты telegram", "питание telegram",
    "похудение telegram", "тренировки telegram", "йога telegram", "медитация telegram",

    // Тематические категории - Психология
    "telegram канал психология", "психология telegram", "саморазвитие telegram",
    "мотивация telegram", "личностный рост telegram", "отношения telegram",
    "семейная психология telegram", "детская психология telegram", "психотерапия telegram",

    // Тематические категории - Мода и красота
    "telegram канал мода", "мода telegram", "стиль telegram", "красота telegram",
    "макияж telegram", "прически telegram", "одежда telegram", "аксессуары telegram",
    "fashion telegram", "beauty telegram", "косметика telegram", "уход за кожей telegram",

    // Тематические категории - Путешествия
    "telegram канал путешествия", "путешествия telegram", "туризм telegram",
    "отдых telegram", "отпуск telegram", "страны telegram", "города telegram",
    "авиабилеты telegram", "отели telegram", "гиды telegram", "экскурсии telegram",

    // Тематические категории - Кулинария
    "telegram канал кулинария", "рецепты telegram", "готовка telegram", "еда telegram",
    "кухня telegram", "выпечка telegram", "десерты telegram", "напитки telegram",
    "диетические рецепты telegram", "быстрые рецепты telegram", "праздничные блюда telegram",

    // Тематические категории - Искусство
    "telegram канал искусство", "искусство telegram", "живопись telegram",
    "скульптура telegram", "фотография telegram", "дизайн telegram", "архитектура telegram",
    "графика telegram", "художники telegram", "галереи telegram", "выставки telegram",

    // Тематические категории - Наука
    "telegram канал наука", "наука telegram", "физика telegram", "химия telegram",
    "биология telegram", "математика telegram", "астрономия telegram", "геология telegram",
    "научные открытия telegram", "исследования telegram", "эксперименты telegram",

    // Тематические категории - Автомобили
    "telegram канал автомобили", "авто telegram", "машины telegram", "автомобильные telegram",
    "тест драйвы telegram", "обзоры авто telegram", "автоновости telegram",
    "ремонт авто telegram", "тюнинг telegram", "автоспорт telegram", "мотоциклы telegram",

    // Тематические категории - Недвижимость
    "telegram канал недвижимость", "недвижимость telegram", "квартиры telegram",
    "дома telegram", "аренда telegram", "покупка жилья telegram", "строительство telegram",
    "ремонт telegram", "дизайн интерьера telegram", "архитектура telegram",

    // Временные маркеры
    "telegram каналы 2025", "новые тг каналы 2025", "лучшие telegram каналы 2025",
    "актуальные telegram каналы", "свежие тг каналы", "недавно добавленные telegram",
    "современные telegram каналы", "трендовые тг каналы", "популярные telegram 2025",

    // Альтернативные написания
    "телеграм", "телеграмм", "телега", "тг", "тэг", "telegram", "telegramm",
    "телеграм канал", "телеграмм канал", "телега канал", "тг канал", "тэг канал",

    // Действия пользователей
    "подписаться telegram", "присоединиться telegram", "войти в telegram канал",
    "telegram ссылки", "telegram links", "telegram channel links", "ссылки на telegram",
    "открыть telegram канал", "перейти в telegram", "скачать telegram", "установить telegram",

    // Качественные характеристики
    "качественные telegram каналы", "проверенные тг каналы", "надежные telegram каналы",
    "безопасные тг каналы", "официальные telegram каналы", "верифицированные тг каналы",
    "авторитетные telegram каналы", "известные тг каналы", "знаменитые telegram каналы",

    // Размер и охват
    "большие telegram каналы", "популярные тг каналы", "массовые telegram каналы",
    "многочисленные тг каналы", "крупные telegram каналы", "обширные тг каналы",
    "широкие telegram каналы", "громадные тг каналы", "значительные telegram каналы",

    // Специфические поисковые запросы
    "как найти telegram канал", "где найти тг каналы", "поиск telegram каналов",
    "поиск тг каналов", "найти интересные telegram", "найти полезные тг",
    "подборка telegram каналов", "коллекция тг каналов", "собрание telegram каналов",

    // Региональные запросы
    "telegram каналы снг", "telegram каналы постсоветские", "telegram каналы восточная европа",
    "telegram каналы центральная азия", "telegram каналы кавказ", "telegram каналы прибалтика",
    "telegram каналы дальний восток", "telegram каналы сибирь", "telegram каналы урал",

    // Профессиональные сферы
    "telegram каналы врачи", "telegram каналы учителя", "telegram каналы программисты",
    "telegram каналы дизайнеры", "telegram каналы маркетологи", "telegram каналы юристы",
    "telegram каналы бухгалтеры", "telegram каналы инженеры", "telegram каналы архитекторы",

    // Хобби и увлечения
    "telegram каналы рукоделие", "telegram каналы садоводство", "telegram каналы рыбалка",
    "telegram каналы охота", "telegram каналы коллекционирование", "telegram каналы фотография",
    "telegram каналы чтение", "telegram каналы письмо", "telegram каналы танцы",

    // Возрастные группы
    "telegram каналы для детей", "telegram каналы для подростков", "telegram каналы для взрослых",
    "telegram каналы для пожилых", "telegram каналы семейные", "telegram каналы родительские",
    "telegram каналы студенческие", "telegram каналы школьные", "telegram каналы детские",

    // Специальные предложения
    "бесплатные telegram каналы", "платные telegram каналы", "премиум telegram каналы",
    "vip telegram каналы", "эксклюзивные telegram каналы", "закрытые telegram каналы",
    "приватные telegram каналы", "открытые telegram каналы", "публичные telegram каналы"
  ];

  // Добавляем ключевые слова для категории
  const categoryKeywords = categoryName ? [
    `telegram каналы ${categoryName}`,
    `тг каналы ${categoryName}`,
    `${categoryName} telegram`,
    `${categoryName} тг`,
    `${categoryName} телеграм`,
    `${categoryName} телеграмм`,
    `каталог ${categoryName}`,
    `каталог telegram ${categoryName}`,
    `каталог тг ${categoryName}`,
    `лучшие ${categoryName} telegram`,
    `топ ${categoryName} тг`,
    `популярные ${categoryName} telegram`,
    `интересные ${categoryName} тг`,
    `полезные ${categoryName} telegram`,
    `качественные ${categoryName} тг`,
    `${categoryName} каналы telegram`,
    `${categoryName} каналы тг`,
    `найти ${categoryName} telegram`,
    `найти ${categoryName} каналы`,
    `подборка ${categoryName} тг`,
    `список ${categoryName} telegram`,
    `рейтинг ${categoryName} тг`,
    `топ ${categoryName} telegram каналов`,
    `лучшие ${categoryName} тг каналы`,
    `${categoryName} telegram channels`,
    `${categoryName} в telegram`,
    `${categoryName} в тг`,
    `telegram для ${categoryName}`,
    `тг для ${categoryName}`,
    `${categoryName} контент telegram`
  ] : [];

  // Объединяем все ключевые слова
  const allKeywords = [
    ...seoKeywords,
    ...categoryKeywords,
    ...additionalKeywords
  ];

  // Убираем дубликаты
  const uniqueKeywords = [...new Set(allKeywords)]
    .filter(keyword => keyword && keyword.trim().length > 0)
    .sort()
    .join(', ');

  return (
    <div 
      style={{ 
        display: 'none',
        visibility: 'hidden',
        position: 'absolute',
        left: '-9999px',
        width: '1px',
        height: '1px',
        overflow: 'hidden'
      }}
      aria-hidden="true"
    >
      {/* Скрытый блок для поисковых систем */}
      <span>{uniqueKeywords}</span>

      {/* Дополнительные скрытые мета-данные */}
      <div>
        <h1>Каталог Telegram каналов - Лучшие ТГ каналы России</h1>
        <h2>Найдите лучшие Telegram каналы по всем тематикам</h2>
        <h3>TG Flow - самый полный каталог Telegram каналов</h3>

        {categoryName && (
          <>
            <h2>Telegram каналы {categoryName}</h2>
            <h3>Лучшие {categoryName} каналы в Telegram</h3>
            <h4>Топ {categoryName} ТГ каналы</h4>
          </>
        )}

        <p>
          Каталог Telegram каналов TG Flow предоставляет доступ к лучшим ТГ каналам России.
          Найдите интересные Telegram каналы по всем тематикам: новости, бизнес, технологии,
          развлечения, образование и многое другое. Наш каталог содержит только проверенные
          и качественные Telegram каналы с актуальным контентом.
        </p>
      </div>
    </div>
  );
}

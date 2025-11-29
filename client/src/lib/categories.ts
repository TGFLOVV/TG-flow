
export const categoryIcons: { [key: string]: string } = {
  // Основные категории
  "Музыка": "fas fa-music",
  "Видеоигры": "fas fa-gamepad",
  "Фитнес": "fas fa-dumbbell",
  "Программирование": "fas fa-code",
  "Кино": "fas fa-film",
  "Автомобили": "fas fa-car",
  "18+ (для взрослых, кровь, насилие)": "fas fa-exclamation-triangle",
  "Путешествия": "fas fa-plane",
  "Игры": "fas fa-dice",
  "Маркетинг": "fas fa-bullhorn",
  "Косметика": "fas fa-spa",
  "Футбол": "fas fa-futbol",
  "Гаджеты": "fas fa-mobile-alt",
  "Туризм": "fas fa-map-marked-alt",
  "Боевые искусства": "fas fa-fist-raised",
  "Финансы": "fas fa-coins",
  "Юмор": "fas fa-laugh",
  "Университеты": "fas fa-graduation-cap",
  "Мотоциклы": "fas fa-motorcycle",
  "Искусственный интеллект": "fas fa-robot",
  "Стиль": "fas fa-gem",
  "Стартапы": "fas fa-rocket",
  "18+ (Для взрослых, эротика)": "fas fa-heart",
  "Курсы": "fas fa-chalkboard-teacher",
  "Тюнинг": "fas fa-wrench",
  "Страны": "fas fa-globe-americas",
  "Хобби": "fas fa-puzzle-piece",
  "Танцы": "fas fa-dance",
  "Фотография": "fas fa-camera",
  "Кулинария": "fas fa-utensils",
  "Наука": "fas fa-atom",
  "Литература": "fas fa-book",
  "Велоспорт": "fas fa-bicycle",
  "Дизайн": "fas fa-palette",
  "Экология": "fas fa-leaf",
  "Театр": "fas fa-theater-masks",
  "Школы": "fas fa-school",
  "Живопись": "fas fa-paint-brush",
  "Спорт": "fas fa-trophy",
  "Кибербезопасность": "fas fa-shield-alt",
  "Медитация": "fas fa-om",
  "История": "fas fa-landmark",
  "Садоводство": "fas fa-seedling",
  "Анимация": "fas fa-play-circle",
  "Психология": "fas fa-brain",
  "AT Разработка": "fas fa-laptop-code",
  "Серфинг": "fas fa-water",
  "Мода": "fas fa-tshirt",
  "Подкасты": "fas fa-microphone",
  
  // Алиасы для обратной совместимости
  "Для взрослых": "fas fa-exclamation-triangle",
  "18+ (взрослый контент)": "fas fa-exclamation-triangle",
  "18+ (эротика)": "fas fa-heart",
  "IT Разработка": "fas fa-laptop-code"
};

// Функция для получения иконки по названию категории
export function getCategoryIcon(categoryName: string): string {
  return categoryIcons[categoryName] || "fas fa-folder";
}

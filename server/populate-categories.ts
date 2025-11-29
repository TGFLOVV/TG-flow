import { db } from "./db";
import { categories } from "@shared/schema";

const categoriesToInsert = [
  { name: "Разработка", icon: "fas fa-code", isAdult: false, price: "30.00" },
  { name: "Автомобили", icon: "fas fa-car", isAdult: false, price: "30.00" },
  { name: "Анимация", icon: "fas fa-film", isAdult: false, price: "30.00" },
  { name: "Боевые искусства", icon: "fas fa-fist-raised", isAdult: false, price: "30.00" },
  { name: "Велоспорт", icon: "fas fa-bicycle", isAdult: false, price: "30.00" },
  { name: "Гаджеты", icon: "fas fa-mobile-alt", isAdult: false, price: "30.00" },
  { name: "Дизайн", icon: "fas fa-palette", isAdult: false, price: "30.00" },
  { name: "Для взрослых", icon: "fas fa-user-secret", isAdult: true, price: "60.00" },
  { name: "Живопись", icon: "fas fa-paint-brush", isAdult: false, price: "30.00" },
  { name: "Игры", icon: "fas fa-gamepad", isAdult: false, price: "30.00" },
  { name: "Искусственный интеллект", icon: "fas fa-robot", isAdult: false, price: "30.00" },
  { name: "История", icon: "fas fa-landmark", isAdult: false, price: "30.00" },
  { name: "Кино", icon: "fas fa-video", isAdult: false, price: "30.00" },
  { name: "Косметика", icon: "fas fa-spa", isAdult: false, price: "30.00" },
  { name: "Кулинария", icon: "fas fa-utensils", isAdult: false, price: "30.00" },
  { name: "Курсы", icon: "fas fa-graduation-cap", isAdult: false, price: "30.00" },
  { name: "Литература", icon: "fas fa-book", isAdult: false, price: "30.00" },
  { name: "Маркетинг", icon: "fas fa-chart-line", isAdult: false, price: "30.00" },
  { name: "Медитация", icon: "fas fa-om", isAdult: false, price: "30.00" },
  { name: "Мода", icon: "fas fa-tshirt", isAdult: false, price: "30.00" },
  { name: "Мотоциклы", icon: "fas fa-motorcycle", isAdult: false, price: "30.00" },
  { name: "Музыка", icon: "fas fa-music", isAdult: false, price: "30.00" },
  { name: "Наука", icon: "fas fa-flask", isAdult: false, price: "30.00" },
  { name: "Подкасты", icon: "fas fa-podcast", isAdult: false, price: "30.00" },
  { name: "Программирование", icon: "fas fa-laptop-code", isAdult: false, price: "30.00" },
  { name: "Психология", icon: "fas fa-brain", isAdult: false, price: "30.00" },
  { name: "Путешествия", icon: "fas fa-plane", isAdult: false, price: "30.00" },
  { name: "Садоводство", icon: "fas fa-seedling", isAdult: false, price: "30.00" },
  { name: "Серфинг", icon: "fas fa-water", isAdult: false, price: "30.00" },
  { name: "Спорт", icon: "fas fa-running", isAdult: false, price: "30.00" },
  { name: "Стартапы", icon: "fas fa-rocket", isAdult: false, price: "30.00" },
  { name: "Стиль", icon: "fas fa-gem", isAdult: false, price: "30.00" },
  { name: "Танцы", icon: "fas fa-music", isAdult: false, price: "30.00" },
  { name: "Театр", icon: "fas fa-theater-masks", isAdult: false, price: "30.00" },
  { name: "Туризм", icon: "fas fa-map-marked-alt", isAdult: false, price: "30.00" },
  { name: "Тюнинг", icon: "fas fa-tools", isAdult: false, price: "30.00" },
  { name: "Университеты", icon: "fas fa-university", isAdult: false, price: "30.00" },
  { name: "Фитнес", icon: "fas fa-dumbbell", isAdult: false, price: "30.00" },
  { name: "Фотография", icon: "fas fa-camera", isAdult: false, price: "30.00" },
  { name: "Футбол", icon: "fas fa-futbol", isAdult: false, price: "30.00" },
  { name: "Хобби", icon: "fas fa-puzzle-piece", isAdult: false, price: "30.00" },
  { name: "Школы", icon: "fas fa-school", isAdult: false, price: "30.00" },
  { name: "Экология", icon: "fas fa-leaf", isAdult: false, price: "30.00" }
];

async function populateCategories() {
  try {
    console.log("Populating categories...");
    
    // Clear existing categories
    await db.delete(categories);
    
    // Insert new categories
    const result = await db.insert(categories).values(categoriesToInsert).returning();
    
    console.log(`Successfully inserted ${result.length} categories`);
    process.exit(0);
  } catch (error) {
    console.error("Error populating categories:", error);
    process.exit(1);
  }
}

populateCategories();
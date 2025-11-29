// Конфигурация приложения
// Все настройки заданы прямо в файле

interface Config {
  DATABASE_URL: string;
  SESSION_SECRET: string;
  EMAIL_FROM: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_WEBHOOK_SECRET: string;
  CLOUDPAYMENTS_PUBLIC_ID: string;
  CLOUDPAYMENTS_API_SECRET: string;
  ROBOKASSA_MERCHANT_LOGIN: string;
  ROBOKASSA_PASSWORD_1: string;
  ROBOKASSA_PASSWORD_2: string;
  NODE_ENV: string;
  PORT: number;
  BASE_URL: string;
  RATE_LIMIT_WINDOW: number;
  RATE_LIMIT_MAX: number;
  JWT_SECRET: string;
  MAX_FILE_SIZE: number;
  UPLOAD_DIR: string;
  LOG_LEVEL: string;
  DOMAIN: string;
  COOKIE_DOMAIN: string;
}

const config: Config = {
  // База данных - используем переменную окружения для production
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:CqDfxZEuOLtVUIlnlXYjnBggxbDWIZrv@shuttle.proxy.rlwy.net:17532/railway",
  
  // Сессии
  SESSION_SECRET: process.env.SESSION_SECRET || "89Gw9rR63QesoLxVe21MXtIR2A98d/uiICzv8NbNB+2NDVyEi8+37iVrfGDITWu8oONKUp9woVyLHnpuVY2RWQ==",
  
  // Email настройки
  EMAIL_FROM: process.env.EMAIL_FROM || "TGFLOVV@gmail.com", 
  SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587"),
  SMTP_USER: process.env.SMTP_USER || "TGFLOVV@gmail.com",
  SMTP_PASS: process.env.SMTP_PASS || "lnnrotgbcnozxdvq",
  
  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "550206396432-7clp0du2923b5ca9sl7stmi1tidmslq6.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "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",
  
  // Telegram Bot
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "7971098423:AAFCpOBcuSedFjyXVgoBiIKfEt_FmHgJcE0",
  TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET || "tgflow-webhook-secret-2025",
  
  // CloudPayments
  CLOUDPAYMENTS_PUBLIC_ID: process.env.CLOUDPAYMENTS_PUBLIC_ID || "pk_6b01e3b9a2aa81209040e70c133c0",
  CLOUDPAYMENTS_API_SECRET: process.env.CLOUDPAYMENTS_API_SECRET || "b5082574b961ad556428654bcf49d8de",
  
  // ROBOKASSA
  ROBOKASSA_MERCHANT_LOGIN: process.env.ROBOKASSA_MERCHANT_LOGIN || "TGFLOVVru",
  ROBOKASSA_PASSWORD_1: process.env.ROBOKASSA_PASSWORD_1 || "Maga2192242",
  ROBOKASSA_PASSWORD_2: process.env.ROBOKASSA_PASSWORD_2 || "Maga2192242_",
  
  // Общие настройки
  NODE_ENV: process.env.NODE_ENV || "production",
  PORT: parseInt(process.env.PORT || "3000"),
  BASE_URL: process.env.BASE_URL || "https://www.tgflovv.ru",
  
  // Настройки безопасности
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || "900000"), // 15 минут
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || "100"), // Максимум запросов за окно
  
  // JWT для API
  JWT_SECRET: process.env.JWT_SECRET || "tgflow-jwt-secret-2025",
  
  // Настройки файлов
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || "5242880"), // 5MB
  UPLOAD_DIR: process.env.UPLOAD_DIR || "./uploads",
  
  // Логирование
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  
  // Домен
  DOMAIN: process.env.DOMAIN || "tgflovv.ru",
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || ".tgflovv.ru"
};

export default config;

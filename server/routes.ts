import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import appConfig from "../config";
import { setupAuth, isAuthenticated as authIsAuthenticated, comparePasswords } from "./auth";
import { categories, channels, payments, ratings, channelApplications, users, insertCategorySchema, insertChannelApplicationSchema } from "@shared/schema";
import { nanoid } from "nanoid";
import { db } from "./db";
import { eq, desc, and, isNull, sql, or, asc, count, gt, gte, lte, lt, inArray, ilike } from "drizzle-orm";
import { z } from "zod";
import { emitToAll, emitToRole } from "./websocket";
import { handleTelegramWebhook, validateAuthToken, setWebhook, getWebhookInfo } from "./telegram-bot";
import { createPaymentUrl, verifyPaymentResult, generateInvoiceId } from "./robokassa";
import passport from "passport";
import crypto from "crypto";
import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";

// Storage configuration
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './client/public/uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: multerStorage });

// Function to update subscriber counts for all channels
async function updateAllChannelSubscribers(): Promise<void> {
  try {
    // Get all approved channels
    const channels = await storage.getChannels(1000); // Get up to 1000 channels

    let updated = 0;
    let errors = 0;

    for (const channel of channels) {
      try {
        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay

        const subscriberCount = await parseSubscriberCount(channel.username);

        if (subscriberCount > 0 && subscriberCount !== channel.subscriberCount) {
          await storage.updateChannel(channel.id, { subscriberCount });

          updated++;
        }
      } catch (error) {
        console.error(`❌ Error updating ${channel.username}:`, error);
        errors++;
      }
    }

    console.log(`📈 Subscriber count update completed: ${updated} updated, ${errors} errors`);
  } catch (error) {
    console.error('❌ Error in updateAllChannelSubscribers:', error);
  }
}

// Function to parse subscriber count from Telegram public page
async function parseSubscriberCount(username: string): Promise<number> {
  try {
    const url = `https://t.me/${username}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.log(`❌ Failed to fetch page: ${response.status}`);
      return 0;
    }

    const html = await response.text();

    // Look for subscriber count patterns in the HTML
    const patterns = [
      /(\d+(?:\s*\d+)*)\s*подписчик/i,
      /(\d+(?:\s*\d+)*)\s*subscribers?/i,
      /(\d+(?:\s*\d+)*)\s*members?/i,
      /(\d+(?:\s*\d+)*)\s*участник/i,
      /"extra":"(\d+(?:\s*\d+)*)\s*подписчик/i,
      /"extra":"(\d+(?:\s*\d+)*)\s*subscribers?/i
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        // Clean up the number (remove spaces, convert K/M notation)
        let countStr = match[1].replace(/\s+/g, '');

        // Handle K/M notation
        if (countStr.includes('K') || countStr.includes('к')) {
          countStr = countStr.replace(/[Kк]/i, '');
          const num = parseFloat(countStr);
          if (!isNaN(num)) {
            const result = Math.round(num * 1000);
            return result;
          }
        } else if (countStr.includes('M') || countStr.includes('м')) {
          countStr = countStr.replace(/[Mм]/i, '');
          const num = parseFloat(countStr);
          if (!isNaN(num)) {
            const result = Math.round(num * 1000000);
            return result;
          }
        } else {
          const num = parseInt(countStr);
          if (!isNaN(num)) {
            return num;
          }
        }
      }
    }

    console.log(`⚠️ No subscriber count found for ${username}`);
    return 0;
  } catch (error) {
    console.error(`❌ Error parsing subscriber count for ${username}:`, error);
    return 0;
  }
}

// Middleware to protect routes
export function isAuthenticated(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Проверяем статус пользователя
  if (req.user && req.user.status === 'blocked') {
    return res.status(403).json({ message: "Account is blocked" });
  }

  next();
}

// Middleware для админских маршрутов
export function isAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
}

// Middleware для модераторов и админов
export function isModerator(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!req.user || !['admin', 'moderator'].includes(req.user.role)) {
    return res.status(403).json({ message: "Moderator access required" });
  }

  next();
}

export async function registerRoutes(app: Express, upload?: any): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Отдельный endpoint для получения аватара (должен быть ПЕРЕД /api/user)
  app.get('/api/user/avatar', isAuthenticated, async (req: any, res) => {
    try {
      const sessionUser = req.user;
      const fullUser = await storage.getUser(sessionUser.id);

      if (!fullUser?.profileImageUrl) {
        return res.status(404).json({ message: "Avatar not found" });
      }

      // Извлекаем MIME type и данные из base64 строки
      const match = fullUser.profileImageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        return res.status(400).json({ message: "Invalid avatar format" });
      }

      const mimeType = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');

      res.set({
        'Content-Type': mimeType,
        'Content-Length': buffer.length,
        'Cache-Control': 'public, max-age=3600'
      });

      res.send(buffer);
    } catch (error) {
      console.error("Error fetching avatar:", error);
      res.status(500).json({ message: "Failed to fetch avatar" });
    }
  });

  // Auth routes
  app.get('/api/user', isAuthenticated, async (req: any, res) => {
    try {
      const sessionUser = req.user;

      // Получаем полные данные пользователя из базы данных
      const fullUser = await storage.getUser(sessionUser.id);

      if (!fullUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Убираем только пароль из ответа, оставляем profileImageUrl
      const { password, ...userWithoutPassword } = fullUser;

      // Добавляем дополнительные поля
      const userResponse = {
        ...userWithoutPassword,
        hasAvatar: !!fullUser.profileImageUrl,
        // Правильно маппим поля для проверки привязки аккаунтов из базы данных
        googleId: fullUser.googleId || null,
        telegramId: fullUser.telegramId || null
      };

      res.json(userResponse);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get user statistics
  app.get("/api/user/statistics", isAuthenticated, async (req: any, res: any) => {
    try {
      const statistics = await storage.getUserStatistics(req.user.id);
      res.json(statistics);
    } catch (error) {
      console.error("Error fetching user statistics:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Telegram authentication route
  app.post('/api/auth/telegram', async (req, res) => {
    try {
      const { telegramData } = req.body;

      if (!telegramData || !telegramData.id) {
        return res.status(400).json({ message: 'Неверные данные Telegram' });
      }

      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        return res.status(500).json({ message: 'Токен бота не настроен' });
      }

      // Получаем фото профиля пользователя из Telegram
      let photoUrl = null;
      try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/getUserProfilePhotos?user_id=${telegramData.id}&limit=1`);
        const data = await response.json();

        if (data.ok && data.result.total_count > 0) {
          const fileId = data.result.photos[0][0].file_id;

          const fileResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
          const fileData = await fileResponse.json();

          if (fileData.ok) {
            photoUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
          }
        }
      } catch (error) {
        console.error('Ошибка получения фото:', error);
      }

      // Проверяем, существует ли пользователь
      let user = await storage.getUserByTelegramId(telegramData.id.toString());

      if (user) {
        // Обновляем данные пользователя
        user = await storage.updateUserTelegramData(user.id, {
          telegramId: telegramData.id.toString(),
          telegramUsername: telegramData.username,
          telegramFirstName: telegramData.first_name,
          telegramLastName: telegramData.last_name,
          telegramPhotoUrl: photoUrl
        });
      } else {
        // Создаём нового пользователя
        user = await storage.createUserFromTelegram({
          telegramId: telegramData.id.toString(),
          telegramUsername: telegramData.username,
          telegramFirstName: telegramData.first_name,
          telegramLastName: telegramData.last_name,
          telegramPhotoUrl: photoUrl
        });
      }

      // Авторизуем пользователя
      req.login(user, (err: any) => {
        if (err) {
          console.error('Ошибка входа:', err);
          return res.status(500).json({ message: 'Ошибка авторизации' });
        }
        res.json({ message: 'Успешно авторизованы через Telegram', user });
      });

    } catch (error) {
      console.error('Ошибка Telegram авторизации:', error);
      res.status(500).json({ message: 'Ошибка авторизации через Telegram' });
    }
  });

  // Simplified Telegram authentication route
  app.post('/api/auth/telegram-simple', async (req, res) => {
    try {
      const { telegramUsername } = req.body;

      if (!telegramUsername) {
        return res.status(400).json({ message: 'Telegram username обязателен' });
      }

      const cleanUsername = telegramUsername.replace('@', '').toLowerCase();

      // Проверяем, существует ли пользователь с таким Telegram username
      let user = await storage.getUserByUsername(`tg_${cleanUsername}`);

      if (user) {
        // Авторизуем существующего пользователя
        req.login(user, (err: any) => {
          if (err) {
            console.error('Ошибка входа:', err);
            return res.status(500).json({ message: 'Ошибка авторизации' });
          }
          res.json({ message: 'Успешно авторизованы', user });
        });
      } else {
        // Создаём нового пользователя через обычный метод
        const userData = {
          username: `tg_${cleanUsername}`,
          email: '',
          password: '',
          firstName: `@${cleanUsername}`,
          lastName: '',
          role: 'user',
          status: 'active',
          balance: '0.00',
          telegramUsername: cleanUsername
        };

        user = await storage.createUser(userData);

        req.login(user, (err: any) => {
          if (err) {
            console.error('Ошибка входа:', err);
            return res.status(500).json({ message: 'Ошибка авторизации' });
          }
          res.json({ message: 'Аккаунт создан и вы авторизованы', user });
        });
      }

    } catch (error) {
      console.error('Ошибка упрощенной Telegram авторизации:', error);
      res.status(500).json({ message: 'Ошибка авторизации через Telegram' });
    }
  });

  // Telegram webhook endpoint
  app.post('/api/telegram/webhook', handleTelegramWebhook);

  // Import validateAuthToken function
  const { validateAuthToken } = await import('./telegram-bot');

  // Telegram login by token endpoint
  app.get('/auth/telegram-login', async (req, res) => {
    try {
      const { token } = req.query;
      console.log('🔐 Попытка входа через Telegram с токеном:', token);

      if (!token || typeof token !== 'string') {
        console.log('❌ Неверный токен');
        return res.redirect('/auth?error=invalid_token');
      }

      const authData = validateAuthToken(token);
      console.log('🔍 Результат валидации токена:', authData);

      if (!authData) {
        console.log('❌ Токен недействителен или истек');
        return res.redirect('/auth?error=expired_token');
      }

      const user = await storage.getUser(authData.userId);
      console.log('👤 Найден пользователь:', user?.username);

      if (!user) {
        console.log('❌ Пользователь не найден');
        return res.redirect('/auth?error=user_not_found');
      }

      req.login(user, (err: any) => {
        if (err) {
          console.log('❌ Ошибка входа:', err);
          return res.redirect('/auth?error=login_failed');
        }
        console.log('✅ Успешный вход через Telegram для пользователя:', user.username);
        res.redirect('/?telegram_login=success');
      });

    } catch (error) {
      console.log('💥 Ошибка сервера при входе через Telegram:', error);
      res.redirect('/auth?error=server_error');
    }
  });

  // Google OAuth routes
  app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/api/auth/google/callback',
    (req, res, next) => {
      passport.authenticate('google', (err, user, info) => {
        if (err) {
          console.error('Google OAuth error:', err);

          // Обработка различных ошибок привязки
          switch (err.message) {
            case 'GOOGLE_ALREADY_LINKED_TO_OTHER_USER':
              return res.redirect('/settings?error=google_already_linked_to_other');
            case 'USER_ALREADY_HAS_GOOGLE_ACCOUNT':
              return res.redirect('/settings?error=user_already_has_google');
            case 'EMAIL_ALREADY_HAS_DIFFERENT_GOOGLE':
              return res.redirect('/settings?error=email_has_different_google');
            default:
              return res.redirect('/auth?error=google_auth_failed');
          }
        }

        if (!user) {
          return res.redirect('/auth?error=google_auth_failed');
        }

        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error('Login error after Google auth:', loginErr);
            return res.redirect('/auth?error=login_failed');
          }

          // Если пользователь уже был авторизован (попытка привязки), перенаправляем в настройки
          if (req.session && req.session.google_link_attempt) {
            delete req.session.google_link_attempt;
            return res.redirect('/settings?success=google_linked');
          }

          // Обычная авторизация
          res.redirect('/?auth=success');
        });
      })(req, res, next);
    }
  );

  // Test endpoint for creating link tokens (для отладки)
  app.post('/api/test/create-link-token', async (req: any, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId required' });
      }

      // Генерируем токен для привязки
      const linkToken = crypto.randomBytes(32).toString('hex');

      console.log('Test: Generated linkToken:', linkToken);

      // Сохраняем токен (действует 30 минут)
      const telegramBot = await import('./telegram-bot');
      const expiresAt = Date.now() + 1800000;
      telegramBot.linkingTokens.set(linkToken, {
        userId,
        expires: expiresAt
      });

      console.log('Test: Token saved to linkingTokens:', {
        token: linkToken,
        userId: userId,
        totalTokens: telegramBot.linkingTokens.size
      });

      // Возвращаем ссылку для бота
      const botUrl = `https://t.me/TG_FLOVV_BOT?start=link_${linkToken}`;

      res.json({
        success: true,
        botUrl,
        linkToken,
        message: 'Test token created'
      });
    } catch (error) {
      console.error('Test: Ошибка создания токена:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Telegram account linking
  app.post('/api/telegram/link', isAuthenticated, async (req: any, res) => {
    try {
      console.log('Telegram link request - req.user:', req.user); // Отладочный лог

      if (!req.user || !req.user.id) {
        return res.status(401).json({
          error: 'Пользователь не авторизован'
        });
      }

      const userId = req.user.id;
      console.log('User ID for telegram link:', userId); // Отладочный лог

      // Проверяем, не привязан ли уже Telegram к этому аккаунту
      const user = await storage.getUser(userId);
      console.log('Found user for telegram link:', user ? `${user.username} (${user.id})` : 'not found'); // Отладочный лог

      if (user?.telegramId) {
        return res.status(400).json({
          error: 'Telegram уже привязан к этому аккаунту'
        });
      }

      // Генерируем токен для привязки
      const linkToken = crypto.randomBytes(32).toString('hex');

      console.log('Generated linkToken:', linkToken); // Отладочный лог

      // Сохраняем токен (действует 30 минут)
      const telegramBot = await import('./telegram-bot');
      const expiresAt = Date.now() + 1800000; // 30 минут
      telegramBot.linkingTokens.set(linkToken, {
        userId,
        expires: expiresAt
      });

      console.log('Token saved to linkingTokens:', {
        token: linkToken,
        userId: userId,
        expires: expiresAt,
        expiresDate: new Date(expiresAt).toLocaleString(),
        currentTime: Date.now(),
        currentDate: new Date().toLocaleString(),
        totalTokens: telegramBot.linkingTokens.size
      });

      // Возвращаем ссылку для бота
      const botUrl = `https://t.me/TG_FLOVV_BOT?start=link_${linkToken}`;

      console.log('Generated botUrl:', botUrl); // Отладочный лог

      res.json({
        success: true,
        botUrl,
        message: 'Перейдите по ссылке и отправьте команду /start в боте для привязки аккаунта'
      });
    } catch (error) {
      console.error('Ошибка создания токена привязки:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Telegram account unlinking
  app.post('/api/telegram/unlink', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Отвязываем Telegram от аккаунта
      await storage.updateUserTelegramData(userId, {
        telegramId: '',
        telegramUsername: '',
        telegramFirstName: '',
        telegramLastName: '',
        telegramPhotoUrl: ''
      });

      res.json({
        success: true,
        message: 'Telegram аккаунт успешно отвязан'
      });
    } catch (error) {
      console.error('Ошибка отвязки Telegram:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Webhook setup endpoints (для администрирования)
  app.post('/api/telegram/setup-webhook', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = await setWebhook();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to set webhook' });
    }
  });

  app.get('/api/telegram/webhook-info', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = await getWebhookInfo();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get webhook info' });
    }
  });

  // Logout route
  app.post('/api/logout', (req: any, res) => {
    req.logout((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      req.session.destroy((err: any) => {
        if (err) {
          console.error("Session destroy error:", err);
          return res.status(500).json({ message: "Failed to destroy session" });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "Logged out successfully" });
      });
    });
  });

  // Categories routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Database diagnostic endpoint
  app.get('/api/diagnostic/tables', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      const channels = await storage.getChannels();
      const users = await storage.getUsers();
      
      res.json({
        categories: categories.length,
        channels: channels.length,
        users: users.length,
        sampleCategory: categories[0] || null,
        sampleChannel: channels[0] || null
      });
    } catch (error) {
      console.error("Error getting diagnostic info:", error);
      res.status(500).json({ message: "Failed to get diagnostic info" });
    }
  });

  app.post('/api/categories/populate', async (req, res) => {
    try {
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

      // Delete existing categories first
      await db.delete(categories);

      // Insert categories one by one to handle any issues
      const insertedCategories = [];
      for (const category of categoriesToInsert) {
        try {
          const newCategory = await storage.createCategory(category);
          insertedCategories.push(newCategory);
        } catch (error) {
          console.error(`Error inserting category ${category.name}:`, error);
        }
      }

      res.json({
        message: `Successfully populated ${insertedCategories.length} categories`,
        categories: insertedCategories
      });
    } catch (error) {
      console.error("Error populating categories:", error);
      res.status(500).json({ message: "Failed to populate categories" });
    }
  });

  app.post('/api/categories', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;

      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Bulk create categories for initial setup
  app.post('/api/categories/bulk', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;

      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const categories = [
        { name: "Музыка", icon: "fas fa-music", isAdult: false, price: "30" },
        { name: "Видеоигры", icon: "fas fa-gamepad", isAdult: false, price: "30" },
        { name: "Фитнес", icon: "fas fa-dumbbell", isAdult: false, price: "30" },
        { name: "Программирование", icon: "fas fa-code", isAdult: false, price: "30" },
        { name: "Кино", icon: "fas fa-film", isAdult: false, price: "30" },
        { name: "Автомобили", icon: "fas fa-car", isAdult: false, price: "30" },
        <previous_generation>
        { name: "Для взрослых", icon: "fas fa-exclamation-triangle", isAdult: true, price: "60" },
        { name: "Путешествия", icon: "fas fa-plane", isAdult: false, price: "30" },
        { name: "Игры", icon: "fas fa-dice", isAdult: false, price: "30" },
        { name: "Маркетинг", icon: "fas fa-bullhorn", isAdult: false, price: "30" },
        { name: "Косметика", icon: "fas fa-spa", isAdult: false, price: "30" },
        { name: "Футбол", icon: "fas fa-futbol", isAdult: false, price: "30" },
        { name: "Гаджеты", icon: "fas fa-mobile-alt", isAdult: false, price: "30" },
        { name: "Туризм", icon: "fas fa-map-marked-alt", isAdult: false, price: "30" },
        { name: "Боевые искусства", icon: "fas fa-fist-raised", isAdult: false, price: "30" },
        { name: "Финансы", icon: "fas fa-coins", isAdult: false, price: "30" },
        { name: "Юмор", icon: "fas fa-laugh", isAdult: false, price: "30" },
        { name: "Университеты", icon: "fas fa-graduation-cap", isAdult: false, price: "30" },
        { name: "Мотоциклы", icon: "fas fa-motorcycle", isAdult: false, price: "30" },
        { name: "Искусственный интеллект", icon: "fas fa-robot", isAdult: false, price: "30" },
        { name: "Стиль", icon: "fas fa-gem", isAdult: false, price: "30" },
        { name: "Стартапы", icon: "fas fa-rocket", isAdult: false, price: "30" },
        { name: "Курсы", icon: "fas fa-chalkboard-teacher", isAdult: false, price: "30" },
        { name: "Тюнинг", icon: "fas fa-wrench", isAdult: false, price: "30" },
        { name: "Страны", icon: "fas fa-globe-americas", isAdult: false, price: "30" },
        { name: "Хобби", icon: "fas fa-puzzle-piece", isAdult: false, price: "30" },
        { name: "Танцы", icon: "fas fa-dancing", isAdult: false, price: "30" },
        { name: "Фотография", icon: "fas fa-camera", isAdult: false, price: "30" },
        { name: "Кулинария", icon: "fas fa-utensils", isAdult: false, price: "30" },
        { name: "Наука", icon: "fas fa-atom", isAdult: false, price: "30" },
        { name: "Литература", icon: "fas fa-book", isAdult: false, price: "30" },
        { name: "Велоспорт", icon: "fas fa-bicycle", isAdult: false, price: "30" },
        { name: "Дизайн", icon: "fas fa-palette", isAdult: false, price: "30" },
        { name: "Экология", icon: "fas fa-leaf", isAdult: false, price: "30" },
        { name: "Театр", icon: "fas fa-theater-masks", isAdult: false, price: "30" },
        { name: "Школы", icon: "fas fa-school", isAdult: false, price: "30" },
        { name: "Живопись", icon: "fas fa-paint-brush", isAdult: false, price: "30" },
        { name: "Спорт", icon: "fas fa-trophy", isAdult: false, price: "30" },
        { name: "Кибербезопасность", icon: "fas fa-shield-alt", isAdult: false, price: "30" },
        { name: "Медитация", icon: "fas fa-om", isAdult: false, price: "30" },
        { name: "История", icon: "fas fa-landmark", isAdult: false, price: "30" },
        { name: "Садоводство", icon: "fas fa-seedling", isAdult: false, price: "30" },
        { name: "Анимация", icon: "fas fa-play-circle", isAdult: false, price: "30" },
        { name: "Психология", icon: "fas fa-brain", isAdult: false, price: "30" },
        { name: "AT Разработка", icon: "fas fa-laptop-code", isAdult: false, price: "30" },
        { name: "Серфинг", icon: "fas fa-water", isAdult: false, price: "30" },
        { name: "Мода", icon: "fas fa-tshirt", isAdult: false, price: "30" },
        { name: "Подкасты", icon: "fas fa-microphone", isAdult: false, price: "30" }
      ];

      const createdCategories = [];
      for (const categoryData of categories) {
        try {
          const category = await storage.createCategory(categoryData);
          createdCategories.push(category);
        } catch (error) {
          // Category already exists
        }
      }

      res.json({ message: `Created ${createdCategories.length} categories`, categories: createdCategories });
    } catch (error) {
      console.error("Error creating categories:", error);
      res.status(500).json({ message: "Failed to create categories" });
    }
  });

  // Channels routes
  app.get('/api/channels', async (req, res) => {
    try {
      const limit = req.query.limit ? Math.min(parseInt(req.query.limit as string), 100) : 50;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const type = req.query.type as string;

      const channels = await storage.getChannels(limit, categoryId, type);

      res.json(channels);
    } catch (error) {
      console.error("Error fetching channels:", error);

      if (error.message && error.message.includes('timeout')) {
        return res.status(504).json({ message: "Превышено время ожидания при загрузке каналов. Попробуйте обновить страницу" });
      }

      res.status(500).json({
        message: "Не удалось загрузить список каналов. Попробуйте обновить страницу",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // My publications routes (must be before /api/channels/:id)
  app.get('/api/channels/my', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;

      if (!user || !user.id) {
        console.log("User not authenticated for /api/channels/my");
        return res.status(401).json({ message: "User not authenticated" });
      }

      console.log(`Fetching channels for user ID: ${user.id}`);
      const channels = await storage.getUserChannels(user.id);
      console.log(`Found ${channels ? channels.length : 0} channels for user ${user.id}`);

      // Ensure we always return an array
      const result = Array.isArray(channels) ? channels : [];
      res.json(result);
    } catch (error) {
      console.error("Error in /api/channels/my:", error);

      // Return empty array instead of error to prevent UI breaking
      res.json([]);
    }
  });

  app.get('/api/channels/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid channel ID" });
      }
      const channel = await storage.getChannelById(id);

      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }

      res.json(channel);
    } catch (error) {
      console.error("Error fetching channel:", error);
      res.status(500).json({ message: "Failed to fetch channel" });
    }
  });

  app.delete('/api/channels/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const channelId = parseInt(req.params.id);

      if (!user || !['admin', 'moderator'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const channel = await storage.getChannelById(channelId);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }

      await storage.deleteChannel(channelId);
      res.json({ message: "Channel deleted successfully" });
    } catch (error) {
      console.error("Error deleting channel:", error);
      res.status(500).json({ message: "Failed to delete channel" });
    }
  });

  // Get user's existing rating for a channel
  app.get("/api/channels/:id/user-rating", isAuthenticated, async (req: any, res) => {
    try {
      const channelId = parseInt(req.params.id);
      const userId = req.user.id;

      const existingRating = await db
        .select({ rating: ratings.rating })
        .from(ratings)
        .where(and(
          eq(ratings.channelId, channelId),
          eq(ratings.userId, userId)
        ))
        .limit(1);

      if (existingRating.length > 0) {
        res.json({ rating: existingRating[0].rating });
      } else {
        res.json({ rating: null });
      }
    } catch (error) {
      console.error("Error getting user rating:", error);
      res.status(500).json({ error: "Failed to get user rating" });
    }
  });

  app.post("/api/channels/:id/rate", isAuthenticated, async (req: any, res) => {
    try {
      const channelId = parseInt(req.params.id);
      const { rating } = req.body;
      const userId = req.user.id;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }

      await storage.rateChannel(channelId, userId, rating);
      const channelRating = await storage.getChannelRating(channelId);

      res.json({ ...channelRating, userRating: rating });
    } catch (error) {
      console.error("Error rating channel:", error);
      res.status(500).json({ error: "Failed to rate channel" });
    }
  });

  app.post("/api/channels/:id/view", async (req: any, res) => {
    try {
      const channelId = parseInt(req.params.id);
      const userId = req.user ? req.user.id : null;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      // Проверяем, был ли уже просмотр (дедупликация)
      const isNewView = await storage.addChannelView(channelId, userId, ipAddress, userAgent);

      // Инкрементируем общий счетчик только для новых просмотров
      if (isNewView) {
        await storage.incrementChannelViews(channelId);
      }

      const viewCount = await storage.getChannelViews(channelId);
      res.json({ viewCount, wasNewView: isNewView });
    } catch (error) {
      console.error("Error adding channel view:", error);
      res.status(500).json({ error: "Failed to add view" });
    }
  });

  app.get("/api/channels/:id/views-24h", async (req: any, res) => {
    try {
      const channelId = parseInt(req.params.id);
      if (isNaN(channelId)) {
        return res.status(400).json({ error: "Invalid channel ID" });
      }

      const views24h = await storage.getChannelViews24h(channelId);
      res.json({ views24h: views24h || 0 });
    } catch (error) {
      console.error("Error getting 24h views:", error);
      res.status(500).json({ error: "Failed to get 24h views" });
    }
  });

  // Image upload route
  app.post('/api/upload', isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      console.log('Upload request received:', {
        hasFile: !!req.file,
        body: req.body,
        files: req.files,
        headers: req.headers['content-type']
      });

      const file = req.file;

      if (!file) {
        console.log('No file received in upload request');
        return res.status(400).json({ message: "Image file is required" });
      }

      console.log('File received:', {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });

      // Optimize image using sharp
      let optimizedBuffer = file.buffer;
      try {
        const sharp = await import('sharp');
        optimizedBuffer = await sharp.default(file.buffer)
          .resize({ width: 800, height: 600, fit: 'inside' })
          .jpeg({ quality: 80 })
          .toBuffer();
      } catch (sharpError) {
        // Sharp optimization failed, using original image
      }

      // Convert file to base64 for storage
      const imageUrl = `data:${file.mimetype};base64,${optimizedBuffer.toString('base64')}`;

      res.json({ url: imageUrl });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Channel applications routes
  app.get('/api/applications', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;

      if (!user || !['admin', 'moderator', 'watcher'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const status = req.query.status as string;
      const applications = await storage.getApplications(status);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.post('/api/applications', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const userId = user.id;

      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      // Parse and validate application data
      const applicationData = {
        applicantId: userId,
        channelName: req.body.channelName,
        title: req.body.channelName, // Map channelName to title
        description: req.body.description || '',
        channelUrl: req.body.channelUrl,
        categoryId: parseInt(req.body.categoryId),
        type: req.body.type || 'channel',
        price: req.body.price || '30.00',
        isPaid: false,
        imageUrl: req.body.imageUrl || null,
        channelImage: req.body.channelImage || null,
        status: 'pending',
      };

      const validatedData = insertChannelApplicationSchema.parse(applicationData);

      // Validate that URL starts with https://t.me/
      if (!validatedData.channelUrl.startsWith('https://t.me/')) {
        return res.status(400).json({ message: "Ссылка должна начинаться с https://t.me/" });
      }

      // Check if channel with this URL already exists FIRST
      const channelExists = await storage.checkChannelExistsByUrl(validatedData.channelUrl);
      if (channelExists) {
        return res.status(400).json({ message: "Канал с такой ссылкой уже существует или заявка уже подана" });
      }

      // Check if user has sufficient balance AFTER checking existence
      const userBalance = parseFloat(user.balance);
      const applicationPrice = parseFloat(validatedData.price);

      if (userBalance < applicationPrice) {
        return res.status(400).json({ message: "Недостаточно средств на балансе для подачи заявки" });
      }

      // Create application and deduct balance
      const application = await storage.createApplication(validatedData);

      // Deduct price from user balance
      await storage.updateUserBalance(userId, `-${applicationPrice}`);

      // Create payment record
      await storage.createPayment({
        userId,
        amount: validatedData.price,
        type: 'channel_submission',
        applicationId: application.id,
        status: 'completed',
      });

      res.json(application);
    } catch (error) {
      console.error("Error creating application:", error);
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        return res.status(400).json({
          message: `Ошибка валидации данных: ${validationErrors}`,
          errors: error.errors
        });
      }

      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ message: "Канал с такими данными уже существует" });
      }

      if (error.message && error.message.includes('FOREIGN KEY constraint failed')) {
        return res.status(400).json({ message: "Указанная категория не существует" });
      }

      res.status(500).json({
        message: "Не удалось создать заявку на канал. Проверьте данные и попробуйте еще раз",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.patch('/api/applications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const userId = user.id;
      const applicationId = parseInt(req.params.id);

      if (!user || !['admin', 'moderator'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { status, rejectionReason } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const application = await storage.updateApplicationStatus(
        applicationId,
        status,
        userId,
        rejectionReason
      );

      // Pay moderator 0.25 rubles for processing application
      if (user.role === 'moderator') {
        await storage.updateUserBalance(userId, '0.25');

        // Create payment record for moderator earnings
        await storage.createPayment({
          userId,
          amount: '0.25',
          type: 'moderator_earnings',
          applicationId,
          status: 'completed',
        });

        // Create notification for moderator
        await storage.createNotification({
          userId,
          type: 'moderator_payment',
          title: 'Начисление за обработку заявки',
          message: `Вам начислено 0.25 рублей за обработку заявки на канал "${application.channelName}"`
        });
      }

      // Create notification for the applicant
      if (status === 'approved') {
        await storage.createNotification({
          userId: application.applicantId,
          type: 'application_approved',
          title: 'Заявка одобрена',
          message: `Ваша заявка на добавление канала "${application.channelName}" была одобрена!`
        });
      } else if (status === 'rejected') {
        await storage.createNotification({
          userId: application.applicantId,
          type: 'application_rejected',
          title: 'Заявка отклонена',
          message: `Ваша заявка на добавление канала "${application.channelName}" была отклонена. Причина: ${rejectionReason || 'Не указана'}`
        });
      }

      // If approved, create the channel/bot/group or update existing
      if (status === 'approved') {
        // Get the full application data to access all fields
        const [fullApplication] = await db.select().from(channelApplications).where(eq(channelApplications.id, applicationId));

        // Extract username from telegram URL
        const urlMatch = fullApplication.channelUrl.match(/t\.me\/(.+)/);
        const username = urlMatch ? urlMatch[1] : '';

        // Check if this is an update to existing channel
        const existingChannel = await db
          .select()
          .from(channels)
          .where(eq(channels.username, username))
          .limit(1);

        if (existingChannel.length > 0) {
          // Update existing channel
          await storage.updateChannel(existingChannel[0].id, {
            name: fullApplication.channelName || existingChannel[0].name,
            title: fullApplication.channelName || existingChannel[0].title,
            description: fullApplication.description || existingChannel[0].description,
            imageUrl: fullApplication.channelImage || existingChannel[0].imageUrl,
            categoryId: fullApplication.categoryId || existingChannel[0].categoryId,
            status: 'approved',
          });
        } else {
          // Create new channel (which includes channels, bots, and groups)
          const channelName = fullApplication.channelName || username || 'Unknown';
          await storage.createChannel({
            name: channelName,
            username,
            title: channelName, // Ensure title is set
            description: fullApplication.description || '',
            channelUrl: fullApplication.channelUrl,
            imageUrl: fullApplication.channelImage || null,
            categoryId: fullApplication.categoryId,
            ownerId: fullApplication.applicantId,
            type: fullApplication.type || 'channel',
            status: 'approved',
          });
        }
      }

      res.json(application);
    } catch (error) {
      console.error("Error updating application:", error);
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  // Stats route
  app.get('/api/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;

      if (!user || !['admin', 'moderator', 'watcher'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // User management routes
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/users/:id/balance', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const userId = parseInt(req.params.id);
      const { amount } = req.body;

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!amount) {
        return res.status(400).json({ message: "Amount is required" });
      }

      const updatedUser = await storage.updateUserBalance(userId, amount.toString());
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user balance:", error);
      res.status(500).json({ message: "Failed to update user balance" });
    }
  });

  app.patch('/api/users/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const userId = parseInt(req.params.id);
      const { action } = req.body;

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!['block', 'unblock'].includes(action)) {
        return res.status(400).json({ message: "Invalid action" });
      }

      const updatedUser = await storage.updateUserStatus(userId, action === 'block' ? 'blocked' : 'active');
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  app.patch('/api/users/:id/role', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const userId = parseInt(req.params.id);
      const { role } = req.body;

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!['admin', 'moderator', 'watcher', 'user'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      // Prevent changing own role
      if (userId === user.id) {
        return res.status(400).json({ message: "Cannot change your own role" });
      }

      const updatedUser = await storage.updateUserRole(userId, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.patch('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { firstName, lastName } = req.body;

      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      const updatedUser = await storage.updateUserProfile(user.id, { firstName, lastName });
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  // Отправка кода верификации на email
  app.post('/api/user/email/send-verification', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { email } = req.body;

      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      if (!email || !email.trim()) {
        return res.status(400).json({ message: "Поле email обязательно для заполнения" });
      }

      const trimmedEmail = email.trim().toLowerCase();

      // Enhanced email validation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({ message: "Введите корректный email адрес" });
      }

      // Check for valid domain extensions
      const validDomains = ['.com', '.ru', '.org', '.net', '.edu', '.gov', '.mil', '.int', '.co', '.io', '.me', '.info', '.biz', '.name', '.pro'];
      const hasValidDomain = validDomains.some(domain => trimmedEmail.endsWith(domain));
      if (!hasValidDomain) {
        return res.status(400).json({ message: "Email должен иметь корректное доменное имя (например, .com, .ru, .org)" });
      }

      // Check if email is already taken by another user
      const existingUser = await storage.getUserByEmail(trimmedEmail);
      if (existingUser && existingUser.id !== user.id) {
        return res.status(400).json({
          message: "Этот email уже привязан к другому аккаунту",
          errorCode: "EMAIL_ALREADY_EXISTS"
        });
      }

      // Генерируем и отправляем код
      const { generateVerificationCode, sendEmailVerificationCode } = await import('./email');
      const code = generateVerificationCode();

      // Сохраняем код в базе данных
      await storage.saveEmailVerificationCode(user.id, trimmedEmail, code);

      // Отправляем код на email
      const emailSent = await sendEmailVerificationCode(trimmedEmail, code);

      if (!emailSent) {
        return res.status(500).json({
          message: "Не удалось отправить код на email",
          errorCode: "EMAIL_SEND_FAILED"
        });
      }

      res.json({
        message: "Код верификации отправлен на указанный email",
        email: trimmedEmail
      });

    } catch (error) {
      console.error("Error sending email verification:", error);
      res.status(500).json({
        message: "Ошибка отправки кода верификации",
        errorCode: "INTERNAL_SERVER_ERROR"
      });
    }
  });

  // Верификация кода и обновление email
  app.post('/api/user/email/verify', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { email, code } = req.body;

      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      if (!email || !email.trim()) {
        return res.status(400).json({ message: "Поле email обязательно для заполнения" });
      }

      if (!code || !code.trim()) {
        return res.status(400).json({ message: "Поле код обязательно для заполнения" });
      }

      const trimmedEmail = email.trim().toLowerCase();
      const trimmedCode = code.trim();

      // Проверяем код верификации
      const result = await storage.verifyEmailCode(user.id, trimmedCode, trimmedEmail);

      if (!result.success) {
        return res.status(400).json({
          message: result.error,
          errorCode: "VERIFICATION_FAILED"
        });
      }

      res.json({
        message: "Email успешно подтвержден и обновлен",
        user: result.user
      });

    } catch (error) {
      console.error("Error verifying email code:", error);
      res.status(500).json({
        message: "Ошибка верификации кода",
        errorCode: "INTERNAL_SERVER_ERROR"
      });
    }
  });

  app.patch('/api/user/email', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { email } = req.body;

      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      if (!email || !email.trim()) {
        return res.status(400).json({ message: "Поле email обязательно для заполнения" });
      }

      const trimmedEmail = email.trim().toLowerCase();

      // Enhanced email validation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({ message: "Введите корректный email адрес" });
      }

      // Check for valid domain extensions
      const validDomains = ['.com', '.ru', '.org', '.net', '.edu', '.gov', '.mil', '.int', '.co', '.io', '.me', '.info', '.biz', '.name', '.pro'];
      const hasValidDomain = validDomains.some(domain => trimmedEmail.endsWith(domain));
      if (!hasValidDomain) {
        return res.status(400).json({ message: "Email должен иметь корректное доменное имя (например, .com, .ru, .org)" });
      }

      // Check if email is already taken by another user
      const existingUser = await storage.getUserByEmail(trimmedEmail);
      if (existingUser && existingUser.id !== user.id) {
        return res.status(400).json({
          message: "Этот email уже привязан к другому аккаунту",
          details: `Email ${trimmedEmail} уже используется пользователем с ID ${existingUser.id}`,
          errorCode: "EMAIL_ALREADY_EXISTS"
        });
      }

      const updatedUser = await storage.updateUserEmail(user.id, trimmedEmail);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user email:", error);

      // Detailed error handling
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({
          message: "Этот email уже привязан к другому аккаунту",
          details: "Нарушение уникальности email в базе данных",
          errorCode: "EMAIL_UNIQUE_CONSTRAINT"
        });
      }

      if (error.message && error.message.includes('NOT NULL constraint failed')) {
        return res.status(400).json({
          message: "Email не может быть пустым",
          details: "Поле email является обязательным",
          errorCode: "EMAIL_REQUIRED"
        });
      }

      if (error.message && error.message.includes('foreign key')) {
        return res.status(400).json({
          message: "Ошибка связанности данных",
          details: "Пользователь не найден в системе",
          errorCode: "USER_NOT_FOUND"
        });
      }

      // Generic server error with more details
      res.status(500).json({
        message: "Не удалось обновить email",
        details: process.env.NODE_ENV === 'development' ? error.message : "Внутренняя ошибка сервера",
        errorCode: "INTERNAL_SERVER_ERROR"
      });
    }
  });

  // Upload avatar route with file handling
  app.post('/api/user/avatar', isAuthenticated, upload.single('avatar'), async (req: any, res) => {
    try {
      const user = req.user;
      const file = req.file;

      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      if (!file) {
        return res.status(400).json({ message: "Файл аватара обязателен" });
      }

      // Validate file type
      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({ message: "Файл должен быть изображением" });
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ message: "Размер файла не должен превышать 5MB" });
      }

      // Convert file to base64 data URL
      const base64Data = file.buffer.toString('base64');
      const dataUrl = `data:${file.mimetype};base64,${base64Data}`;

      console.log('📷 Uploading avatar for user:', user.id);
      console.log('📷 Data URL length:', dataUrl.length);
      console.log('📷 Data URL preview:', dataUrl.substring(0, 50) + '...');

      // Update user avatar
      const updatedUser = await storage.updateUserAvatar(user.id, dataUrl);

      console.log('📷 Avatar updated in database:', {
        userId: updatedUser.id,
        hasProfileImage: !!updatedUser.profileImageUrl,
        profileImageUrlLength: updatedUser.profileImageUrl?.length || 0
      });

      res.json({
        message: "Аватар успешно обновлен",
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          profileImageUrl: updatedUser.profileImageUrl,
          role: updatedUser.role,
          balance: updatedUser.balance
        }
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      res.status(500).json({ message: "Не удалось загрузить аватар" });
    }
  });

  // Legacy PATCH route for avatar URL (for backward compatibility)
  app.patch('/api/user/avatar', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { profileImageUrl } = req.body;

      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      if (!profileImageUrl) {
        return res.status(400).json({ message: "Profile image URL is required" });
      }

      const updatedUser = await storage.updateUserAvatar(user.id, profileImageUrl);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user avatar:", error);
      res.status(500).json({ message: "Failed to update user avatar" });
    }
  });

  // Change password route
  app.delete('/api/user/account', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      // Delete the user account
      await storage.deleteUser(user.id);

      // Logout the user
      req.logout((err: any) => {
        if (err) {
          console.error("Logout error after account deletion:", err);
        }
        req.session.destroy((err: any) => {
          if (err) {
            console.error("Session destroy error after account deletion:", err);
          }
          res.clearCookie('connect.sid');
          res.json({ message: "Аккаунт успешно удален" });
        });
      });

    } catch (error) {
      console.error("Error deleting user account:", error);
      res.status(500).json({ message: "Не удалось удалить аккаунт" });
    }
  });

  app.patch('/api/user/password', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { currentPassword, newPassword } = req.body;

      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      if (!newPassword || !newPassword.trim()) {
        return res.status(400).json({ message: "Новый пароль обязателен" });
      }

      // Validate new password requirements
      if (newPassword.length < 8 || newPassword.length > 128) {
        return res.status(400).json({ message: "Пароль должен содержать от 8 до 128 символов" });
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*()_+=\-\[\]{}|;:,.<>?]+$/;
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({ message: "Пароль должен содержать хотя бы одну заглавную букву, одну строчную букву и одну цифру" });
      }

      // Get full user data to check current password
      const fullUser = await storage.getUser(user.id);
      if (!fullUser) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      // If user has a password, verify current password
      if (fullUser.password && fullUser.password.trim() !== '') {
        if (!currentPassword || !currentPassword.trim()) {
          return res.status(400).json({ message: "Текущий пароль обязателен" });
        }

        const isCurrentPasswordValid = await comparePasswords(currentPassword, fullUser.password);
        if (!isCurrentPasswordValid) {
          return res.status(400).json({ message: "Неверный текущий пароль" });
        }
      }

      // Hash new password
      const { hashPassword } = await import('./auth');
      const hashedNewPassword = await hashPassword(newPassword);

      // Update password
      const updatedUser = await storage.updateUserPassword(user.id, hashedNewPassword);

      res.json({
        message: "Пароль успешно изменен",
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          balance: updatedUser.balance,
          hasPassword: true
        }
      });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Не удалось изменить пароль" });
    }
  });

  // Topup history for users
  app.get('/api/user/topup-history', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      const topups = await storage.getUserTopupHistory(user.id);
      res.json(topups);
    } catch (error) {
      console.error("Error fetching user topup history:", error);
      res.status(500).json({ message: "Не удалось загрузить историю пополнений" });
    }
  });

  // Get topups with optional status filter
  app.get('/api/topups', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { status } = req.query;
      const topups = await storage.getTopups(status);
      res.json(topups);
    } catch (error) {
      console.error("Error fetching topups:", error);
      res.status(500).json({ message: "Не удалось загрузить пополнения" });
    }
  });

  app.patch('/api/channels/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const channelId = parseInt(req.params.id);
      const updates = req.body;

      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      const channel = await storage.getChannelById(channelId);
      if (!channel) {
        return res.status(404).json({ message: "Канал не найден" });
      }

      // Admin and moderator can update any channel directly
      if (['admin', 'moderator'].includes(user.role)) {
        const updatedChannel = await storage.updateChannel(channelId, updates);
        res.json(updatedChannel);
        return;
      }

      // Check if regular user owns the channel
      if (channel.ownerId !== user.id) {
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      // For regular users, create a change application instead of direct update
      const applicationData = {
        channelUrl: `https://t.me/${channel.username}`,
        channelName: updates.name || channel.name,
        title: updates.name || channel.name,
        channelImage: updates.avatarUrl || channel.avatarUrl,
        categoryId: updates.categoryId || channel.categoryId,
        description: updates.description || channel.description,
        type: channel.type,
        applicantId: user.id,
        status: 'pending',
        price: '0', // No charge for edits
        isPaid: true, // Mark as paid since it's just an edit
      };

      const application = await storage.createApplication(applicationData);

      // Create notification for moderators
      await storage.createNotification({
        userId: user.id,
        type: 'application_submitted',
        title: 'Заявка на изменение отправлена',
        message: `Ваша заявка на изменение канала "${channel.name}" отправлена на рассмотрение`
      });

      // Return the original channel without changes
      res.json({
        message: 'Заявка на изменение канала отправлена на рассмотрение',
        application: application,
        channel: channel // Return original channel data
      });
    } catch (error) {
      console.error("Error updating channel:", error);
      res.status(500).json({ message: "Failed to update channel" });
    }
  });

  // Groups, Bots, News management routes
  app.get('/api/channels/groups', async (req, res) => {
    try {
      const groups = await storage.getChannels(undefined, undefined, 'group');
      res.json(groups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ message: "Не удалось загрузить группы" });
    }
  });

  app.get('/api/channels/bots', async (req, res) => {
    try {
      const bots = await storage.getChannels(undefined, undefined, 'bot');
      res.json(bots);
    } catch (error) {
      console.error("Error fetching bots:", error);
      res.status(500).json({ message: "Failed to fetch bots" });
    }
  });

  app.get('/api/channels/news', async (req, res) => {
    try {
      const news = await storage.getChannels(undefined, undefined, 'news');
      res.json(news);
    } catch (error) {
      console.error("Error fetching news channels:", error);
      res.status(500).json({ message: "Failed to fetch news channels" });
    }
  });

// Get all bots with optional category filter
app.get("/api/bots", async (req, res) => {
  try {
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
    const bots = await storage.getChannels(undefined, categoryId, 'bot');
    res.json(bots);
  } catch (error) {
    console.error("Error fetching bots:", error);
    res.status(500).json({ message: "Failed to fetch bots" });
  }
});

// Get all groups with optional category filter
app.get("/api/groups", async (req, res) => {
  try {
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
    const groups = await storage.getChannels(undefined, categoryId, 'group');
    res.json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ message: "Failed to fetch groups" });
  }
});

// Get all channels with optional category filter
app.get("/api/channels", async (req, res) => {
  try {
    const { categoryId, search, limit, offset } = req.query;

    let whereConditions = [eq(channels.status, "approved")];

    if (categoryId) {
      whereConditions.push(eq(channels.categoryId, parseInt(categoryId as string)));
    }

    if (search) {
      whereConditions.push(
        or(
          ilike(channels.name, `%${search}%`),
          ilike(channels.description, `%${search}%`)
        )
      );
    }

    let query = db
      .select({
        id: channels.id,
        name: channels.name,
        username: channels.username,
        description: channels.description,
        imageUrl: channels.imageUrl,
        members: channels.members,
        views: channels.views,
        type: channels.type,
        categoryId: channels.categoryId,
        createdAt: channels.createdAt,
        isTop: channels.isTop,
        topPromotedAt: channels.topPromotedAt,
        isUltraTop: channels.isUltraTop,
        ultraTopExpiresAt: channels.ultraTopExpiresAt,
        contentType: sql<string>`'channel'`.as('contentType'),
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
          isAdult: categories.isAdult,
        }
      })
      .from(channels)
      .leftJoin(categories, eq(channels.categoryId, categories.id))
      .where(and(...whereConditions))
      .groupBy(channels.id, categories.id);

    if (limit) {
      query = query.limit(parseInt(limit as string));
    }

    if (offset) {
      query = query.offset(parseInt(offset as string));
    }

    const result = await query;

    // Дополнительная дедупликация на сервере по ID
    const uniqueResults = result.filter((item, index, self) =>
      index === self.findIndex(t => t.id === item.id)
    );

    res.json(uniqueResults);
  } catch (error) {
    console.error("Error fetching channels:", error);
    res.status(500).json({ message: "Failed to fetch channels" });
  }
});

  // Update subscriber count endpoint
  app.post('/api/channels/:id/update-subscribers', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const channelId = parseInt(req.params.id);

      if (!user || !['admin', 'moderator'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const channel = await storage.getChannelById(channelId);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }

      // Parse subscriber count from Telegram public page
      const subscriberCount = await parseSubscriberCount(channel.username);

      // Update channel with new subscriber count
      const updatedChannel = await storage.updateChannel(channelId, {
        subscriberCount
      });

      res.json({
        subscriberCount,
        message: `Subscriber count updated to ${subscriberCount}`
      });
    } catch (error) {
      console.error("Error updating subscriber count:", error);
      res.status(500).json({ message: "Failed to update subscriber count" });
    }
  });

  // Landing stats route
  app.get('/api/landing/stats', async (req, res) => {
    try {
      const stats = await storage.getLandingStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching landing stats:", error);
      res.status(500).json({ message: "Failed to fetch landing stats" });
    }
  });

  // Notifications route
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Get news route
  app.get('/api/news', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const news = await storage.getNews(limit);
      res.json(news);
    } catch (error) {
      console.error("Error fetching news:", error);
      res.status(500).json({ message: "Не удалось загрузить новости" });
    }
  });

  app.post('/api/news', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;

      if (!user || !['admin', 'moderator'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { title, content, excerpt, status = 'draft', imageUrl } = req.body;

      if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required" });
      }

      const newsData = {
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt?.trim() || title.trim().substring(0, 150),
        status: status || 'published',
        imageUrl: imageUrl || null,
        authorId: user.id
      };

      const news = await storage.createNews(newsData);
      res.status(201).json(news);
    } catch (error) {
      console.error("Error creating news:", error);
      res.status(500).json({ message: "Failed to create news" });
    }
  });

  app.patch('/api/news/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const newsId = parseInt(req.params.id);
      const { status } = req.body;

      if (!user || !['admin', 'moderator'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!status || !['draft', 'published'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      await storage.updateNewsStatus(newsId, status);
      res.json({ success: true, status });
    } catch (error) {
      console.error("Error updating news status:", error);
      res.status(500).json({ message: "Failed to update news status" });
    }
  });

  app.delete('/api/news/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const newsId = parseInt(req.params.id);

      if (!user || !['admin', 'moderator'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteNews(newsId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting news:", error);
      res.status(500).json({ message: "Failed to delete news" });
    }
  });

  // New route to get user's applications
  app.get('/api/user/applications', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const userId = user.id;
      const status = req.query.status as string;

      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      let applications;
      if (status) {
        applications = await storage.getUserApplicationsByStatus(userId, status);
      } else {
        applications = await storage.getUserApplications(userId);
      }

      res.json(applications);
    } catch (error) {
      console.error("Error fetching user applications:", error);
      res.status(500).json({ message: "Failed to fetch user applications" });
    }
  });

  // Notifications routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const notifications = await storage.getNotifications(user.id);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const count = await storage.getUnreadNotificationCount(user.id);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      res.status(500).json({ message: "Failed to fetch unread notification count" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch('/api/notifications/mark-all-read', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      await storage.markAllNotificationsAsRead(user.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.post('/api/admin/send-notification', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { userId, title, message } = req.body;

      if (!userId || !title || !message) {
        return res.status(400).json({ message: "User ID, title and message are required" });
      }

      const notification = await storage.createNotification({
        userId: parseInt(userId),
        type: 'admin_message',
        title,
        message
      });

      res.json(notification);
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  });

  // Manual update all subscribers endpoint
  app.post('/api/admin/update-all-subscribers', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      // Run update in background
      updateAllChannelSubscribers().catch(error => {
        console.error('Background subscriber update error:', error);
      });

      res.json({ message: "Subscriber count update started in background" });
    } catch (error) {
      console.error("Error starting subscriber update:", error);
      res.status(500).json({ message: "Failed to start subscriber update" });
    }
  });

  // Withdrawal requests routes
  app.post('/api/withdrawal-requests', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;

      if (!user || !['admin', 'moderator', 'watcher'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { amount, method, phoneNumber, bankName, cardNumber } = req.body;

      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Сумма должна быть больше 0" });
      }

      if (!method || !['sbp', 'card'].includes(method)) {
        return res.status(400).json({ message: "Неверный способ вывода" });
      }

      if (method === 'sbp' && (!phoneNumber || !bankName)) {
        return res.status(400).json({ message: "Для СБП необходимо указать номер телефона и банк" });
      }

      if (method === 'card' && !cardNumber) {
        return res.status(400).json({ message: "Для карты необходимо указать номер карты" });
      }

      // Check user balance
      const userBalance = parseFloat(user.balance || '0');
      const withdrawalAmount = parseFloat(amount);

      if (userBalance < withdrawalAmount) {
        return res.status(400).json({ message: "Недостаточно средств на балансе" });
      }

      // Create withdrawal request
      const requestData = {
        userId: user.id,
        amount,
        method,
        phoneNumber: method === 'sbp' ? phoneNumber : null,
        bankName: method === 'sbp' ? bankName : null,
        cardNumber: method === 'card' ? cardNumber : null,
        status: 'pending'
      };

      const request = await storage.createWithdrawalRequest(requestData);

      // Deduct amount from user balance
      await storage.updateUserBalance(user.id, `-${amount}`);

      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating withdrawal request:", error);
      res.status(500).json({ message: "Failed to create withdrawal request" });
    }
  });

  app.patch('/api/withdrawal-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const requestId = parseInt(req.params.id);
      const { status, rejectionReason } = req.body;

      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Неверный статус" });
      }

      const updatedRequest = await storage.updateWithdrawalRequestStatus(
        requestId,
        status,
        user.id,
        rejectionReason
      );

      // Создаем уведомление для пользователя
      const requestUser = await storage.getUser(updatedRequest.userId);
      if (requestUser) {
        await storage.createNotification({
          userId: updatedRequest.userId,
          type: status === 'approved' ? 'withdrawal_approved' : 'withdrawal_rejected',
          title: status === 'approved' ? 'Заявка на вывод одобрена' : 'Заявка на вывод отклонена',
          message: status === 'approved'
            ? `Ваша заявка на вывод ${updatedRequest.amount} ₽ была одобрена`
            : `Ваша заявка на вывод ${updatedRequest.amount} ₽ была отклонена. ${rejectionReason || 'Причина не указана'}`
        });
      }

      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating withdrawal request:", error);
      res.status(500).json({ message: "Failed to update withdrawal request" });
    }
  });

  app.get('/api/withdrawal-requests', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const status = req.query.status as string;
      const requests = await storage.getWithdrawalRequests(status);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching withdrawal requests:", error);
      res.status(500).json({ message: "Failed to fetch withdrawal requests" });
    }
  });

  app.get('/api/user/withdrawal-requests', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const requests = await storage.getUserWithdrawalRequests(user.id);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching user withdrawal requests:", error);
      res.status(500).json({ message: "Failed to fetch withdrawal requests" });
    }
  });

  app.patch('/api/withdrawal-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const requestId = parseInt(req.params.id);

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { status, rejectionReason } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const request = await storage.updateWithdrawalRequestStatus(
        requestId,
        status,
        user.id,
        rejectionReason
      );

      // If rejected, return money to user
      if (status === 'rejected') {
        await storage.updateUserBalance(request.userId, request.amount);
      }

      res.json(request);
    } catch (error) {
      console.error("Error updating withdrawal request:", error);
      res.status(500).json({ message: "Failed to update withdrawal request" });
    }
  });

  // Get current user route
  // Удален дублированный endpoint - используется полный endpoint выше

  // Promote channel to ultra top
  app.post('/api/channels/:id/promote-ultra-top', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const channelId = parseInt(req.params.id);
      const { days } = req.body;

      if (!user || !['admin', 'moderator', 'user'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Строгая валидация дней
      const numDays = parseInt(days);
      if (!days || isNaN(numDays) || numDays < 1 || numDays > 365) {
        return res.status(400).json({ message: "Количество дней должно быть от 1 до 365" });
      }

      // Дополнительная проверка на строковое представление (защита от "010" и т.п.)
      if (String(numDays) !== String(days) || String(days).startsWith('0')) {
        return res.status(400).json({ message: "Неверный формат количества дней" });
      }

      const channel = await storage.getChannelById(channelId);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }

      // Check if user owns the channel or is admin/moderator
      if (channel.ownerId !== user.id && !['admin', 'moderator'].includes(user.role)) {
        return res.status(403).json({ message: "You can only promote your own channels" });
      }

      // Calculate price
      const basePrice = 500;
      let price = basePrice * days;

      // Применяем скидку 10% для 7+ дней
      const finalPrice = days >= 7 ? Math.round(price * 0.9) : price;

      // Check user balance
      const userBalance = parseFloat(user.balance || '0');
      if (userBalance < finalPrice) {
        return res.status(400).json({ message: "Недостаточно средств на балансе" });
      }

      // Deduct balance
      await storage.updateUserBalance(user.id, `-${finalPrice}`);

      // Promote channel
      const updatedChannel = await storage.promoteChannelToUltraTop(channelId, numDays);

      // Create payment record
      await storage.createPayment({
        userId: user.id,
        amount: finalPrice.toString(),
        type: 'ultra_top_promotion',
        applicationId: null,
        status: 'completed',
      });

      res.json(updatedChannel);
    } catch (error) {
      console.error("Error promoting channel to ultra top:", error);
      res.status(500).json({ message: "Failed to promote channel to ultra top" });
    }
  });

app.post('/api/channels/:id/promote-top', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const channelId = parseInt(req.params.id);

      if (!user || !['admin', 'moderator', 'user'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const channel = await storage.getChannelById(channelId);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }

      // Check if user owns the channel or is admin/moderator
      if (channel.ownerId !== user.id && !['admin', 'moderator'].includes(user.role)) {
        return res.status(403).json({ message: "You can only promote your own channels" });
      }

      // Fixed price for TOP promotion
      const topPrice = 50;

      // Check user balance
      const userBalance = parseFloat(user.balance || '0');
      if (userBalance < topPrice) {
        return res.status(400).json({ message: "Недостаточно средств на балансе" });
      }

      // Deduct balance
      await storage.updateUserBalance(user.id, `-${topPrice}`);

      // Promote channel - TOP promotion (постоянное размещение)
      const updatedChannel = await storage.promoteChannelToTop(channelId);

      // Create payment record
      await storage.createPayment({
        userId: user.id,
        amount: topPrice.toString(),
        type: 'top_promotion',
        applicationId: null,
        status: 'completed',
      });

      res.json(updatedChannel);
    } catch (error) {
      console.error("Error promoting channel to top:", error);
      res.status(500).json({ message: "Failed to promote channel to top" });
    }
  });

  const appRouter = express.Router();

  // Sitemap generation
  appRouter.get('/sitemap.xml', async (req, res) => {
    try {
      const baseUrl = 'https://tgflovv.ru';

      // Get all channels
      const allChannels = await db.select().from(channels).where(eq(channels.status, "approved"));

      // Get all categories
      const allCategories = await db.select().from(categories);

      // Get all news
      const allNews = await db.select().from(news);

      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/channels</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/popular</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/news</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;

      // Add categories
      allCategories.forEach(category => {
        sitemap += `
  <url>
    <loc>${baseUrl}/channels?category=${category.id}</loc>
    <lastmod>${new Date(category.updatedAt || category.createdAt).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      });

      // Add channels
      allChannels.forEach(channel => {
        sitemap += `
  <url>
    <loc>${baseUrl}/channels/${channel.id}</loc>
    <lastmod>${new Date(channel.updatedAt || channel.createdAt).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
      });

      // Add news
      allNews.forEach(newsItem => {
        sitemap += `
  <url>
    <loc>${baseUrl}/news/${newsItem.id}</loc>
    <lastmod>${new Date(newsItem.updatedAt || newsItem.createdAt).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;
      });

      sitemap += `
</urlset>`;

      res.setHeader('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  app.use('/', appRouter);

  const httpServer = createServer(app);

  // Автоматическая установка webhook при запуске сервера
  setTimeout(async () => {
    try {
      const webhookResult = await setWebhook();
    } catch (error) {
      // Webhook setup failed silently
    }
  }, 2000); // Задержка 2 секунды для полной инициализации сервера

  // Автоматическое обновление количества подписчиков каждый час
  setInterval(async () => {
    try {
      console.log('🔄 Starting automatic subscriber count update...');
      await updateAllChannelSubscribers();
    } catch (error) {
      console.error('❌ Error in automatic subscriber count update:', error);
    }
  }, 60 * 60 * 1000); // 1 час

  // Автоматическая очистка истекших продвижений каждые 30 минут
  setInterval(async () => {
    try {
      console.log('🧹 Starting automatic expired promotions cleanup...');
      await storage.cleanupExpiredPromotions();
    } catch (error) {
      console.error('❌ Error in automatic promotions cleanup:', error);
    }
  }, 30 * 60 * 1000); // 30 минут

  // Автоматическое обновление приватных каналов каждые 30 минут
  setInterval(async () => {
    try {
      console.log('🔄 Starting private channels subscriber count update...');
      const { updatePrivateChannelsSubscribers } = await import('./telegram-bot');
      await updatePrivateChannelsSubscribers();
    } catch (error) {
      console.error('❌ Error in private channels subscriber count update:', error);
    }
  }, 30 * 60 * 1000); // 30 минут

  // Support chat API endpoints
  app.get('/api/support/messages', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const messages = await storage.getSupportMessages(user.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching support messages:", error);
      res.status(500).json({ message: "Failed to fetch support messages" });
    }
  });

  app.get('/api/support/chats', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const chats = await storage.getSupportChats();
      res.json(chats);
    } catch (error) {
      console.error("Error fetching support chats:", error);
      res.status(500).json({ message: "Failed to fetch support chats" });
    }
  });

  app.get('/api/support/chat/:chatId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { chatId } = req.params;
      const messages = await storage.getSupportMessagesByChatId(chatId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.get('/api/support/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const count = await storage.getUnreadSupportCount(user.id);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread support count:", error);
      res.status(500).json({ message: "Failed to fetch unread support count" });
    }
  });

  app.post('/api/support/send', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const user = req.user;
      const { message, chatId } = req.body;
      const file = req.file;

      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if ((!message || !message.trim()) && !file) {
        return res.status(400).json({ message: "Message or file is required" });
      }

      let targetUserId = user.id;
      let isFromAdmin = user.role === 'admin';
      let messageText = message ? message.trim() : '';

      // Если админ отвечает в конкретный чат
      if (user.role === 'admin' && chatId) {
        const chat = await storage.getSupportChatById(chatId);
        if (!chat) {
          return res.status(404).json({ message: "Chat not found" });
        }
        targetUserId = chat.userId;
      }

      // Если есть файл, обрабатываем его
      if (file) {
        // Проверяем размер файла (максимум 10МБ)
        if (file.size > 10 * 1024 * 1024) {
          return res.status(400).json({ message: "File size must be less than 10MB" });
        }

        // Генерируем уникальное имя файла
        const fileExtension = file.originalname.split('.').pop() || '';
        const filename = `support_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;

        // Создаем сообщение с файлом
        messageText = messageText
          ? `${messageText} [Файл: ${file.originalname}]`
          : `[Файл: ${file.originalname}]`;

        const supportMessage = await storage.createSupportMessage({
          userId: targetUserId,
          message: messageText,
          isFromAdmin,
          chatId: chatId || `user_${targetUserId}`,
          adminUserId: isFromAdmin ? user.id : undefined,
        });

        // Сохраняем файл
        await storage.createSupportFile({
          messageId: supportMessage.id,
          filename: filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          fileData: file.buffer.toString('base64'),
          fileSize: file.size,
        });

        res.json(supportMessage);
      } else {
        // Обычное текстовое сообщение
        const supportMessage = await storage.createSupportMessage({
          userId: targetUserId,
          message: messageText,
          isFromAdmin,
          chatId: chatId || `user_${targetUserId}`,
          adminUserId: isFromAdmin ? user.id : undefined,
        });

        res.json(supportMessage);
      }
    } catch (error) {
      console.error("Error sending support message:", error);
      res.status(500).json({ message: "Failed to send support message" });
    }
  });

  app.post('/api/support/mark-read/:chatId', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { chatId } = req.params;

      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      await storage.markSupportMessagesAsRead(user.id, chatId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking support messages as read:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  app.post('/api/support/resolve-chat/:chatId', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { chatId } = req.params;

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.resolveSupportChat(chatId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error resolving support chat:", error);
      res.status(500).json({ message: "Failed to resolve chat" });
    }
  });

  // Support file serving route
  app.get('/api/support/file/:filename', async (req, res) => {
    try {
      const { filename } = req.params;

      // Извлекаем messageId из имени файла
      const messageIdMatch = filename.match(/support_(\d+)_/);
      if (!messageIdMatch) {
        return res.status(400).json({ message: "Invalid filename format" });
      }

      const messageId = parseInt(messageIdMatch[1]);
      const file = await storage.getSupportFileByMessageId(messageId);

      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      // Извлекаем MIME type и данные из base64 строки
      const base64Data = file.fileData;
      const buffer = Buffer.from(base64Data, 'base64');

      res.set({
        'Content-Type': file.mimeType,
        'Content-Length': buffer.length,
        'Cache-Control': 'public, max-age=3600',
        'Content-Disposition': `inline; filename="${file.originalName}"`
      });

      res.send(buffer);
    } catch (error) {
      console.error("Error serving support file:", error);
      res.status(500).json({ message: "Failed to serve file" });
    }
  });

  // Broadcast API endpoints
  app.get('/api/broadcast/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const stats = await storage.getBroadcastStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting broadcast stats:", error);
      res.status(500).json({ message: "Failed to get broadcast stats" });
    }
  });

  app.post('/api/broadcast/send', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { type, subject, message } = req.body;

      if (!type || !message) {
        return res.status(400).json({ message: "Type and message are required" });
      }

      if (type === 'email' && !subject) {
        return res.status(400).json({ message: "Subject is required for email broadcast" });
      }

      let sentCount = 0;

      if (type === 'email') {
        // Send email broadcast
        const emailUsers = await storage.getUsersForEmailBroadcast();

        const { sendBroadcastEmail } = await import('./email');

        for (const emailUser of emailUsers) {
          try {
            await sendBroadcastEmail(emailUser.email!, subject, message);
            sentCount++;
          } catch (error) {
            console.error(`Failed to send email to ${emailUser.email}:`, error);
          }
        }
      } else if (type === 'telegram') {
        // Send telegram broadcast
        const telegramUsers = await storage.getUsersForTelegramBroadcast();

        try {
          const { sendBroadcastMessage } = await import('./telegram-bot');

          for (const telegramUser of telegramUsers) {
            try {
              await sendBroadcastMessage(telegramUser.telegramId!, message);
              sentCount++;
            } catch (error) {
              console.error(`Failed to send telegram message to ${telegramUser.telegramId}:`, error);
            }
          }
        } catch (importError) {
          console.error("Failed to import telegram bot functions:", importError);
          return res.status(500).json({ message: "Telegram bot not available" });
        }
      }

      res.json({ sentCount });
    } catch (error) {
      console.error("Error sending broadcast:", error);
      res.status(500).json({ message: "Failed to send broadcast" });
    }
  });

  // CloudPayments API Routes
  app.post("/api/cloudpayments/success", isAuthenticated, async (req: any, res) => {
    try {
      console.log('🔵 CloudPayments success handler called:', {
        body: req.body,
        headers: {
          'content-type': req.headers['content-type'],
          'user-agent': req.headers['user-agent']
        },
        session: req.session?.id,
        user: req.user?.id,
        timestamp: new Date().toISOString()
      });

      const { transactionId, amount, invoiceId, email } = req.body;

      const user = req.user;
      if (!user || !user.id) {
        console.error('❌ User object is invalid:', user);
        return res.status(401).json({
          success: false,
          message: "Неверные данные пользователя"
        });
      }

      if (!amount || !invoiceId) {
        console.error('❌ Missing required payment data:', { transactionId, amount, invoiceId });
        return res.status(400).json({
          success: false,
          message: "Отсутствуют обязательные данные платежа"
        });
      }

      // Генерируем ID транзакции если отсутствует
      const finalTransactionId = transactionId || `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue < 50 || amountValue > 500000) {
        console.error('❌ Invalid amount value:', amount);
        return res.status(400).json({
          success: false,
          message: "Сумма должна быть от 50 до 500000 рублей"
        });
      }

      // Проверяем, не обработан ли уже этот платеж
      try {
        const existingPayment = await storage.getPaymentByInvoiceId(invoiceId);
        if (existingPayment) {
          console.log('⚠️ Payment already processed:', invoiceId);
          const currentBalance = await storage.getUserBalance(user.id);
          return res.json({
            success: true,
            message: "Платеж уже обработан",
            newBalance: currentBalance
          });
        }
      } catch (error) {
        console.log('⚠️ Could not check existing payment, proceeding...', error);
      }

      // Получаем текущий баланс для логирования
      const oldBalance = await storage.getUserBalance(user.id);
      console.log('📊 Current balance before update:', oldBalance);

      // Пополняем баланс пользователя
      console.log('💰 Updating user balance:', { userId: user.id, amount: amountValue.toString() });
      const updatedUser = await storage.updateUserBalance(user.id, amountValue.toString());

      // Получаем новый баланс
      const newBalance = await storage.getUserBalance(user.id);
      console.log('💰 New balance after update:', newBalance);

      // Создаем запись о платеже
      try {
        const payment = await storage.createPayment({
          userId: user.id,
          amount: amountValue.toFixed(2),
          type: 'balance_topup',
          applicationId: null,
          status: 'completed',
          transactionId: finalTransactionId.toString(),
          invoiceId: invoiceId
        });
        console.log('✅ Payment record created:', payment.id);
      } catch (paymentError) {
        console.error('⚠️ Could not create payment record:', paymentError);
        // Продолжаем выполнение, так как баланс уже обновлен
      }

      // Создаем уведомление
      try {
        await storage.createNotification({
          userId: user.id,
          type: 'balance_topup',
          title: 'Баланс пополнен',
          message: `Ваш баланс пополнен на ${amountValue} рублей`
        });
        console.log('🔔 Notification created');
      } catch (notificationError) {
        console.error('⚠️ Could not create notification:', notificationError);
        // Не критично, продолжаем
      }

      console.log('✅ Payment processed successfully:', {
        userId: user.id,
        amount: amountValue,
        oldBalance,
        newBalance,
        invoiceId
      });

      res.json({
        success: true,
        message: `Баланс пополнен на ${amountValue} рублей`,
        newBalance: newBalance,
        amount: amountValue
      });
    } catch (error: any) {
      console.error("❌ CloudPayments success handler error:", error);
      console.error("❌ Error stack:", error.stack);
      
      // Возвращаем более детальную информацию об ошибке
      res.status(500).json({
        success: false,
        message: "Ошибка при обработке платежа. Обратитесь в поддержку.",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  });

  app.post("/api/cloudpayments/notification", async (req, res) => {
    try {
      const notification = req.body;
      const hmacHeader = req.headers['content-hmac'] as string;

      console.log('🔔 CloudPayments notification received:', {
        notification,
        hmacHeader: hmacHeader ? 'present' : 'missing',
        timestamp: new Date().toISOString()
      });

      // Для тестового режима пропускаем проверку HMAC
      if (process.env.NODE_ENV === 'production') {
        const { cloudPaymentsAPI } = await import('./cloudpayments');

        // Проверяем подпись уведомления только в продакшене
        if (hmacHeader && !cloudPaymentsAPI.verifyNotification(notification, hmacHeader)) {
          console.error('❌ Invalid HMAC signature');
          return res.status(400).send('Invalid signature');
        }
      }

      // Проверяем статус платежа
      if (notification.Status !== 'Completed') {
        console.log('⚠️ Payment not completed, status:', notification.Status);
        return res.send('OK');
      }

      // Проверяем, не обработан ли уже этот платеж
      const existingPayment = await storage.getPaymentByInvoiceId(notification.InvoiceId);
      if (existingPayment) {
        console.log('⚠️ Payment already processed via notification:', notification.InvoiceId);
        return res.send('OK');
      }

      // Ищем пользователя по AccountId (email)
      const user = await storage.getUserByEmail(notification.AccountId);
      if (!user) {
        console.error('❌ User not found for email:', notification.AccountId);
        return res.status(404).send('User not found');
      }

      const amount = parseFloat(notification.Amount);

      // Проверяем минимальную сумму
      if (amount < 50) {
        console.error('❌ Amount below minimum:', amount);
        return res.status(400).send('Amount below minimum');
      }

      console.log('💰 Processing notification payment:', {
        userId: user.id,
        amount: amount,
        transactionId: notification.TransactionId,
        invoiceId: notification.InvoiceId
      });

      // Пополняем баланс пользователя
      await storage.updateUserBalance(user.id, notification.Amount);

      // Создаем запись о платеже
      await storage.createPayment({
        userId: user.id,
        amount: notification.Amount,
        type: 'balance_topup',
        applicationId: null,
        status: 'completed',
        transactionId: notification.TransactionId.toString(),
        invoiceId: notification.InvoiceId
      });

      // Создаем уведомление
      await storage.createNotification({
        userId: user.id,
        type: 'balance_topup',
        title: 'Баланс пополнен',
        message: `Ваш баланс пополнен на ${amount} рублей`
      });

      console.log(`✅ Balance topped up via notification for user ${user.id}: ${amount} rubles`);
      res.send('OK');
    } catch (error: any) {
      console.error("❌ CloudPayments notification error:", error);
      console.error("❌ Error stack:", error.stack);
      res.status(500).send("Error processing notification");
    }
  });

  app.get("/api/cloudpayments/status/:transactionId", isAuthenticated, async (req: any, res) => {
    try {
      const { transactionId } = req.params;
      const user = req.user;

      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!transactionId) {
        return res.status(400).json({ message: "TransactionId is required" });
      }

      const { cloudPaymentsAPI } = await import('./cloudpayments');
      const result = await cloudPaymentsAPI.getPaymentStatus(parseInt(transactionId));

      res.json(result);
    } catch (error: any) {
      console.error("CloudPayments status error:", error);
      res.status(500).json({
        message: "Failed to get payment status",
        error: error.message
      });
    }
  });

  // CloudPayments API endpoints
  app.post('/api/cloudpayments/charge', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { amount, description, email } = req.body;

      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      // Создаем заказ в нашей системе
      const orderId = `cp_${nanoid(10)}`;
      
      // Возвращаем данные для виджета CloudPayments
      res.json({
        publicId: appConfig.CLOUDPAYMENTS_PUBLIC_ID,
        amount,
        currency: 'RUB',
        invoiceId: orderId,
        description,
        email,
        accountId: user.id.toString(),
        data: {
          userId: user.id,
          email: user.email || email
        }
      });
    } catch (error) {
      console.error("Error creating CloudPayments charge:", error);
      res.status(500).json({ message: "Failed to create charge" });
    }
  });

  // CloudPayments webhook для обработки уведомлений
  app.post('/api/cloudpayments/webhook', async (req, res) => {
    try {
      const notification = req.body;
      
      console.log('📦 CloudPayments webhook received:', notification);

      // Проверяем подпись (в продакшене обязательно)
      if (appConfig.NODE_ENV === 'production') {
        const hmacHeader = req.headers['x-cp-hmac-signature'];
        if (!hmacHeader) {
          return res.status(400).json({ message: "Missing HMAC signature" });
        }

        const { cloudPaymentsAPI } = await import('./cloudpayments');
        const isValid = cloudPaymentsAPI.verifyNotification(notification, hmacHeader as string);
        
        if (!isValid) {
          return res.status(400).json({ message: "Invalid HMAC signature" });
        }
      }

      // Обрабатываем успешный платеж
      if (notification.Status === 'Completed') {
        const userId = parseInt(notification.AccountId);
        const amount = parseFloat(notification.Amount);
        const invoiceId = notification.InvoiceId;

        // Проверяем, что пользователь существует
        const user = await storage.getUser(userId);
        if (!user) {
          console.error('User not found:', userId);
          return res.status(404).json({ message: "User not found" });
        }

        // Пополняем баланс пользователя
        const oldBalance = await storage.getUserBalance(userId);
        console.log('📊 Current balance before update:', oldBalance);

        // Пополняем баланс пользователя
        console.log('💰 Updating user balance:', { userId, amount });
        await storage.updateUserBalance(userId, amount.toString());

        // Создаем запись о платеже
        await storage.createPayment({
          userId,
          amount: amount.toString(),
          type: 'balance_topup',
          applicationId: null,
          status: 'completed',
          transactionId: notification.TransactionId?.toString() || invoiceId,
          paymentMethod: 'cloudpayments'
        });

        // Создаем уведомление для пользователя
        await storage.createNotification({
          userId,
          type: 'balance_topup',
          title: 'Баланс пополнен',
          message: `Ваш баланс пополнен на ${amount}₽ через CloudPayments`
        });

        const newBalance = await storage.getUserBalance(userId);
        console.log('💰 New balance after update:', newBalance);

        console.log('✅ CloudPayments payment processed successfully:', {
          userId,
          amount,
          invoiceId,
          transactionId: notification.TransactionId
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error processing CloudPayments webhook:", error);
      res.status(500).json({ message: "Failed to process webhook" });
    }
  });

  // Тестовая страница webhook отладки
  app.get('/api/cloudpayments/test-webhook', isAuthenticated, async (req: any, res) => {
    const user = req.user;
    if (!user || !user.email) {
      return res.status(401).json({ message: "Unauthorized or missing email" });
    }

    const webhookUrl = `${appConfig.BASE_URL}/api/cloudpayments/webhook`;
    const amount = req.query.amount || '100.00';
    const testData = {
      TransactionId: Math.floor(Math.random() * 100000),
      Amount: amount.toString(),
      Currency: 'RUB',
      Status: 'Completed',
      AccountId: user.email,
      InvoiceId: `test_${Date.now()}`,
      DateTime: new Date().toISOString(),
      CardFirstSix: '411111',
      CardLastFour: '1111',
      CardType: 'Visa',
      TestMode: '1'
    };

    res.json({
      message: 'CloudPayments webhook test data',
      webhookUrl: webhookUrl,
      testData: testData,
      instructions: `Send POST request to ${webhookUrl} with this test data`,
      currentDomain: appConfig.BASE_URL
    });
  });

  // Тестовый endpoint для проверки CloudPayments
  app.get('/api/cloudpayments/test', async (req, res) => {
    try {
      res.json({
        success: true,
        publicId: appConfig.CLOUDPAYMENTS_PUBLIC_ID,
        testMode: appConfig.NODE_ENV !== 'production',
        message: 'CloudPayments integration is working'
      });
    } catch (error) {
      console.error("Error testing CloudPayments:", error);
      res.status(500).json({ message: "CloudPayments test failed" });
    }
  });

  // Add missing ROBOKASSA columns if they don't exist
  app.get('/api/robokassa/init-db', async (req, res) => {
    try {
      await db.execute(sql`
        ALTER TABLE payments 
        ADD COLUMN IF NOT EXISTS robokassa_invoice_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS robokassa_signature VARCHAR(255),
        ADD COLUMN IF NOT EXISTS result_processed BOOLEAN NOT NULL DEFAULT false
      `);
      res.json({ success: true, message: "Database initialized" });
    } catch (error) {
      console.error("Error initializing database:", error);
      res.status(500).json({ message: "Database initialization failed" });
    }
  });

  // ROBOKASSA payment routes
  app.post('/api/robokassa/create-payment', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Необходима авторизация" });
      }

      const { amount } = req.body;
      const amountNum = parseFloat(amount);

      if (!amount || amountNum <= 0) {
        return res.status(400).json({ message: "Неверная сумма" });
      }

      if (amountNum < 10) {
        return res.status(400).json({ message: "Минимальная сумма пополнения - 10 рублей" });
      }

      // Generate unique invoice ID
      const invoiceId = generateInvoiceId();
      
      // Create payment record using storage method to avoid schema issues
      const payment = await storage.createPayment({
        userId: user.id,
        amount: amount.toString(),
        type: 'balance_topup',
        applicationId: null,
        status: 'pending',
        invoiceId: invoiceId
      });

      console.log('💳 Creating payment URL with:', {
        amount: amountNum,
        invoiceId,
        description: `Пополнение баланса - ${user.username}`,
        email: user.email,
        testMode: false
      });
      
      // Проверяем конфигурацию Робокассы
      console.log('🔧 Robokassa config check:', {
        merchantLogin: appConfig.ROBOKASSA_MERCHANT_LOGIN,
        password1Length: appConfig.ROBOKASSA_PASSWORD_1?.length || 0,
        password2Length: appConfig.ROBOKASSA_PASSWORD_2?.length || 0
      });

      // Добавляем небольшую задержку для избежания rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create payment URL in production mode
      const paymentUrl = createPaymentUrl(
        amountNum,
        invoiceId,
        `Пополнение баланса - ${user.username}`,
        user.email || undefined,
        false // Боевой режим для активного магазина
      );
      
      console.log('🏭 Creating payment in PRODUCTION mode with delay');

      console.log('✅ Payment URL created:', paymentUrl);

      res.json({
        paymentId: payment.id,
        paymentUrl,
        amount: amountNum,
        invoiceId
      });
    } catch (error) {
      console.error("Error creating ROBOKASSA payment:", error);
      console.error("Error details:", error.message);
      res.status(500).json({ 
        message: "Ошибка создания платежа",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // ROBOKASSA Result URL handler
  app.post('/api/robokassa/result', async (req, res) => {
    try {
      const { OutSum, InvId, SignatureValue } = req.body;

      if (!OutSum || !InvId || !SignatureValue) {
        return res.status(400).send('Bad Request');
      }

      // Verify signature
      const isValid = verifyPaymentResult({
        outSum: OutSum,
        invId: InvId,
        signatureValue: SignatureValue
      });

      if (!isValid) {
        console.error('Invalid ROBOKASSA signature:', { OutSum, InvId, SignatureValue });
        return res.status(400).send('Invalid signature');
      }

      // Find payment by invoice ID using storage method
      const payment = await storage.getPaymentByInvoiceId(InvId);

      if (!payment) {
        console.error('Payment not found for invoice:', InvId);
        return res.status(404).send('Payment not found');
      }

      // Check if already processed
      if (payment.status === 'completed') {
        return res.send('OK' + InvId);
      }

      // Update payment status
      await db.update(payments)
        .set({
          status: 'completed',
          updatedAt: new Date()
        })
        .where(eq(payments.id, payment.id));

      // Add to user balance
      await storage.updateUserBalance(payment.userId, payment.amount);

      // Create notification
      await storage.createNotification({
        userId: payment.userId,
        type: 'balance_topup',
        title: 'Баланс пополнен',
        message: `Ваш баланс пополнен на ${payment.amount} ₽`
      });

      console.log(`✅ ROBOKASSA payment processed: ${InvId}, amount: ${OutSum}`);
      res.send('OK' + InvId);
    } catch (error) {
      console.error("Error processing ROBOKASSA result:", error);
      res.status(500).send('Internal Server Error');
    }
  });

  // ROBOKASSA Success URL handler  
  app.get('/success.php', async (req, res) => {
    const { InvId, OutSum } = req.query;
    res.redirect(`/?payment=success&amount=${OutSum}&invoice=${InvId}`);
  });

  // ROBOKASSA Fail URL handler
  app.get('/fail.php', async (req, res) => {
    const { InvId } = req.query;
    res.redirect(`/?payment=failed&invoice=${InvId}`);
  });

  return httpServer;
}

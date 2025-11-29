import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual, createHmac } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { z } from "zod";
import config from "../config";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    // Проверяем, что stored пароль имеет правильный формат
    if (!stored || typeof stored !== 'string' || !stored.includes('.')) {
      console.error("Invalid stored password format:", { stored: stored ? "exists" : "null", type: typeof stored, includesDot: stored?.includes('.') });
      return false;
    }

    const [hashed, salt] = stored.split(".");

    // Проверяем, что у нас есть и хеш, и соль
    if (!hashed || !salt) {
      console.error("Missing hash or salt in stored password:", { hashedLength: hashed?.length, saltLength: salt?.length });
      return false;
    }

    // Проверяем, что supplied пароль не пустой
    if (!supplied || typeof supplied !== 'string') {
      console.error("Invalid supplied password:", { supplied: supplied ? "exists" : "null", type: typeof supplied });
      return false;
    }

    // Проверяем, что хеш имеет корректную длину (должен быть hex-строкой длиной 128 символов для 64-байтного буфера)
    if (hashed.length !== 128) {
      console.error("Invalid hash length:", { expectedLength: 128, actualLength: hashed.length });
      return false;
    }

    // Проверяем, что соль имеет корректную длину (должна быть hex-строкой длиной 32 символа для 16-байтного буфера)
    if (salt.length !== 32) {
      console.error("Invalid salt length:", { expectedLength: 32, actualLength: salt.length });
      return false;
    }

    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;

    // Проверяем, что буферы имеют одинаковую длину
    if (hashedBuf.length !== suppliedBuf.length) {
      console.error("Buffer length mismatch:", { storedLength: hashedBuf.length, suppliedLength: suppliedBuf.length });
      return false;
    }

    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}

// Функция для верификации данных от Telegram
function verifyTelegramAuth(authData: any, botToken: string): boolean {
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();

  const dataCheckString = Object.keys(authData)
    .filter(key => key !== 'hash')
    .sort()
    .map(key => `${key}=${authData[key]}`)
    .join('\n');

  const hash = createHmac('sha256', secret).update(dataCheckString).digest('hex');

  return hash === authData.hash;
}

// Функция для получения аватарки пользователя из Telegram
async function getTelegramUserPhoto(userId: string, botToken: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getUserProfilePhotos?user_id=${userId}&limit=1`);
    const data = await response.json();

    if (data.ok && data.result.total_count > 0) {
      const fileId = data.result.photos[0][0].file_id;

      const fileResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
      const fileData = await fileResponse.json();

      if (fileData.ok) {
        return `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
      }
    }

    return null;
  } catch (error) {
    console.error('Ошибка при получении аватарки из Telegram:', error);
    return null;
  }
}

export { comparePasswords, hashPassword };

export function setupAuth(app: Express) {
  const PostgresSessionStore = connectPg(session);
  const sessionStore = new PostgresSessionStore({
    conString: config.DATABASE_URL,
    createTableIfMissing: false, // Don't create table automatically
    ttl: 7 * 24 * 60 * 60 * 1000, // 1 week
    tableName: "sessions", // Use the existing sessions table
    schemaName: "public",
    columnNames: {
      session_id: "session_id",
      expires: "expires",
      data: "data"
    }
  });

  const sessionSettings: session.SessionOptions = {
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username.toLowerCase());
        if (!user || !user.password || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  // Google OAuth Strategy with session-aware linking
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
    : config.BASE_URL;
  
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.GOOGLE_CLIENT_ID || "",
        clientSecret: config.GOOGLE_CLIENT_SECRET || "",
        callbackURL: `${baseUrl}/api/auth/google/callback`,
        passReqToCallback: true, // Включаем передачу req для доступа к сессии
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          // Проверяем, является ли это попыткой привязки аккаунта
          const isLinkingAttempt = req.session && req.user;

          // Check if user exists by Google ID
          let user = await storage.getUserByGoogleId(profile.id);

          if (user) {
            // Google аккаунт уже привязан к пользователю
            if (isLinkingAttempt && req.user.id !== user.id) {
              // Попытка привязать Google аккаунт, который уже привязан к другому пользователю
              return done(new Error('GOOGLE_ALREADY_LINKED_TO_OTHER_USER'), null);
            }
            return done(null, user);
          }

          // Если это попытка привязки к существующему аккаунту
          if (isLinkingAttempt) {
            const currentUser = req.user;

            // Проверяем, не привязан ли уже Google к текущему пользователю
            if (currentUser.googleId && currentUser.googleId !== profile.id) {
              return done(new Error('USER_ALREADY_HAS_GOOGLE_ACCOUNT'), null);
            }

            // Привязываем Google к текущему аккаунту
            await storage.updateUserGoogleId(currentUser.id, profile.id);
            const updatedUser = await storage.getUser(currentUser.id);
            return done(null, updatedUser);
          }

          // Check if user exists by email for new registration
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await storage.getUserByEmail(email);
            if (user) {
              // Проверяем, есть ли уже привязанный Google аккаунт
              if (user.googleId && user.googleId !== profile.id) {
                return done(new Error('EMAIL_ALREADY_HAS_DIFFERENT_GOOGLE'), null);
              }

              // Link Google account to existing user
              await storage.updateUserGoogleId(user.id, profile.id);
              return done(null, user);
            }
          }

          // Create new user
          const incognitoAvatarUrl = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjNDc0NzQ3Ii8+CjxwYXRoIGQ9Ik01MCA1MEMzOC4xIDUwIDI5IDQxLjUgMjkgMzFDMjkgMjAuNSAzOC4xIDEyIDUwIDEyQzYxLjkgMTIgNzEgMjAuNSA3MSAzMUM3MSA0MS41IDYxLjkgNTAgNTAgNTBaTTIwIDgwQzIwIDY0LjQgMzQuNCA1MCA1MCA1MEM2NS42IDUwIDgwIDY0LjQgODAgODBWODVIMjBWODBaIiBmaWxsPSIjOTA5MDkwIi8+Cjx0ZXh0IHg9IjUwIiB5PSI5NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSIjQUFBQUFBIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbmNvZ25pdG88L3RleHQ+Cjwvc3ZnPgo=";

          // Extract username from email by removing domain
          const userEmail = profile.emails?.[0]?.value || "";
          let usernameFromEmail = userEmail.split('@')[0] || `google_${profile.id}`;
          
          // Check if username already exists, if so, add a suffix
          let finalUsername = usernameFromEmail;
          let counter = 1;
          while (await storage.getUserByUsername(finalUsername)) {
            finalUsername = `${usernameFromEmail}_${counter}`;
            counter++;
          }

          user = await storage.createUser({
            username: finalUsername,
            email: userEmail,
            password: "", // No password for OAuth users
            firstName: profile.name?.givenName || "",
            lastName: profile.name?.familyName || "",
            role: "user",
            balance: "0.00",
            profileImageUrl: profile.photos?.[0]?.value || incognitoAvatarUrl,
            googleId: profile.id,
          });

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );



  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        console.warn(`User with id ${id} not found during deserialization`);
        return done(null, false); // Не ошибка, просто пользователь не найден
      }
      done(null, user);
    } catch (error) {
      console.error(`Error deserializing user ${id}:`, error);
      done(null, false); // Не передаем ошибку, чтобы не прерывать обработку запроса
    }
  });

  // Send registration verification code
  app.post("/api/register/send-verification", async (req, res) => {
    try {
      const { username, email, password, firstName, lastName } = req.body;
      const clientIP = req.ip || req.connection.remoteAddress;

      // Validate input
      if (!username || !password || !email) {
        return res.status(400).json({ message: "Логин, пароль и email обязательны" });
      }

      // Проверка на валидность имени пользователя
      if (username.length < 3 || username.length > 30) {
        return res.status(400).json({ message: "Логин должен содержать от 3 до 30 символов" });
      }

      // Проверка на запрещенные слова в логине
      const forbiddenWords = ['admin', 'administrator', 'root', 'system', 'test', 'null', 'undefined', 'api', 'www'];
      if (forbiddenWords.some(word => username.toLowerCase().includes(word))) {
        return res.status(400).json({ message: "Данный логин недоступен" });
      }

      // Validate password requirements
      if (password.length < 8 || password.length > 128) {
        return res.status(400).json({ message: "Пароль должен содержать от 8 до 128 символов" });
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*()_+=\-\[\]{}|;:,.<>?]+$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({ message: "Пароль должен содержать хотя бы одну заглавную букву, одну строчную букву и одну цифру" });
      }

      // Проверка на распространенные пароли
      const commonPasswords = ['password', '12345678', 'qwerty123', 'admin123', 'password123'];
      if (commonPasswords.includes(password.toLowerCase())) {
        return res.status(400).json({ message: "Пароль слишком простой. Используйте более сложный пароль" });
      }

      // Check if password matches username or email
      if (password.toLowerCase() === username.toLowerCase()) {
        return res.status(400).json({ message: "Пароль не должен совпадать с логином" });
      }

      if (email && password.toLowerCase() === email.toLowerCase()) {
        return res.status(400).json({ message: "Пароль не должен совпадать с email" });
      }

      // Проверка email на валидность
      if (email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email) || email.length > 254) {
          return res.status(400).json({ message: "Некорректный email адрес" });
        }
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username.toLowerCase());
      if (existingUser) {
        console.warn(`Registration attempt with existing username: ${username} from ${clientIP}`);
        return res.status(400).json({ message: "Пользователь с таким логином уже существует" });
      }

      // Enhanced email validation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email) || email.length > 254) {
        return res.status(400).json({ message: "Некорректный email адрес" });
      }

      // Check if email already exists
      const existingEmailUser = await storage.getUserByEmail(email);
      if (existingEmailUser) {
        console.warn(`Registration attempt with existing email: ${email} from ${clientIP}`);
        return res.status(400).json({ message: "Пользователь с таким email уже существует" });
      }

      // Generate and send verification code
      const { generateVerificationCode, sendEmailVerificationCode } = await import('./email');
      const code = generateVerificationCode();

      // Store verification data in session temporarily
      req.session.registrationData = {
        username: username.toLowerCase(),
        email,
        password,
        firstName,
        lastName,
        verificationCode: code,
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
      };

      // Send verification code
      const emailSent = await sendEmailVerificationCode(email, code);

      if (!emailSent) {
        return res.status(500).json({ 
          message: "Не удалось отправить код на email",
          errorCode: "EMAIL_SEND_FAILED"
        });
      }

      res.json({ 
        message: "Код верификации отправлен на указанный email",
        email: email
      });

    } catch (error) {
      console.error("Error sending registration verification:", error);
      res.status(500).json({ message: "Ошибка при отправке кода верификации" });
    }
  });

  // Send password reset code
  app.post("/api/password-reset/send-code", async (req, res) => {
    try {
      const { email } = req.body;
      const clientIP = req.ip || req.connection.remoteAddress;
      console.log('📧 Password reset request for email:', email, 'from IP:', clientIP);

      if (!email || !email.trim()) {
        console.log('❌ Empty email provided');
        return res.status(400).json({ 
          message: "Email обязателен для заполнения",
          errorCode: "EMAIL_REQUIRED"
        });
      }

      // Валидация формата email
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const trimmedEmail = email.trim().toLowerCase();

      if (!emailRegex.test(trimmedEmail) || trimmedEmail.length > 254) {
        console.log('❌ Invalid email format:', trimmedEmail);
        return res.status(400).json({ 
          message: "Некорректный формат email адреса",
          errorCode: "INVALID_EMAIL_FORMAT"
        });
      }

      console.log('🔍 Looking for user with email:', trimmedEmail);

      // Проверяем, существует ли пользователь с таким email
      const user = await storage.getUserByEmail(trimmedEmail);
      if (!user) {
        console.warn(`Password reset attempt for non-existent email: ${trimmedEmail} from ${clientIP}`);
        return res.status(404).json({ 
          message: "Пользователь с таким email не найден",
          errorCode: "USER_NOT_FOUND"
        });
      }

      console.log('👤 Found user:', { 
        id: user.id, 
        username: user.username, 
        googleId: !!user.googleId, 
        telegramId: !!user.telegramId,
        hasPassword: !!user.password
      });

      // Проверяем статус пользователя
      if (user.status === 'blocked') {
        console.warn(`Blocked user ${user.username} attempted password reset from ${clientIP}`);
        return res.status(403).json({ 
          message: "Ваш аккаунт заблокирован. Обратитесь к администратору",
          errorCode: "USER_BLOCKED"
        });
      }

      // Генерируем код восстановления
      const { generateVerificationCode, sendPasswordResetCode } = await import('./email');
      const resetCode = generateVerificationCode();
      console.log('🔐 Generated reset code for user:', user.username);

      // Сохраняем код в базе данных (действует 10 минут)
      try {
        await storage.savePasswordResetCode(user.id, resetCode);
        console.log('💾 Saved reset code to database');
      } catch (error) {
        console.error('❌ Failed to save password reset code to database:', error);
        return res.status(500).json({
          message: "Ошибка при сохранении кода восстановления",
          errorCode: "DATABASE_ERROR"
        });
      }

      // Отправляем код на email
      console.log('📮 Attempting to send reset code to email:', trimmedEmail);
      const emailSent = await sendPasswordResetCode(trimmedEmail, resetCode);

      if (!emailSent) {
        console.error('❌ Failed to send password reset email to:', trimmedEmail);
        return res.status(500).json({ 
          message: "Не удалось отправить код восстановления на email. Попробуйте позже",
          errorCode: "EMAIL_SEND_FAILED"
        });
      }

      console.log('✅ Password reset code sent successfully to:', trimmedEmail);
      res.json({ 
        message: "Код восстановления отправлен на указанный email",
        email: trimmedEmail,
        success: true
      });

    } catch (error) {
      console.error("❌ Error in password reset send code:", error);
      res.status(500).json({ 
        message: "Ошибка сервера при отправке кода восстановления",
        errorCode: "SERVER_ERROR"
      });
    }
  });

  // Verify reset code and update password
  app.post("/api/password-reset/verify", async (req, res) => {
    try {
      const { resetCode, newPassword } = req.body;
      const clientIP = req.ip || req.connection.remoteAddress;

      if (!resetCode || !newPassword) {
        return res.status(400).json({ message: "Все поля обязательны для заполнения" });
      }

      if (newPassword !== newPassword) {
        return res.status(400).json({ message: "Пароли не совпадают" });
      }

      // Validate password requirements
      if (newPassword.length < 8 || newPassword.length > 128) {
        return res.status(400).json({ message: "Пароль должен содержать от 8 до 128 символов" });
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*()_+=\-\[\]{}|;:,.<>?]+$/;
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({ message: "Пароль должен содержать хотя бы одну заглавную букву, одну строчную букву и одну цифру" });
      }

      // Hash new password and update
      const hashedPassword = await hashPassword(newPassword);
      const result = await storage.verifyPasswordResetCode(resetCode, hashedPassword);

       if (!result.success) {
        console.log('❌ Password reset verification failed:', result.error);
        return res.status(400).json({ message: result.error });
      }

      console.info(`Password reset successful for user from ${clientIP}`);

      res.json({ 
        message: "Пароль успешно изменен. Теперь вы можете войти с новым паролем" 
      });

    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Ошибка при сбросе пароля" });
    }
  });

  // Complete registration with verification code
  app.post("/api/register", async (req, res, next) => {
    try {
      const { verificationCode } = req.body;
      const clientIP = req.ip || req.connection.remoteAddress;

      if (!verificationCode) {
        return res.status(400).json({ message: "Код верификации обязателен" });
      }

      if (!req.session.registrationData) {
        return res.status(400).json({ message: "Данные регистрации не найдены. Начните регистрацию заново" });
      }

      const { username, email, password, firstName, lastName, verificationCode: storedCode, expiresAt } = req.session.registrationData;

      // Check if code is expired
      if (Date.now() > expiresAt) {
        delete req.session.registrationData;
        return res.status(400).json({ message: "Код верификации истек. Начните регистрацию заново" });
      }

      // Verify code
      if (verificationCode !== storedCode) {
        return res.status(400).json({ message: "Неверный код верификации" });
      }

      // Check if user still doesn't exist (double check)
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        delete req.session.registrationData;
        return res.status(400).json({ message: "Пользователь с таким логином уже существует" });
      }

      const existingEmailUser = await storage.getUserByEmail(email);
      if (existingEmailUser) {
        delete req.session.registrationData;
        return res.status(400).json({ message: "Пользователь с таким email уже существует" });
      }

      console.info(`New user registration: ${username} from ${clientIP}`);

      // Create user
      const hashedPassword = await hashPassword(password);
      const incognitoAvatarUrl = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjNDc0NzQ3Ii8+CjxwYXRoIGQ9Ik01MCA1MEMzOC4xIDUwIDI5IDQxLjUgMjkgMzFDMjkgMjAuNSAzOC4xIDEyIDUwIDEyQzYxLjkgMTIgNzEgMjAuNSA3MSAzMUM3MSA0MS41IDYxLjkgNTAgNTAgNTBaTTIwIDgwQzIwIDY0LjQgMzQuNCA1MCA1MCA1MEM2NS42IDUwIDgwIDY0LjQgODAgODBWODVIMjBWODBaIiBmaWxsPSIjOTA5MDkwIi8+Cjx0ZXh0IHg9IjUwIiB5PSI5NSIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiNBQUFBQUUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkluY29nbml0bzwvdGV4dD48L3N2Zz4K";
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: "user",
        balance: "0.00",
        profileImageUrl: incognitoAvatarUrl,
        isEmailVerified: true, // Email already verified
      });

      // Clear registration data from session
      delete req.session.registrationData;

      // Log in the user
      req.login(user, (err) => {
        if (err) {
          console.error('Login error after registration:', err);
          return next(err);
        }
        
        console.log('User registered and logged in successfully:', user.username);
        res.status(201).json({
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          balance: user.balance,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Ошибка при регистрации" });
    }
  });

  // Хранилище для отслеживания неудачных попыток входа
  const loginAttempts = new Map();
  const blockedUsers = new Set();

  // Login route
  app.post("/api/login", async (req, res) => {
    try {
      const { username, email, password, usernameOrEmail } = req.body;
      const loginIdentifier = usernameOrEmail || username || email;
      const clientIP = req.ip || req.connection.remoteAddress;

      if (!loginIdentifier || !password) {
        return res.status(400).json({ message: "Логин/email и пароль обязательны" });
      }

      // Дополнительная валидация входных данных
      if (typeof loginIdentifier !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ message: "Некорректный формат данных" });
      }

      if (loginIdentifier.trim().length === 0 || password.trim().length === 0) {
        return res.status(400).json({ message: "Логин/email и пароль не могут быть пустыми" });
      }

      // Проверка на блокировку пользователя
      const userKey = loginIdentifier.toLowerCase();
      if (blockedUsers.has(userKey)) {
        return res.status(423).json({ message: "Аккаунт временно заблокирован из-за подозрительной активности" });
      }

      // Проверка длины пароля для предотвращения DoS
      if (password.length > 128) {
        return res.status(400).json({ message: "Пароль слишком длинный" });
      }

      // Try to find user by username or email
      let user;
      if (loginIdentifier.includes('@')) {
        user = await storage.getUserByEmail(loginIdentifier.toLowerCase());
      } else {
        user = await storage.getUserByUsername(loginIdentifier.toLowerCase());
      }

      // Проверяем, что пользователь найден
      if (!user) {
        // Добавляем небольшую задержку для замедления брутфорса
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.warn(`Login attempt with non-existent user: ${loginIdentifier} from ${clientIP}`);
        return res.status(401).json({ message: "Неверный логин/email или пароль" });
      }

      // Проверка статуса пользователя
      if (user.status === 'blocked') {
        console.warn(`Blocked user ${user.username} attempted login from ${clientIP}`);
        return res.status(403).json({ message: "Ваш аккаунт заблокирован. Обратитесь к администратору" });
      }

      // Проверяем, что у пользователя есть пароль (не OAuth пользователь)
      if (!user.password || user.password.trim() === '') {
        console.warn(`Login attempt for OAuth user ${user.username} from ${clientIP}`);
        return res.status(400).json({ message: "Данный аккаунт был создан через Google. Используйте вход через Google" });
      }

      // Проверяем корректность формата сохраненного пароля
      if (!user.password.includes('.')) {
        console.error(`Invalid password format for user ${user.username}`);
        return res.status(500).json({ message: "Ошибка системы аутентификации. Обратитесь к администратору" });
      }

      // Проверяем корректность введенного пароля
      let passwordValid = false;
      try {
        passwordValid = await comparePasswords(password, user.password);
      } catch (error) {
        console.error(`Password comparison failed for user ${user.username}:`, error);
        passwordValid = false;
      }

      if (!passwordValid) {
        // Отслеживаем неудачные попытки входа
        const attempts = loginAttempts.get(userKey) || { count: 0, lastAttempt: Date.now() };
        attempts.count++;
        attempts.lastAttempt = Date.now();
        loginAttempts.set(userKey, attempts);

        console.warn(`Failed login attempt for user ${userKey} from ${clientIP}. Attempt #${attempts.count}`);

        // Блокируем пользователя после 5 неудачных попыток
        if (attempts.count >= 5) {
          blockedUsers.add(userKey);
          console.error(`User ${userKey} blocked after ${attempts.count} failed attempts`);

          // Автоматическая разблокировка через 30 минут
          setTimeout(() => {
            blockedUsers.delete(userKey);
            loginAttempts.delete(userKey);
            console.info(`User ${userKey} automatically unblocked`);
          }, 30 * 60 * 1000);

          return res.status(423).json({ message: "Аккаунт временно заблокирован из-за множественных неудачных попыток входа" });
        }

        return res.status(401).json({ message: "Неверный логин/email или пароль" });
      }

      // Успешный вход - сбрасываем счетчик неудачных попыток
      loginAttempts.delete(userKey);

      // Логируем успешный вход
      console.info(`Successful login for user ${user.username} from ${clientIP}`);



      req.login(user, (err) => {
// This line analyze the code and generate the complete code with the changes.
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "Ошибка при входе" });
        }
        res.status(200).json({
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
role: user.role,
          balance: user.balance,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Ошибка при входе" });
    }
  });  // Logout route
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });



  // Google OAuth routes
  app.get("/api/auth/google", passport.authenticate("google", { 
    scope: ["profile", "email"] 
  }));

  app.get("/api/auth/google/callback", 
    passport.authenticate("google", { failureRedirect: "/auth" }),
    (req, res) => {
      // Redirect to the main page with a success parameter
      res.redirect("/?auth=success");
    }
  );
}

// Middleware to protect routes
export function isAuthenticated(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

import { Request, Response } from 'express';
import { storage } from './storage';
import crypto from 'crypto';
import config from '../config';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7971098423:AAFCpOBcuSedFjyXVgoBiIKfEt_FmHgJcE0';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: {
    id: number;
    type: string;
  };
  text?: string;
  date: number;
}

interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
  my_chat_member?: TelegramChatMember;
  chat_member?: TelegramChatMember;
}

interface TelegramChatMember {
  chat: {
    id: number;
    type: string;
    title?: string;
    username?: string;
  };
  from: TelegramUser;
  date: number;
  old_chat_member: {
    user: TelegramUser;
    status: string;
  };
  new_chat_member: {
    user: TelegramUser;
    status: string;
  };
}

// Функция для отправки сообщения в Telegram
async function sendMessage(chatId: number, text: string, replyMarkup?: any) {
  try {
    console.log('📤 Отправляем сообщение в Telegram:', {
      chatId,
      textLength: text.length,
      hasReplyMarkup: !!replyMarkup,
      preview: text.substring(0, 100) + (text.length > 100 ? '...' : '')
    });

    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_markup: replyMarkup,
        parse_mode: 'HTML'
      }),
    });

    const result = await response.json();
    
    if (!result.ok) {
      console.error('❌ Ошибка отправки сообщения:', result);
    } else {
      console.log('✅ Сообщение отправлено успешно, message_id:', result.result?.message_id);
    }

    return result;
  } catch (error) {
    console.error('❌ Ошибка отправки сообщения в Telegram:', error);
    return null;
  }
}

// Функция для получения фото профиля пользователя
async function getUserProfilePhoto(userId: number) {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getUserProfilePhotos?user_id=${userId}&limit=1`);
    const data = await response.json();

    if (data.ok && data.result.total_count > 0) {
      const fileId = data.result.photos[0][0].file_id;
      const fileResponse = await fetch(`${TELEGRAM_API_URL}/getFile?file_id=${fileId}`);
      const fileData = await fileResponse.json();

      if (fileData.ok) {
        return `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`;
      }
    }
  } catch (error) {
    console.error('Ошибка получения фото профиля:', error);
  }
  return null;
}

// Функция для получения количества участников канала/группы
async function getChatMemberCount(chatId: number | string): Promise<number> {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getChatMemberCount?chat_id=${chatId}`);
    const data = await response.json();

    if (data.ok) {
      return data.result;
    }
  } catch (error) {
    console.error('Ошибка получения количества участников:', error);
  }
  return 0;
}

// Функция для получения информации о чате
async function getChat(chatId: number | string) {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getChat?chat_id=${chatId}`);
    const data = await response.json();

    if (data.ok) {
      return data.result;
    }
  } catch (error) {
    console.error('Ошибка получения информации о чате:', error);
  }
  return null;
}

// Обработка изменений статуса бота в чате
async function handleChatMemberUpdate(update: TelegramChatMember) {
  const { storage } = await import('./storage');
  
  try {
    const chat = update.chat;
    const newStatus = update.new_chat_member.status;
    const botId = parseInt(BOT_TOKEN.split(':')[0]);

    // Проверяем, что изменения касаются нашего бота
    if (update.new_chat_member.user.id !== botId) {
      return;
    }

    console.log(`🤖 Статус бота изменен в чате ${chat.id} (${chat.title || chat.username}): ${newStatus}`);

    // Если бот стал администратором
    if (newStatus === 'administrator') {
      // Получаем количество участников
      const memberCount = await getChatMemberCount(chat.id);
      
      // Обновляем данные канала в базе данных
      if (chat.username) {
        const channel = await storage.getChannelByUsername(chat.username);
        if (channel) {
          await storage.updateChannel(channel.id, {
            subscriberCount: memberCount,
            botIsAdmin: true
          });
          
          console.log(`✅ Обновлен канал @${chat.username}: ${memberCount} участников`);
          
          // Отправляем уведомление владельцу канала
          if (channel.ownerId) {
            const owner = await storage.getUser(channel.ownerId);
            if (owner?.telegramId) {
              await sendMessage(parseInt(owner.telegramId),
                `✅ <b>Бот добавлен как администратор!</b>\n\n` +
                `📺 Канал: <b>${channel.name}</b>\n` +
                `👥 Текущее количество участников: <b>${memberCount.toLocaleString()}</b>\n\n` +
                `🔄 Данные будут автоматически обновляться.`
              );
            }
          }
        }
      }
    } 
    // Если бот был удален/понижен
    else if (newStatus === 'left' || newStatus === 'kicked' || newStatus === 'member') {
      if (chat.username) {
        const channel = await storage.getChannelByUsername(chat.username);
        if (channel) {
          await storage.updateChannel(channel.id, {
            botIsAdmin: false
          });
          
          console.log(`❌ Бот удален из админов канала @${chat.username}`);
          
          // Отправляем уведомление владельцу канала
          if (channel.ownerId) {
            const owner = await storage.getUser(channel.ownerId);
            if (owner?.telegramId) {
              await sendMessage(parseInt(owner.telegramId),
                `⚠️ <b>Бот удален из администраторов</b>\n\n` +
                `📺 Канал: <b>${channel.name}</b>\n\n` +
                `❗ Количество подписчиков больше не будет обновляться автоматически.\n` +
                `Добавьте бота обратно как администратора для возобновления обновлений.`
              );
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Ошибка обработки изменения статуса в чате:', error);
  }
}

// Функция для обновления подписчиков всех каналов, где бот - админ
export async function updatePrivateChannelsSubscribers() {
  const { storage } = await import('./storage');
  
  try {
    // Получаем все каналы где бот админ
    const channels = await storage.getChannelsWithBotAdmin();
    
    console.log(`🔄 Обновление подписчиков для ${channels.length} приватных каналов...`);
    
    for (const channel of channels) {
      try {
        // Формируем chat_id для API
        const chatId = channel.username.startsWith('@') 
          ? channel.username 
          : `@${channel.username}`;
        
        const memberCount = await getChatMemberCount(chatId);
        
        if (memberCount > 0 && memberCount !== channel.subscriberCount) {
          await storage.updateChannel(channel.id, {
            subscriberCount: memberCount
          });
          
          console.log(`✅ Обновлен приватный канал @${channel.username}: ${memberCount} участников`);
        }
        
        // Задержка между запросами
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Ошибка обновления канала @${channel.username}:`, error);
      }
    }
    
    console.log(`✅ Обновление приватных каналов завершено`);
  } catch (error) {
    console.error('❌ Ошибка обновления приватных каналов:', error);
  }
}

// Генерация токена авторизации
function generateAuthToken(telegramId: string): string {
  const timestamp = Date.now();
  const data = `${telegramId}_${timestamp}`;
  return crypto.createHash('sha256').update(data + process.env.SESSION_SECRET || 'default_secret').digest('hex');
}

// Создание кнопки для входа
function createLoginButton(authToken: string) {
  const loginUrl = `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:3000'}/auth/telegram-login?token=${authToken}`;

  return {
    inline_keyboard: [[{
      text: '🚀 ВХОД',
      url: loginUrl
    }]]
  };
}

// Хранилище для подтверждения привязки с дополнительной безопасностью
export const pendingLinkConfirmations = new Map<string, {
  telegramId: string;
  userId: number;
  username: string;
  verificationCode: string;
  expires: number;
}>();

// Обработка команды /link для привязки аккаунта
async function handleLinkCommand(telegramUser: TelegramUser, chatId: number, linkToken: string) {
  const telegramId = telegramUser.id.toString();

  try {
    console.log('🔗 Processing link command:', { 
      telegramId, 
      linkToken, 
      chatId,
      username: telegramUser.username 
    });

    // Проверяем токен привязки
    const linkData = linkingTokens.get(linkToken);
    console.log('🔍 Link data found:', linkData ? 'yes' : 'no');
    console.log('🔍 Available tokens:', Array.from(linkingTokens.keys()));
    console.log('🔍 Searching for token:', linkToken);
    
    if (!linkData || linkData.expires < Date.now()) {
      console.log('❌ Invalid or expired token');
      console.log('❌ Token data:', linkData);
      console.log('❌ Current time:', Date.now());
      console.log('❌ Token expires:', linkData?.expires);
      
      await sendMessage(chatId,
        `❌ <b>Недействительный или истекший токен</b>\n\n` +
        `🔄 Токен привязки действует 30 минут. Создайте новый запрос в настройках аккаунта.\n\n` +
        `💡 <b>Совет:</b> Убедитесь, что переходите по ссылке сразу после её создания.\n\n` +
        `🔧 <b>Отладка:</b> Токен: ${linkToken}`
      );
      return;
    }

    // Импортируем storage динамически, если не доступен
    const { storage } = await import('./storage');

    // Проверяем, не привязан ли уже этот Telegram к другому аккаунту
    const existingUser = await storage.getUserByTelegramId(telegramId);
    if (existingUser) {
      console.log('⚠️ Telegram already linked to user:', existingUser.username);
      await sendMessage(chatId,
        `⚠️ <b>Аккаунт уже привязан</b>\n\n` +
        `📱 Ваш Telegram уже привязан к аккаунту: <b>${existingUser.username}</b>\n\n` +
        `❗ Один Telegram аккаунт может быть привязан только к одному пользователю.`
      );
      return;
    }

    // Получаем пользователя по ID из токена
    console.log('🔍 Looking for user with ID:', linkData.userId);
    const user = await storage.getUser(linkData.userId);
    if (!user) {
      console.log('❌ User not found for ID:', linkData.userId);
      await sendMessage(chatId,
        `❌ <b>Пользователь не найден</b>\n\n` +
        `🔄 Попробуйте создать новый запрос на привязку.`
      );
      linkingTokens.delete(linkToken);
      return;
    }
    
    console.log('✅ Found user:', { id: user.id, username: user.username });

    // Проверяем, не привязан ли уже аккаунт к другому Telegram
    if (user.telegramId && user.telegramId !== telegramId) {
      await sendMessage(chatId,
        `⚠️ <b>Аккаунт уже привязан</b>\n\n` +
        `📱 Этот аккаунт уже привязан к другому Telegram.\n\n` +
        `❗ Сначала отвяжите текущий Telegram в настройках.`
      );
      return;
    }

    // Генерируем код подтверждения для дополнительной безопасности
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const confirmationToken = crypto.randomBytes(8).toString('hex'); // Короткий токен для callback_data (16 символов)

    // Сохраняем данные для подтверждения
    pendingLinkConfirmations.set(confirmationToken, {
      telegramId,
      userId: user.id,
      username: user.username,
      verificationCode,
      expires: Date.now() + 300000 // 5 минут на подтверждение
    });

    console.log('📨 Готовим сообщение с кодом подтверждения:', {
      chatId,
      username: user.username,
      telegramUser: telegramUser.first_name,
      verificationCode,
      confirmationToken
    });

    // Отправляем запрос на подтверждение с кодом и кнопками
    const confirmationMessage = await sendMessage(chatId,
      `🔐 <b>Подтверждение привязки аккаунта</b>\n\n` +
      `👤 Аккаунт: <b>${user.username}</b>\n` +
      `📱 Telegram: <b>${telegramUser.first_name} ${telegramUser.last_name || ''}</b>\n\n` +
      `🔢 <b>Код подтверждения: ${verificationCode}</b>\n\n` +
      `⚠️ <b>Внимание!</b> Убедитесь, что это именно ваш аккаунт!\n\n` +
      `⏱ Код действует 5 минут.`,
      {
        inline_keyboard: [[
          { text: 'Привязать', callback_data: `c_${confirmationToken}` },
          { text: 'Отмена', callback_data: `x_${confirmationToken}` }
        ]]
      }
    );

    console.log('📨 Результат отправки сообщения с кодом:', confirmationMessage ? 'успешно' : 'ошибка');

    // Удаляем использованный токен привязки ТОЛЬКО после успешной отправки сообщения
    linkingTokens.delete(linkToken);

  } catch (error) {
    console.error('Ошибка привязки аккаунта:', error);
    
    // Не удаляем токен при ошибке, чтобы пользователь мог повторить попытку
    console.log(`🔄 Сохраняем токен ${linkToken} для повторной попытки`);
    
    await sendMessage(chatId,
      `❌ <b>Ошибка привязки</b>\n\n` +
      `🔧 Произошла техническая ошибка. Попробуйте отправить команду еще раз.\n\n` +
      `💡 Если проблема повторится, создайте новый токен в настройках аккаунта.`
    );
  }
}

// Обработка подтверждения привязки
async function handleConfirmCommand(telegramUser: TelegramUser, chatId: number, confirmationToken: string) {
  const telegramId = telegramUser.id.toString();

  try {
    const confirmData = pendingLinkConfirmations.get(confirmationToken);
    if (!confirmData || confirmData.expires < Date.now()) {
      await sendMessage(chatId,
        `❌ <b>Код подтверждения истек</b>\n\n` +
        `🔄 Запросите новую привязку в настройках аккаунта.`
      );
      if (confirmData) {
        pendingLinkConfirmations.delete(confirmationToken);
      }
      return;
    }

    // Проверяем, что команду отправляет тот же пользователь
    if (confirmData.telegramId !== telegramId) {
      await sendMessage(chatId,
        `❌ <b>Ошибка безопасности</b>\n\n` +
        `🔐 Вы не можете подтвердить привязку чужого аккаунта.\n\n` +
        `⚠️ Если это ошибка, создайте новый запрос на привязку.`
      );
      return;
    }

    // Получаем фото профиля
    const profilePhoto = await getUserProfilePhoto(telegramUser.id);

    // Привязываем аккаунт
    const updatedUser = await storage.updateUserTelegramData(confirmData.userId, {
      telegramId: telegramId,
      telegramUsername: telegramUser.username,
      telegramFirstName: telegramUser.first_name,
      telegramLastName: telegramUser.last_name,
      telegramPhotoUrl: profilePhoto || undefined
    });

    console.log('✅ Telegram аккаунт привязан после подтверждения:', {
      userId: confirmData.userId,
      telegramId: telegramId,
      username: telegramUser.username,
      updatedUser: updatedUser ? 'success' : 'failed'
    });

    // Удаляем данные подтверждения
    pendingLinkConfirmations.delete(confirmationToken);

    await sendMessage(chatId,
      `🎉 <b>Аккаунт успешно привязан!</b>\n\n` +
      `👤 Пользователь: <b>${confirmData.username}</b>\n` +
      `📱 Telegram: <b>${telegramUser.first_name}</b>\n\n` +
      `✅ Теперь вы можете входить в систему через этого бота!\n\n` +
      `🔐 <b>Безопасность:</b> Ваш аккаунт защищен дополнительным подтверждением.`
    );

  } catch (error) {
    console.error('Ошибка подтверждения привязки:', error);
    await sendMessage(chatId,
      `❌ <b>Ошибка подтверждения</b>\n\n` +
      `🔧 Произошла техническая ошибка. Попробуйте позже.`
    );
  }
}

// Обработка отмены привязки
async function handleCancelCommand(telegramUser: TelegramUser, chatId: number, confirmationToken: string) {
  const confirmData = pendingLinkConfirmations.get(confirmationToken);
  if (confirmData) {
    pendingLinkConfirmations.delete(confirmationToken);
    await sendMessage(chatId,
      `❌ <b>Привязка отменена</b>\n\n` +
      `🔄 Вы можете создать новый запрос на привязку в настройках аккаунта.`
    );
  } else {
    await sendMessage(chatId,
      `⚠️ <b>Запрос не найден</b>\n\n` +
      `Возможно, время на подтверждение уже истекло.`
    );
  }
}

// Обработка команды /start
async function handleStartCommand(telegramUser: TelegramUser, chatId: number, args?: string) {
  const telegramId = telegramUser.id.toString();

  console.log('🔍 Start command received:', { 
    telegramId, 
    args, 
    chatId,
    username: telegramUser.username 
  });

  // Проверяем, есть ли аргумент для привязки аккаунта
  if (args && args.startsWith('link_')) {
    const linkToken = args.substring(5); // Убираем префикс 'link_'
    console.log('🔗 Link command detected with token:', linkToken);
    console.log('🔍 Available linking tokens:', Array.from(linkingTokens.keys()));
    await handleLinkCommand(telegramUser, chatId, linkToken);
    return;
  }

  try {
    // Проверяем, зарегистрирован ли уже пользователь
    const existingUser = await storage.getUserByTelegramId(telegramId);

    if (existingUser) {
      // Пользователь уже зарегистрирован - предлагаем вход
      const authToken = generateAuthToken(telegramId);

      authTokens.set(authToken, {
        telegramId,
        userId: existingUser.id,
        expires: Date.now() + 300000 // 5 минут
      });

      const loginMarkup = createLoginButton(authToken);

      await sendMessage(chatId, 
        `🎉 <b>Добро пожаловать в TG Flow!</b>\n\n` +
        `👤 Привет, <b>${existingUser.firstName || telegramUser.first_name}</b>!\n` +
        `✨ Рады видеть вас снова в нашей платформе каталога Telegram каналов.\n\n` +
        `🚀 Для входа в ваш личный кабинет нажмите кнопку ниже:`,
        loginMarkup
      );
    } else {
      // Пользователь не зарегистрирован - показываем приветствие с инструкциями
      const welcomeMessage = `🤖 <b>Добро пожаловать в TG Flow Bot!</b>

Это официальный бот для авторизации в каталоге Telegram каналов TG Flow. С помощью этого бота вы можете:

• Зарегистрироваться в каталоге
• Привязать существующий аккаунт к Telegram  
• Быстро авторизоваться на сайте

📋 <b>Доступные команды:</b>

Если вы хотите зарегистрироваться - напишите /register

Если хотите привязать аккаунт - /start link_[user_id]`;

      await sendMessage(chatId, welcomeMessage);
    }
  } catch (error) {
    await sendMessage(chatId, 
      '⚠️ <b>Технический сбой</b>\n\n' +
      '🔧 Мы уже работаем над устранением проблемы.\n' +
      '⏱ Попробуйте снова через несколько минут.\n\n' +
      '📞 Если проблема повторится, напишите в поддержку: @support'
    );
  }
}



// Хранилище токенов привязки аккаунтов
export const linkingTokens = new Map<string, {
  userId: number;
  expires: number;
}>();

// Токены для авторизации через бота
export const authTokens = new Map<string, {
  telegramId: string;
  userId: number;
  expires: number;
}>();

// Обработчик команды /register для регистрации новых пользователей
async function handleRegisterCommand(telegramUser: TelegramUser, chatId: number) {
  const telegramId = telegramUser.id.toString();

  try {
    // Проверяем, не зарегистрирован ли уже пользователь
    const existingUser = await storage.getUserByTelegramId(telegramId);
    if (existingUser) {
      await sendMessage(chatId,
        `⚠️ <b>Вы уже зарегистрированы</b>\n\n` +
        `👤 Ваш аккаунт: <b>${existingUser.username}</b>\n\n` +
        `🚀 Используйте /start для входа в личный кабинет.`
      );
      return;
    }

    // Получаем фото профиля
    const profilePhoto = await getUserProfilePhoto(telegramUser.id);

    // Создаем нового пользователя
    const userData = {
      username: `tg_${telegramId}`,
      email: '',
      password: '',
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name || '',
      role: 'user',
      status: 'active',
      balance: '0.00',
      telegramId,
      telegramUsername: telegramUser.username || '',
      telegramFirstName: telegramUser.first_name,
      telegramLastName: telegramUser.last_name || '',
      telegramPhotoUrl: profilePhoto || undefined
    };

    const user = await storage.createUser(userData);

    // Создаем токен авторизации
    const authToken = generateAuthToken(telegramId);

    authTokens.set(authToken, {
      telegramId,
      userId: user.id,
      expires: Date.now() + 300000 // 5 минут
    });

    const loginMarkup = createLoginButton(authToken);

    await sendMessage(chatId,
      `🌟 <b>Добро пожаловать в TG Flow!</b>\n\n` +
      `🎊 Ваш аккаунт успешно создан!\n\n` +
      `👤 <b>${user.firstName}</b>, теперь вы можете:\n` +
      `📱 Размещать свои каналы и боты\n` +
      `🔍 Находить интересный контент\n` +
      `💰 Управлять рекламными кампаниями\n` +
      `📊 Отслеживать статистику\n\n` +
      `🚀 Нажмите кнопку ниже, чтобы перейти в личный кабинет:`,
      loginMarkup
    );
  } catch (error) {
    console.error('❌ Error in handleRegisterCommand:', error);
    await sendMessage(chatId, 'Произошла ошибка при регистрации. Попробуйте позже.');
  }
}

// Очистка истекших токенов
setInterval(() => {
  const now = Date.now();

  // Очистка токенов авторизации
  const authTokensToDelete: string[] = [];
  authTokens.forEach((data, token) => {
    if (data.expires < now) {
      authTokensToDelete.push(token);
    }
  });
  authTokensToDelete.forEach(token => authTokens.delete(token));

  // Очистка токенов привязки
  const linkTokensToDelete: string[] = [];
  linkingTokens.forEach((data, token) => {
    if (data.expires < now) {
      linkTokensToDelete.push(token);
    }
  });
  linkTokensToDelete.forEach(token => linkingTokens.delete(token));

  // Очистка ожидающих подтверждений
  const confirmTokensToDelete: string[] = [];
  pendingLinkConfirmations.forEach((data, token) => {
    if (data.expires < now) {
      confirmTokensToDelete.push(token);
    }
  });
  confirmTokensToDelete.forEach(token => pendingLinkConfirmations.delete(token));
}, 60000); // Проверяем каждую минуту

// Основной обработчик webhook
export async function handleTelegramWebhook(req: Request, res: Response) {
  try {
    const update: TelegramUpdate = req.body;
    console.log('🤖 Webhook received:', JSON.stringify(update, null, 2));
    console.log('🔍 Request headers:', req.headers);
    console.log('🔍 Request method:', req.method);
    console.log('🔍 Request body raw:', req.body);
    console.log('🔍 Update ID:', update.update_id);

    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const text = message.text;
      const telegramUser = message.from;

      console.log('📨 Message received:', {
        chatId,
        text,
        from: telegramUser.username || telegramUser.first_name
      });

      if (text?.startsWith('/start')) {
        // Парсим аргументы команды /start
        const parts = text.trim().split(/\s+/);
        const args = parts.length > 1 ? parts.slice(1).join(' ') : undefined;
        console.log('🎯 Start command parsed:', { 
          fullText: text, 
          parts, 
          args,
          telegramUser: telegramUser.username || telegramUser.first_name 
        });
        await handleStartCommand(telegramUser, chatId, args);
      } else if (text?.startsWith('/register')) {
        await handleRegisterCommand(telegramUser, chatId);
      } else if (text?.startsWith('/confirm ')) {
        const confirmationToken = text.split(' ')[1];
        await handleConfirmCommand(telegramUser, chatId, confirmationToken);
      } else if (text?.startsWith('/cancel ')) {
        const confirmationToken = text.split(' ')[1];
        await handleCancelCommand(telegramUser, chatId, confirmationToken);
      } else if (text?.startsWith('/test')) {
        // Тестовая команда для отладки
        await sendMessage(chatId, 
          `🧪 <b>Тест бота</b>\n\n` +
          `✅ Бот работает!\n` +
          `👤 Ваш ID: ${telegramUser.id}\n` +
          `📝 Username: ${telegramUser.username || 'не установлен'}\n` +
          `📨 Получено сообщение: "${text}"\n` +
          `🕐 Время: ${new Date().toLocaleString()}`
        );
      } else {
        // Обработка других сообщений
        console.log('🤔 Unhandled message:', {
          text,
          from: telegramUser.username || telegramUser.first_name,
          chatId
        });
        
        await sendMessage(chatId, 
          '❓ <b>Неизвестная команда</b>\n\n' +
          '📋 Доступные команды:\n' +
          '/start - начать работу с ботом\n' +
          '/register - зарегистрироваться\n' +
          '/start link_[token] - привязать аккаунт\n' +
          '/confirm [token] - подтвердить привязку\n' +
          '/cancel [token] - отменить привязку\n\n' +
          `🔧 <b>Отладка:</b> Получено сообщение: "${text}"`
        );
      }
    }

    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const telegramUser = callbackQuery.from;
      const chatId = callbackQuery.message?.chat.id;
      
      if (callbackQuery.data?.startsWith('c_')) {
        const confirmationToken = callbackQuery.data.substring(2);
        if (chatId) {
          await handleConfirmCommand(telegramUser, chatId, confirmationToken);
        }
      } else if (callbackQuery.data?.startsWith('x_')) {
        const confirmationToken = callbackQuery.data.substring(2);
        if (chatId) {
          await handleCancelCommand(telegramUser, chatId, confirmationToken);
        }
      } else if (callbackQuery.data?.startsWith('confirm_')) {
        const confirmationToken = callbackQuery.data.substring(8);
        if (chatId) {
          await handleConfirmCommand(telegramUser, chatId, confirmationToken);
        }
      } else if (callbackQuery.data?.startsWith('cancel_')) {
        const confirmationToken = callbackQuery.data.substring(7);
        if (chatId) {
          await handleCancelCommand(telegramUser, chatId, confirmationToken);
        }
      }

      // Отвечаем на callback_query
      await fetch(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callbackQuery.id })
      });
    }

    // Обработка изменений статуса участников чата
    if (update.my_chat_member) {
      await handleChatMemberUpdate(update.my_chat_member);
    }

    if (update.chat_member) {
      await handleChatMemberUpdate(update.chat_member);
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Ошибка обработки webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Функция для валидации токена авторизации
export function validateAuthToken(token: string) {
  const authData = authTokens.get(token);

  if (!authData) {
    return null;
  }

  if (authData.expires < Date.now()) {
    authTokens.delete(token);
    return null;
  }

  return authData;
}

// Функция для установки webhook
export async function setWebhook() {
  const webhookUrl = `${config.BASE_URL}/api/telegram/webhook`;

  try {
    console.log('🔧 Setting webhook URL:', webhookUrl);
    console.log('🔧 Bot token (first 10 chars):', BOT_TOKEN.substring(0, 10) + '...');
    
    const response = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query', 'my_chat_member', 'chat_member']
      })
    });

    const result = await response.json();
    console.log('🤖 Webhook установлен:', result);
    
    if (!result.ok) {
      console.error('❌ Webhook setup failed:', result);
      console.error('❌ Response status:', response.status);
      console.error('❌ Response headers:', response.headers);
    } else {
      console.log('✅ Webhook successfully set up');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Ошибка установки webhook:', error);
    return null;
  }
}

// Функция для получения информации о webhook
export async function getWebhookInfo() {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getWebhookInfo`);
    const result = await response.json();
    return result;
  } catch (error) {
    return null;
  }
}

// Функция для отправки broadcast сообщений
export async function sendBroadcastMessage(telegramId: string, message: string) {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: telegramId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const result = await response.json();
    if (!result.ok) {
      throw new Error(`Telegram API error: ${result.description}`);
    }
    
    return result;
  } catch (error) {
    console.error(`Failed to send broadcast message to ${telegramId}:`, error);
    throw error;
  }
}
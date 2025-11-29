import nodemailer from 'nodemailer';
import crypto from 'crypto';
import config from "../config";

// Проверяем наличие всех необходимых переменных
const requiredEnvVars = {
  SMTP_HOST: config.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: config.SMTP_PORT || 587,
  SMTP_USER: config.SMTP_USER || config.EMAIL_FROM,
  SMTP_PASSWORD: config.SMTP_PASS,
  SMTP_FROM: config.EMAIL_FROM || 'noreply@tgflovv.ru'
};

// Логируем конфигурацию (без пароля)
console.log('SMTP Configuration:', {
  host: requiredEnvVars.SMTP_HOST,
  port: requiredEnvVars.SMTP_PORT,
  user: requiredEnvVars.SMTP_USER,
  from: requiredEnvVars.SMTP_FROM,
  hasPassword: !!requiredEnvVars.SMTP_PASSWORD
});

if (!requiredEnvVars.SMTP_PASSWORD) {
  console.error('SMTP_PASSWORD не установлен в переменных окружения!');
}

// Создаем единый транспортер
async function createTransporter() {
  // Если нет настроек SMTP, используем тестовый аккаунт Ethereal
  if (!requiredEnvVars.SMTP_PASSWORD) {
    console.log('⚠️ Используется тестовый SMTP аккаунт (Ethereal)');
    const testAccount = await nodemailer.createTestAccount();

    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  // Основной транспортер с настройками Gmail
  const transportConfig = {
    host: requiredEnvVars.SMTP_HOST,
    port: requiredEnvVars.SMTP_PORT,
    secure: requiredEnvVars.SMTP_PORT === 465, // true для 465, false для других портов
    auth: {
      user: requiredEnvVars.SMTP_USER,
      pass: requiredEnvVars.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    },
    // Дополнительные настройки для Gmail
    ...(requiredEnvVars.SMTP_HOST.includes('gmail') && {
      service: 'gmail',
      secure: true,
      requireTLS: true,
      debug: true,
      logger: true
    })
  };

  console.log('📧 Creating SMTP transport with config:', {
    host: transportConfig.host,
    port: transportConfig.port,
    secure: transportConfig.secure,
    user: transportConfig.auth.user,
    service: transportConfig.service || 'custom'
  });

  return nodemailer.createTransport(transportConfig);
}

// Проверяем соединение при запуске
createTransporter()
  .then(async (transporter) => {
    try {
      await transporter.verify();
      console.log('✅ SMTP сервер готов к отправке писем');
    } catch (error) {
      console.error('❌ Ошибка подключения к SMTP серверу:', error);
    }
  })
  .catch((error) => {
    console.error('❌ Ошибка создания транспортера:', error);
  });

// Генерация 6-значного кода
export function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Отправка кода верификации на email (для регистрации)
export async function sendEmailVerificationCode(email: string, code: string): Promise<boolean> {
  try {
    console.log(`📧 Attempting to send email verification code to: ${email}`);
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"TG Flow" <${requiredEnvVars.SMTP_FROM}>`,
      to: email,
      subject: 'Подтверждение регистрации TG Flow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">TG Flow</h1>
          </div>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1e293b; margin-top: 0;">Подтверждение регистрации</h2>
            <p style="font-size: 16px; line-height: 1.5;">Ваш код подтверждения:</p>
            <div style="background: white; padding: 15px; border-radius: 6px; text-align: center; margin: 15px 0;">
              <span style="font-size: 24px; font-weight: bold; letter-spacing: 3px; color: #2563eb;">${code}</span>
            </div>
            <p style="color: #64748b; font-size: 14px;">Код действителен в течение 10 минут.</p>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="color: #64748b; font-size: 12px; text-align: center;">
            Если вы не регистрировались на TG Flow, проигнорируйте это письмо.
          </p>
        </div>
      `
    };

    console.log(`📮 Sending email verification with options:`, {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email verification sent successfully:', info.messageId);

    // В режиме разработки с Ethereal покажем URL для просмотра
    if (!requiredEnvVars.SMTP_PASSWORD || process.env.NODE_ENV === 'development') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('🔗 Preview URL (для разработки): %s', previewUrl);
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Error sending email verification:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      if (error.stack) {
        console.error('Error stack:', error.stack);
      }
    }
    return false;
  }
}

// Отправка кода сброса пароля на email
export async function sendPasswordResetCode(email: string, code: string): Promise<boolean> {
  try {
    console.log(`📧 Attempting to send password reset code to: ${email}`);
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"TG Flow" <${requiredEnvVars.SMTP_FROM}>`,
      to: email,
      subject: 'Восстановление пароля TG Flow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">TG Flow</h1>
          </div>
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ef4444;">
            <h2 style="color: #1e293b; margin-top: 0;">Восстановление пароля</h2>
            <p style="font-size: 16px; line-height: 1.5;">Ваш код для восстановления пароля:</p>
            <div style="background: white; padding: 15px; border-radius: 6px; text-align: center; margin: 15px 0;">
              <span style="font-size: 24px; font-weight: bold; letter-spacing: 3px; color: #ef4444;">${code}</span>
            </div>
            <p style="color: #64748b; font-size: 14px;">Код действителен в течение 10 минут.</p>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="color: #64748b; font-size: 12px; text-align: center;">
            Если вы не запрашивали восстановление пароля, проигнорируйте это письмо.
          </p>
        </div>
      `
    };

    console.log(`📮 Sending password reset email with options:`, {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully:', info.messageId);

    // В режиме разработки с Ethereal покажем URL для просмотра
    if (!requiredEnvVars.SMTP_PASSWORD || process.env.NODE_ENV === 'development') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('🔗 Preview URL (для разработки): %s', previewUrl);
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      if (error.stack) {
        console.error('Error stack:', error.stack);
      }
    }
    return false;
  }
}

// Отправка рассылки на email
export async function sendBroadcastEmail(email: string, subject: string, message: string): Promise<boolean> {
  try {
    console.log(`📧 Sending broadcast email to: ${email}`);
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"TG Flow" <${requiredEnvVars.SMTP_FROM}>`,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">${subject}</h2>
          <div style="line-height: 1.6; color: #333;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px; text-align: center;">
            Это сообщение отправлено администрацией каталога каналов.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Broadcast email sent successfully:', info.messageId);

    // В режиме разработки с Ethereal покажем URL для просмотра
    if (!requiredEnvVars.SMTP_PASSWORD || process.env.NODE_ENV === 'development') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('🔗 Preview URL (для разработки): %s', previewUrl);
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Error sending broadcast email:', error);
    return false;
  }
}

// Проверка действительности кода
export function isCodeValid(code: string, storedCode: string, expiresAt: Date | null): boolean {
  if (!storedCode || !expiresAt) {
    return false;
  }

  const now = new Date();
  return code === storedCode && now <= expiresAt;
}

// Устаревшие функции для совместимости (используют новые реализации)
export async function sendVerificationEmail(email: string, code: string) {
  return sendEmailVerificationCode(email, code);
}

export async function sendPasswordResetEmail(email: string, code: string) {
  return sendPasswordResetCode(email, code);
}

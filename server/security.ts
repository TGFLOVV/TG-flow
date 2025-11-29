
export interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDuration: number;
  sessionTimeout: number;
  passwordMinLength: number;
  passwordMaxLength: number;
}

export const securityConfig: SecurityConfig = {
  maxLoginAttempts: 5,
  lockoutDuration: 30 * 60 * 1000, // 30 минут
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 часа
  passwordMinLength: 8,
  passwordMaxLength: 128
};

// Список запрещенных паролей
export const forbiddenPasswords = [
  'password', '12345678', 'qwerty123', 'admin123', 'password123',
  'letmein', 'welcome', 'monkey', '1234567890', 'password1',
  'abc123', 'qwerty', 'trustno1', 'dragon', 'master'
];

// Список запрещенных имен пользователей
export const forbiddenUsernames = [
  'admin', 'administrator', 'root', 'system', 'test', 'null',
  'undefined', 'api', 'www', 'mail', 'ftp', 'email', 'user',
  'guest', 'demo', 'public', 'private', 'secure', 'support'
];

// Проверка силы пароля
export function checkPasswordStrength(password: string): { isStrong: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < securityConfig.passwordMinLength) {
    errors.push(`Пароль должен содержать минимум ${securityConfig.passwordMinLength} символов`);
  }
  
  if (password.length > securityConfig.passwordMaxLength) {
    errors.push(`Пароль не может быть длиннее ${securityConfig.passwordMaxLength} символов`);
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Пароль должен содержать хотя бы одну строчную букву');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Пароль должен содержать хотя бы одну заглавную букву');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Пароль должен содержать хотя бы одну цифру');
  }
  
  if (forbiddenPasswords.includes(password.toLowerCase())) {
    errors.push('Пароль слишком простой, выберите более сложный');
  }
  
  return {
    isStrong: errors.length === 0,
    errors
  };
}

// Проверка валидности имени пользователя
export function validateUsername(username: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (username.length < 3) {
    errors.push('Логин должен содержать минимум 3 символа');
  }
  
  if (username.length > 30) {
    errors.push('Логин не может быть длиннее 30 символов');
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Логин может содержать только латинские буквы, цифры и знак подчеркивания');
  }
  
  if (forbiddenUsernames.some(forbidden => username.toLowerCase().includes(forbidden))) {
    errors.push('Данный логин недоступен');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Проверка на XSS
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // удаляем < и >
    .replace(/javascript:/gi, '') // удаляем javascript:
    .replace(/on\w+=/gi, '') // удаляем on* события
    .trim();
}

// Проверка на подозрительную активность
export function isRequestSuspicious(req: any): boolean {
  const path = req.path.toLowerCase();
  const userAgent = req.get('User-Agent') || '';
  
  // Проверяем на попытки доступа к системным файлам
  const systemPaths = [
    '/etc/passwd', '/etc/shadow', '/.env', '/config',
    '/admin', '/phpmyadmin', '/wp-admin', '/.git'
  ];
  
  if (systemPaths.some(sp => path.includes(sp))) {
    return true;
  }
  
  // Проверяем на SQL инъекции в URL
  const sqlPatterns = [
    'union select', 'drop table', 'insert into',
    'delete from', 'update set', 'create table'
  ];
  
  if (sqlPatterns.some(pattern => path.includes(pattern))) {
    return true;
  }
  
  // Проверяем на подозрительный User-Agent
  const suspiciousAgents = [
    'sqlmap', 'nikto', 'burp', 'nmap', 'masscan',
    'gobuster', 'dirb', 'wfuzz', 'hydra'
  ];
  
  if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    return true;
  }
  
  return false;
}

// Логирование событий безопасности
export function logSecurityEvent(event: string, details: any) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    details,
    level: 'SECURITY'
  };
  
  console.warn('[SECURITY]', JSON.stringify(logEntry));
  
  // В продакшене здесь можно добавить отправку в систему мониторинга
  // например, Sentry, DataDog, или собственную систему логирования
}

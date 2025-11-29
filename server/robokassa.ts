import crypto from "crypto";
import config from "../config";

export interface RobokassaPaymentData {
  merchantLogin: string;
  outSum: string;
  invId: string;
  description: string;
  signatureValue: string;
  culture: string;
  encoding: string;
  email?: string;
  expirationDate?: string;
  userIp?: string;
}

export interface RobokassaResultData {
  outSum: string;
  invId: string;
  signatureValue: string;
}

/**
 * Генерирует MD5 подпись для платежа
 */
export function generatePaymentSignature(
  merchantLogin: string,
  outSum: string,
  invId: string,
  password: string,
): string {
  const signatureString = `${merchantLogin}:${outSum}:${invId}:${password}`;
  console.log('🔍 Signature string:', signatureString);
  const hash = crypto
    .createHash("md5")
    .update(signatureString, 'utf8')
    .digest("hex")
    .toUpperCase();
  console.log('🔐 Generated hash:', hash);
  return hash;
}

/**
 * Проверяет подпись результата платежа
 */
export function verifyResultSignature(
  outSum: string,
  invId: string,
  signatureValue: string,
  password: string,
): boolean {
  const signatureString = `${outSum}:${invId}:${password}`; // Исправлено
  const expectedSignature = crypto
    .createHash("md5")
    .update(signatureString)
    .digest("hex")
    .toUpperCase();
  return expectedSignature === signatureValue.toUpperCase();
}

/**
 * Создает URL для перенаправления на ROBOKASSA
 */
export function createPaymentUrl(
  outSum: number,
  invId: string,
  description: string,
  email?: string,
  isTest: boolean = false
): string {
  console.log('🔍 Robokassa createPaymentUrl called with:', {
    outSum,
    invId,
    description,
    email
  });

  const merchantLogin = config.ROBOKASSA_MERCHANT_LOGIN;
  const password1 = config.ROBOKASSA_PASSWORD_1;

  console.log('🔑 Using credentials:', {
    merchantLogin,
    passwordLength: password1?.length || 0
  });

  const outSumStr = outSum.toFixed(2);
  console.log('⚙️ Generating signature with:', { merchantLogin, outSumStr, invId });
  
  const signature = generatePaymentSignature(merchantLogin, outSumStr, invId, password1);
  console.log('✅ Generated signature:', signature);

  const baseUrl = "https://auth.robokassa.ru/Merchant/Index.aspx";
  
  // Проверяем обязательные параметры
  if (!merchantLogin || !password1) {
    throw new Error('Robokassa credentials not configured');
  }
  
  if (!outSum || outSum <= 0) {
    throw new Error('Invalid payment amount');
  }

  // Упрощаем параметры для избежания ошибки 503
  const params = new URLSearchParams({
    MerchantLogin: merchantLogin,
    OutSum: outSumStr,
    InvId: invId,
    Description: description,
    SignatureValue: signature
  });
  
  // Добавляем IsTest только если это тестовый режим
  if (isTest) {
    params.append("IsTest", "1");
  }
  
  // Убираем дополнительные параметры для избежания ошибки 503
  
  console.log('📋 Payment parameters:', {
    MerchantLogin: merchantLogin,
    OutSum: outSumStr,
    InvId: invId,
    Description: description.substring(0, 50),
    IsTest: isTest ? "1" : "not set",
    IncCurrLabel: "RUB",
    signatureLength: signature.length,
    Culture: "ru",
    Encoding: "utf-8"
  });

  if (email) {
    params.append("Email", email);
  }

  const finalUrl = `${baseUrl}?${params.toString()}`;
  console.log('🌐 Final payment URL created:', finalUrl);
  
  return finalUrl;
}

/**
 * Проверяет результат платежа от ROBOKASSA
 */
export function verifyPaymentResult(resultData: RobokassaResultData): boolean {
  const password2 = config.ROBOKASSA_PASSWORD_2;

  return verifyResultSignature(
    resultData.outSum,
    resultData.invId,
    resultData.signatureValue,
    password2,
  );
}

/**
 * Форматирует сумму для ROBOKASSA
 */
export function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Генерирует уникальный invoice ID
 */
export function generateInvoiceId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

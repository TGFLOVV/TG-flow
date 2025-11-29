
import crypto from 'crypto';
import appConfig from '../config';

export interface CloudPaymentsConfig {
  publicId: string;
  apiSecret: string;
  testMode: boolean;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  invoiceId: string;
  description: string;
  accountId: string;
  email?: string;
}

export interface PaymentResponse {
  success: boolean;
  model?: {
    transactionId: number;
    amount: number;
    currency: string;
    invoiceId: string;
    accountId: string;
    email?: string;
    data?: any;
    url?: string;
  };
  message?: string;
}

export interface PaymentNotification {
  TransactionId: number;
  Amount: string;
  Currency: string;
  DateTime: string;
  CardFirstSix: string;
  CardLastFour: string;
  CardType: string;
  CardExpDate: string;
  TestMode: string;
  Status: string;
  OperationType: string;
  InvoiceId: string;
  AccountId: string;
  SubscriptionId?: string;
  Name?: string;
  Email?: string;
  Data?: string;
}

// Удалена локальная конфигурация - используется глобальная config из config.ts

export class CloudPaymentsAPI {
  private publicId: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor(publicId: string, apiSecret: string, testMode: boolean = true) {
    this.publicId = publicId;
    this.apiSecret = apiSecret;
    this.baseUrl = 'https://api.cloudpayments.ru';
  }

  private createAuthHeader(): string {
    const credentials = `${this.publicId}:${this.apiSecret}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  private generateHmac(data: string): string {
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(data)
      .digest('hex');
  }

  async createPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      const requestBody = {
        Amount: paymentData.amount,
        Currency: paymentData.currency,
        InvoiceId: paymentData.invoiceId,
        Description: paymentData.description,
        AccountId: paymentData.accountId,
        Email: paymentData.email,
        RequireConfirmation: false,
        SendEmail: false,
        JsonData: {
          cloudPayments: {
            customerReceipt: {
              Items: [
                {
                  label: paymentData.description,
                  price: paymentData.amount,
                  quantity: 1.0,
                  amount: paymentData.amount,
                  vat: null
                }
              ],
              calculationPlace: "www.tgflovv.ru",
              informationSeller: "ИП Информация о продавце",
              amounts: {
                electronic: paymentData.amount,
                advancePayment: 0,
                credit: 0,
                provision: 0
              }
            }
          }
        }
      };

      const response = await fetch(`${this.baseUrl}/payments/cards/charge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.createAuthHeader(),
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok && result.Success) {
        return {
          success: true,
          model: {
            transactionId: result.Model?.TransactionId,
            amount: result.Model?.Amount,
            currency: result.Model?.Currency,
            invoiceId: result.Model?.InvoiceId,
            accountId: result.Model?.AccountId,
            email: result.Model?.Email,
            data: result.Model?.Data,
            url: result.Model?.PaReq ? `${this.baseUrl}/3ds` : undefined
          }
        };
      } else {
        return {
          success: false,
          message: result.Message || 'Payment failed'
        };
      }
    } catch (error) {
      console.error('CloudPayments API error:', error);
      return {
        success: false,
        message: 'Network error'
      };
    }
  }

  async getPaymentStatus(transactionId: number): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.createAuthHeader(),
        },
        body: JSON.stringify({
          TransactionId: transactionId
        }),
      });

      const result = await response.json();

      if (response.ok && result.Success) {
        return {
          success: true,
          model: result.Model
        };
      } else {
        return {
          success: false,
          message: result.Message || 'Failed to get payment status'
        };
      }
    } catch (error) {
      console.error('CloudPayments status check error:', error);
      return {
        success: false,
        message: 'Network error'
      };
    }
  }

  verifyNotification(notification: PaymentNotification, hmacHeader: string): boolean {
    // Создаем строку для проверки HMAC
    const dataString = Object.keys(notification)
      .sort()
      .map(key => `${key}=${notification[key as keyof PaymentNotification]}`)
      .join('&');

    const calculatedHmac = this.generateHmac(dataString);
    return calculatedHmac === hmacHeader;
  }
}

export const cloudPaymentsAPI = new CloudPaymentsAPI(
  appConfig.CLOUDPAYMENTS_PUBLIC_ID,
  appConfig.CLOUDPAYMENTS_API_SECRET,
  appConfig.NODE_ENV !== 'production'
);

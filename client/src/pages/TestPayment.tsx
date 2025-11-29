import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CloudPaymentsTestWidget from '@/components/CloudPaymentsTestWidget';
import { nanoid } from 'nanoid';
import { useToast } from '@/hooks/use-toast';

export default function TestPayment() {
  const [amount, setAmount] = useState(100);
  const [description, setDescription] = useState('Тестовый платеж');
  const [showPayment, setShowPayment] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [testResult, setTestResult] = useState('');
  const { toast } = useToast();

  const handleStartPayment = () => {
    const newOrderId = `test_${nanoid(10)}`;
    setOrderId(newOrderId);
    setShowPayment(true);
  };

  const handlePaymentSuccess = (paymentId: string) => {
    alert(`Платеж успешен! ID: ${paymentId}`);
    setShowPayment(false);
  };

  const handlePaymentError = (error: string) => {
    alert(`Ошибка платежа: ${error}`);
    setShowPayment(false);
  };

  const handlePaymentClose = () => {
    setShowPayment(false);
  };

  const testWebhook = async () => {
    try {
      // Получаем данные для тестирования webhook с правильной суммой
      const response = await fetch(`/api/cloudpayments/test-webhook?amount=${amount}`);
      const data = await response.json();
      setWebhookUrl(data.webhookUrl);
      
      // Отправляем тестовый webhook
      const webhookResponse = await fetch(data.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.testData)
      });
      
      if (webhookResponse.ok) {
        setTestResult(`✅ Webhook обработан успешно! Баланс пользователя должен быть пополнен на ${data.testData.Amount}₽`);
        toast({
          title: "Webhook отработал успешно",
          description: `Баланс пополнен на ${data.testData.Amount}₽`,
        });
      } else {
        const errorText = await webhookResponse.text();
        setTestResult(`❌ Ошибка webhook: ${errorText}`);
        toast({
          title: "Ошибка webhook",
          description: errorText,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMsg = `❌ Ошибка тестирования: ${error}`;
      setTestResult(errorMsg);
      toast({
        title: "Ошибка тестирования",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Тестирование CloudPayments
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Проверка интеграции с платежной системой CloudPayments
            </p>
          </div>

          {!showPayment ? (
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Настройки платежа</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Сумма (рубли)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    min={1}
                    max={100000}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Описание</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Описание платежа"
                  />
                </div>

                <Button 
                  onClick={handleStartPayment} 
                  className="w-full"
                  disabled={amount < 1}
                >
                  Инициировать платеж
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Оплата через CloudPayments</CardTitle>
              </CardHeader>
              <CardContent>
                <CloudPaymentsTestWidget
                  amount={amount}
                  description={description}
                  orderId={orderId}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
                <Button 
                  onClick={() => setShowPayment(false)} 
                  variant="outline"
                  className="w-full mt-6"
                >
                  ← Назад к настройкам
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Секция тестирования webhook */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Тестирование Webhook CloudPayments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Проверьте работу системы обработки платежей напрямую
              </p>
              
              <Button 
                onClick={testWebhook} 
                className="w-full"
                variant="secondary"
              >
                🔧 Протестировать Webhook
              </Button>

              {webhookUrl && (
                <div className="space-y-2">
                  <Label>Webhook URL:</Label>
                  <Input 
                    value={webhookUrl} 
                    readOnly 
                    className="text-xs"
                  />
                </div>
              )}

              {testResult && (
                <div className="space-y-2">
                  <Label>Результат тестирования:</Label>
                  <Textarea 
                    value={testResult} 
                    readOnly 
                    className="min-h-[100px] text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Информация о тестировании CloudPayments</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <p>• Используйте тестовые карты CloudPayments для проверки</p>
              <p>• Тестовая карта: 4242 4242 4242 4242 (любой CVV и срок)</p>
              <p>• Сумма автоматически обрабатывается через CloudPayments API</p>
              <p>• Статус платежа отображается в реальном времени</p>
              <p>• Webhook-уведомления обрабатываются на сервере</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
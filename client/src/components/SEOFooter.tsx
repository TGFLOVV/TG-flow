export default function SEOFooter() {
  return (
    <footer className="mt-auto py-12 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="text-center space-y-6">



          



          {/* Copyright */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="text-xs text-gray-400 dark:text-gray-600 space-y-2">
              <p>© 2025 Все права защищены</p>
              <p>ИП Якубов Мохаммад Анзорович</p>
              <p>ОГРН 325050000097041</p>
              <div className="flex justify-center space-x-4 mt-2">
                <a 
                href="/privacy-policy" 
                className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors underline"
              >
                Политика конфиденциальности
              </a>
              <a 
                href="/pricing" 
                className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors underline"
              >
                Тарифы
              </a>
              <a 
                href="/public-offer" 
                className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors underline"
              >
                Публичная Оферта
              </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

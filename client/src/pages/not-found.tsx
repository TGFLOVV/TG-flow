import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import SEOFooter from "@/components/SEOFooter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-gray-800">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">404 Страница Не Найдена</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Did you forget to add the page to the router?
          </p>

          <div className="mt-6">
            <a 
              href="/" 
              className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 transition-colors"
            >
              ← Вернуться на домашнюю страницу
            </a>
          </div>
        </CardContent>
        </Card>
      </div>
      <SEOFooter />
    </div>
  );
}
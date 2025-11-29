
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
  text?: string;
}

export default function LoadingSpinner({ 
  size = "md", 
  className, 
  showText = true, 
  text = "Загрузка..." 
}: LoadingSpinnerProps) {
  const [mounted, setMounted] = useState(false);
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    setMounted(true);
    
    // Вычисляем оставшееся время на основе времени создания компонента
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, 2500 - elapsed);
    
    // Простой таймер для скрытия всего компонента
    const timer = setTimeout(() => {
      setMounted(false);
    }, remaining);

    return () => clearTimeout(timer);
  }, [startTime]);

  if (!mounted) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center",
        "bg-gradient-to-br from-blue-50 via-white to-blue-100",
        "dark:from-gray-800 dark:via-gray-900 dark:to-blue-900",
        className
      )}
      style={{
        animation: 'tg-main-loader 2.5s ease-out forwards'
      }}
    >
      {/* Floating Messages Container */}
      <div className="relative w-full h-full overflow-hidden">
        {/* Animated Messages */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white dark:bg-gray-700 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-600 px-4 py-2 text-sm text-gray-600 dark:text-gray-300"
            style={{
              left: `${20 + (i % 3) * 25}%`,
              bottom: '-50px',
              width: '120px',
              height: '40px',
              animation: `tg-message-float 3s ease-out infinite ${i * 0.3}s`
            }}
          >
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded mt-1"></div>
            <div className="w-3/4 h-2 bg-gray-200 dark:bg-gray-600 rounded mt-1"></div>
          </div>
        ))}

        {/* Central Logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            {/* TG Circle Logo */}
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"></div>
                <svg className="w-10 h-10 text-white relative z-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm5.568 8.16c-.18 1.896-.96 6.728-1.356 8.92-.168.93-.5 1.24-.82 1.27-.697.06-1.226-.46-1.9-.9-1.056-.69-1.653-1.12-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.53 5.831-2.538 6.998-3.024 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.32.023.464.138.121.097.155.228.171.32.016.092.036.301.02.465z"/>
                </svg>
              </div>
              <div className="absolute -inset-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full opacity-30 blur-lg"></div>
              
              {/* Ripple Effect */}
              <div 
                className="absolute border-2 border-blue-400"
                style={{ 
                  animation: 'tg-ripple 2s ease-out infinite',
                  borderRadius: '50%',
                  width: '80px',
                  height: '80px',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              ></div>
            </div>

            {/* FLOW Text */}
            <div className="flex items-center justify-center space-x-1">
              {['F', 'L', 'O', 'W'].map((letter, i) => (
                <span
                  key={i}
                  className="text-3xl font-bold text-gray-700 dark:text-gray-200"
                  style={{
                    animation: `tg-wave 2s ease-in-out infinite ${i * 0.1}s`
                  }}
                >
                  {letter}
                </span>
              ))}
            </div>

            {/* Loading Text */}
            {showText && (
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">
                {text}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PageLoader({ text = "Загрузка..." }: { text?: string }) {
  return <LoadingSpinner size="lg" text={text} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 space-y-3">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 skeleton-shimmer"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded skeleton-shimmer w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded skeleton-shimmer w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded skeleton-shimmer"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded skeleton-shimmer w-4/5"></div>
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6, columns = 3 }: { count?: number; columns?: number }) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  };

  return (
    <div className={cn("grid gap-4 lg:gap-6", gridCols[columns as keyof typeof gridCols])}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "next-themes";
import { useModalViewportFix } from "@/hooks/useModalViewportFix";

import React, { Suspense } from 'react';

// Direct imports to avoid lazy loading issues
import AuthPage from "@/pages/AuthPage";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Channels from "@/pages/Channels";
import ChannelDetail from "@/pages/ChannelDetail";
import CategoryDetail from "@/pages/CategoryDetail";
import Popular from "@/pages/Popular";
import Catalog from "@/pages/Catalog";
import Bots from "@/pages/Bots";
import Groups from "@/pages/Groups";
import News from "@/pages/News";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import MyPublications from "@/pages/MyPublications";
import Admin from "@/pages/Admin";
import Applications from "@/pages/Applications";
import WithdrawalRequests from "@/pages/WithdrawalRequests";
import Users from "@/pages/Users";
import Broadcast from "@/pages/Broadcast";
import TopUp from "@/pages/TopUp";

import FAQ from "@/pages/FAQ";
import PublicOffer from "@/pages/PublicOffer";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import Pricing from "@/pages/Pricing";
import NotFound from "@/pages/not-found";
import { PageLoader } from "@/components/LoadingSpinner";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ErrorBoundary";


const Router = React.memo(() => {
  const { isAuthenticated, isLoading, error: authError } = useAuth();
  const [location, setLocation] = useLocation();



  // Фиксируем модальные окна по центру экрана
  useModalViewportFix();

  // Handle auth success redirect only once
  React.useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('auth') === 'success') {
        // Remove the auth parameter from URL
        const newUrl = window.location.pathname;
        if (window.location.href !== newUrl) {
          window.history.replaceState({}, document.title, newUrl);
        }
      }
    } catch (error) {
      console.error('Error handling auth redirect:', error);
    }
  }, []); // Remove location dependency to prevent loops

  // Минимальные редиректы только когда нужно
  React.useEffect(() => {
    // Не делаем ничего пока загружается
    if (isLoading) return;
    
    // Публичные страницы (не требуют авторизации)
    const publicRoutes = ["/", "/auth", "/faq", "/public-offer", "/privacy-policy", "/pricing"];
    const protectedRoutes = ["/home", "/profile", "/settings", "/my-publications", "/admin", "/applications", "/users", "/broadcast", "/withdrawal-requests", "/topup"];
    
    // Редирект только если действительно нужен
    if (isAuthenticated && location === "/auth") {
      setLocation("/home");
    } else if (!isAuthenticated && protectedRoutes.includes(location)) {
      setLocation("/auth");
    }
  }, [isAuthenticated, isLoading, location]);

  // Логируем ошибки аутентификации только один раз
  React.useEffect(() => {
    if (authError && !isLoading) {
      console.error('Auth error:', authError);
    }
  }, [authError, isLoading]);

  // Show loading only when checking auth, but not on public pages
  const publicRoutes = ["/", "/auth", "/faq", "/public-offer", "/privacy-policy", "/pricing"];
  if (isLoading && !publicRoutes.includes(location)) {
    return <PageLoader text="Проверка авторизации..." />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/home" component={Home} />
        <Route path="/catalog" component={Catalog} />
        <Route path="/category" component={CategoryDetail} />
        <Route path="/channels" component={Channels} />
        <Route path="/channels/:id" component={ChannelDetail} />
        <Route path="/bots" component={Bots} />
        <Route path="/groups" component={Groups} />
        <Route path="/news" component={News} />
        <Route path="/news/:id" component={News} />
        <Route path="/popular" component={Popular} />
        <Route path="/faq" component={FAQ} />
        <Route path="/public-offer" component={PublicOffer} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/pricing" component={Pricing} />

        {isAuthenticated && (
          <>
            <Route path="/profile" component={Profile} />
            <Route path="/settings" component={Settings} />
            <Route path="/my-publications" component={MyPublications} />
            <Route path="/admin" component={Admin} />
            <Route path="/applications" component={Applications} />
            <Route path="/withdrawal-requests" component={WithdrawalRequests} />
            <Route path="/users" component={Users} />
            <Route path="/broadcast" component={Broadcast} />
            <Route path="/topup" component={TopUp} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
});

function AppContent() {
  return (
    <ErrorBoundary>
      <ThemedAppContent />
    </ErrorBoundary>
  );
}

function ThemedAppContent() {
  return (
    <div className="relative min-h-screen flex flex-col">
      <ErrorBoundary>
        <Router />
      </ErrorBoundary>
      <Toaster />
      <NotificationSystem isOpen={false} onClose={function (): void {
        throw new Error("Function not implemented.");
      } } />
      <PWAInstallPrompt />
      <SupportButton />
    </div>
  );
}

import NotificationSystem from "@/components/NotificationSystem";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import SupportButton from "@/components/SupportButton";

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AppContent />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

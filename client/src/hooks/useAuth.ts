import { useQuery } from "@tanstack/react-query";
import type { User } from "../../../shared/schema";
import { apiRequest } from "../lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/user");
        return response ?? null;
      } catch (error: any) {
        // Не логируем 401 ошибки как они ожидаемы для неавторизованных пользователей
        if (error.message?.includes('401') || error.status === 401) {
          return null;
        }
        console.error("Auth error:", error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 минут кэша для уменьшения количества запросов
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: false,
  });

  const refreshBalance = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      await queryClient.refetchQueries({ queryKey: ["/api/user"] });
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  }, [queryClient]);


  const isAuthenticated = !isLoading && user !== null && user !== undefined;

  const login = async (credentials: { username: string; password: string }) => {
    try {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return { user, isLoading, error, isAuthenticated, login, register, logout, refreshBalance };
}
import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/services/api";
import { removeTokens } from "@/utils/auth";
import { usePermissions } from "@/contexts/PermissionsContext";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  photo?: string | null;
  roleId: number;
  roleName?: string | null;
  status: string;
  createdAt?: string | null;
  exploitationId?: number | null; 
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { clearPermissions } = usePermissions();

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await api.get("/auth/me");
      const userData = response.data as any;
      if (userData?.id) {
        setUser(userData);
        await AsyncStorage.setItem("user", JSON.stringify(userData));
      }
    } catch {
      const cached = await AsyncStorage.getItem("user");
      if (cached) {
        setUser(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const logout = useCallback(async () => {
    await removeTokens();
    await AsyncStorage.removeItem("user");
    await clearPermissions();
    setUser(null);
  }, [clearPermissions]);

  const getFullName = useCallback(() => {
    if (!user) return "";
    return `${user.firstName} ${user.lastName}`;
  }, [user]);

  const getInitials = useCallback(() => {
    if (!user) return "??";
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }, [user]);

  return {
    user,
    loading,
    logout,
    getFullName,
    getInitials,
    isAuthenticated: !!user,
    refreshUser: fetchCurrentUser,
  };
}
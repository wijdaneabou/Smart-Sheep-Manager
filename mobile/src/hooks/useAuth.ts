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
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { clearPermissions } = usePermissions();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get("/auth/me");
      if (response.data.success) {
        setUser(response.data.data);
        await AsyncStorage.setItem("user", JSON.stringify(response.data.data));
      }
    } catch (error) {
      // Try cached user
      const cached = await AsyncStorage.getItem("user");
      if (cached) {
        setUser(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  };

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
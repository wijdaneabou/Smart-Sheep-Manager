// mobile/src/contexts/PermissionsContext.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ActivityIndicator, View, Platform } from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import api from "@/services/api";
import { PERMISSIONS_MAP, hasPermission, canAccessModule } from "@/constants/permissions";

type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  photo?: string | null;
  roleId: number;
  roleName?: string | null;
  status?: string;
  createdAt?: string;
};

type PermissionsContextValue = {
  permissions: string[];
  userRole: string;
  user: User | null;
  loading: boolean;
  hasPermission: (module: string, action: string) => boolean;
  hasAnyPermission: (module: string) => boolean;
  isAdmin: boolean;
  refreshPermissions: () => Promise<void>;
  clearPermissions: () => void;      // ✅ synchrone
  logout: () => void;                // ✅ synchrone
};

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get("/auth/me");
      return response.data as User;
    } catch {
      return null;
    }
  }, []);

  const refreshPermissions = useCallback(async () => {
    const userData = await fetchUser();
    if (userData) {
      setUser(userData);
      const role = userData.roleName || '';
      setUserRole(role);
      const perms = PERMISSIONS_MAP[role.toLowerCase()] || [];
      setPermissions(perms);
    }
  }, [fetchUser]);

  const clearPermissions = useCallback(() => {
    setPermissions([]);
    setUserRole("");
    setUser(null);
  }, []);

  const logout = useCallback(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    } else {
      SecureStore.deleteItemAsync("accessToken");
      SecureStore.deleteItemAsync("refreshToken");
    }
    clearPermissions();
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.href = "/login";
    } else {
      router.replace("/login");
    }
  }, [clearPermissions]);

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      try {
        const userData = await fetchUser();
        if (active && userData) {
          setUser(userData);
          const role = userData.roleName || '';
          setUserRole(role);
          const perms = PERMISSIONS_MAP[role.toLowerCase()] || [];
          setPermissions(perms);
        }
      } catch (error) {
        console.error("Failed to load user:", error);
      } finally {
        if (active) setLoading(false);
      }
    };
    bootstrap();
    return () => { active = false; };
  }, [fetchUser]);

  const value = useMemo(() => {
    const isAdmin = userRole.toLowerCase() === 'admin';

    const hasPerm = (module: string, action: string) => {
      if (isAdmin) return true;
      return hasPermission(userRole, module, action);
    };

    const hasAny = (module: string) => {
      if (isAdmin) return true;
      return canAccessModule(userRole, module);
    };

    return {
      permissions,
      userRole,
      user,
      loading,
      hasPermission: hasPerm,
      hasAnyPermission: hasAny,
      isAdmin,
      refreshPermissions,
      clearPermissions,
      logout,
    };
  }, [clearPermissions, loading, permissions, refreshPermissions, userRole, user, logout]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#15803D" />
      </View>
    );
  }

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions must be used within PermissionsProvider");
  }
  return context;
}
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
import {
  clearPermissionsSnapshot,
  fetchAndCachePermissions,
  loadPermissionsSnapshot,
  savePermissionsSnapshot,
  type PermissionsSnapshot,
} from "@/services/permissionsCache";
import api from "@/services/api";

type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  photo?: string | null;
  roleId: number;
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
  clearPermissions: () => Promise<void>;
  logout: () => void; // ✅ changed to void (no async needed for navigation)
};

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

function normalizeSnapshot(snapshot: PermissionsSnapshot | null): PermissionsSnapshot {
  return {
    permissions: snapshot?.permissions ?? [],
    userRole: snapshot?.userRole ?? "",
  };
}

async function fetchUser() {
  try {
    const response = await api.get("/auth/me");
    return response.data;
  } catch {
    return null;
  }
}

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const applySnapshot = useCallback(async (snapshot: PermissionsSnapshot) => {
    setPermissions(snapshot.permissions);
    setUserRole(snapshot.userRole);
    await savePermissionsSnapshot(snapshot);
  }, []);

  const refreshPermissions = useCallback(async () => {
    const snapshot = await fetchAndCachePermissions();
    setPermissions(snapshot.permissions);
    setUserRole(snapshot.userRole);
    const userData = await fetchUser();
    setUser(userData);
  }, []);

  const clearPermissions = useCallback(async () => {
    setPermissions([]);
    setUserRole("");
    setUser(null);
    await clearPermissionsSnapshot();
  }, []);

  // ✅ logout is now a plain function (no async) to simplify
  const logout = useCallback(() => {
    console.log("🟢 [logout] Started");

    // Clear tokens
    if (Platform.OS === "web" && typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    } else {
      SecureStore.deleteItemAsync("accessToken");
      SecureStore.deleteItemAsync("refreshToken");
    }
    console.log("🟢 [logout] Tokens cleared");

    // Clear state (fire and forget)
    clearPermissions();
    console.log("🟢 [logout] State cleared");

    // Navigate
    if (Platform.OS === "web" && typeof window !== "undefined") {
      console.log("🟢 [logout] Web – redirecting to /login");
      window.location.href = "/login";
    } else {
      console.log("🟢 [logout] Mobile – using router.replace('/login')");
      router.replace("/login");
    }
  }, [clearPermissions]);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const cached = normalizeSnapshot(await loadPermissionsSnapshot());
        if (active) {
          setPermissions(cached.permissions);
          setUserRole(cached.userRole);
        }

        const fresh = await fetchAndCachePermissions();
        if (active) {
          await applySnapshot(fresh);
        }

        const userData = await fetchUser();
        if (active) {
          setUser(userData);
        }
      } catch {
        // Keep cached permissions if refresh fails.
      } finally {
        if (active) setLoading(false);
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, [applySnapshot]);

  const value = useMemo<PermissionsContextValue>(() => {
    const isAdmin = userRole === "ADMIN";

    const hasPermission = (module: string, action: string) =>
      isAdmin || permissions.includes(`${module}:${action}`);

    const hasAnyPermission = (module: string) =>
      isAdmin || permissions.includes(`${module}:READ`);

    return {
      permissions,
      userRole,
      user,
      loading,
      hasPermission,
      hasAnyPermission,
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
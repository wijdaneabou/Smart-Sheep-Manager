import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ActivityIndicator, View } from "react-native";
import {
  clearPermissionsSnapshot,
  fetchAndCachePermissions,
  loadPermissionsSnapshot,
  savePermissionsSnapshot,
  type PermissionsSnapshot,
} from "@/services/permissionsCache";

type PermissionsContextValue = {
  permissions: string[];
  userRole: string;
  loading: boolean;
  hasPermission: (module: string, action: string) => boolean;
  hasAnyPermission: (module: string) => boolean;
  isAdmin: boolean;
  refreshPermissions: () => Promise<void>;
  clearPermissions: () => Promise<void>;
};

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

function normalizeSnapshot(snapshot: PermissionsSnapshot | null): PermissionsSnapshot {
  return {
    permissions: snapshot?.permissions ?? [],
    userRole: snapshot?.userRole ?? "",
  };
}

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState("");
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
  }, []);

  const clearPermissions = useCallback(async () => {
    setPermissions([]);
    setUserRole("");
    await clearPermissionsSnapshot();
  }, []);

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
      } catch {
        // Keep cached permissions if the refresh fails.
      } finally {
        if (active) setLoading(false);
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, [applySnapshot]);

  const value = useMemo<PermissionsContextValue>(() => {
    const hasPermission = (module: string, action: string) =>
      permissions.includes(`${module}:${action}`);

    const hasAnyPermission = (module: string) =>
      permissions.includes(`${module}:READ`);

    return {
      permissions,
      userRole,
      loading,
      hasPermission,
      hasAnyPermission,
      isAdmin: userRole === "ADMIN",
      refreshPermissions,
      clearPermissions,
    };
  }, [clearPermissions, loading, permissions, refreshPermissions, userRole]);

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

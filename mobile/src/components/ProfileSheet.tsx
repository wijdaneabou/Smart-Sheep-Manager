import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Animated,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useAuth } from "@/hooks/useAuth";
import { router } from "expo-router";

interface ProfileSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function ProfileSheet({ visible, onClose }: ProfileSheetProps) {
  const { userRole } = usePermissions();
  const { user, getFullName, getInitials, logout } = useAuth();
  const translateY = React.useRef(new Animated.Value(300)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          onClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleLogout = async () => {
    onClose();
    await logout();
    router.replace("/(auth)/login");
  };

  const handleNavigate = (path: string) => {
    onClose();
    router.push(path as any);
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY }] }]}
          {...panResponder.panHandlers}
        >
          {/* Drag handle */}
          <View style={styles.dragHandle} />

          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
            <Text style={styles.userName}>{getFullName() || "Utilisateur"}</Text>
            <Text style={styles.userEmail}>{user?.email || "email@ssm.ma"}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{userRole || "Utilisateur"}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Menu Items */}
          <MenuItem
            icon="person-outline"
            label="Modifier le profil"
            onPress={() => handleNavigate("/profile")}
          />
          <MenuItem
            icon="settings-outline"
            label="Paramètres"
            onPress={() => handleNavigate("/settings")}
          />
          <MenuItem
            icon="moon-outline"
            label="Mode sombre"
            onPress={() => {
              onClose();
            }}
          />
          <MenuItem
            icon="help-circle-outline"
            label="Aide & Support"
            onPress={() => handleNavigate("/help")}
          />

          {/* Divider */}
          <View style={styles.divider} />

          {/* Logout */}
          <Pressable style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#166534" />
            <Text style={[styles.menuText, styles.logoutText]}>Se déconnecter</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function MenuItem({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <Ionicons name={icon} size={22} color="#3E7A5B" />
      <Text style={styles.menuText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#8EBC9B" style={styles.chevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 42, 29, 0.4)",
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#CFE8D8",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  userInfo: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#15803D",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F2A1D",
  },
  userEmail: {
    fontSize: 13,
    color: "#5C8A72",
    marginTop: 2,
  },
  roleBadge: {
    marginTop: 8,
    backgroundColor: "#E6F8ED",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#15803D",
  },
  divider: {
    height: 1,
    backgroundColor: "#DDEFE4",
    marginVertical: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#0F2A1D",
  },
  chevron: {
    marginLeft: "auto",
  },
  logoutItem: {
    marginTop: 4,
  },
  logoutText: {
    color: "#166534",
  },
});
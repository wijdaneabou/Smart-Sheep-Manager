import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Switch,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { usePermissions } from "@/contexts/PermissionsContext";
import api, { getFileUrl } from "@/services/api";
import { router } from "expo-router"; // ✅ import router

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function ProfileModal({
  visible,
  onClose,
  isDarkMode,
  toggleDarkMode,
}: ProfileModalProps) {
  const { user, userRole, logout, refreshPermissions } = usePermissions();
  const [uploading, setUploading] = useState(false);

  const photoUrl = getFileUrl(user?.photo);

  const handleChangePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "Nous avons besoin d'accéder à votre galerie.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setUploading(true);

      try {
        const formData = new FormData();

        let fileToUpload: any;
        if (Platform.OS === "web" && asset.uri.startsWith("blob:")) {
          const response = await fetch(asset.uri);
          const blob = await response.blob();
          fileToUpload = new File([blob], "profile.jpg", { type: blob.type || "image/jpeg" });
        } else {
          fileToUpload = {
            uri: asset.uri,
            name: "profile.jpg",
            type: "image/jpeg",
          } as any;
        }

        formData.append("photo", fileToUpload);

        if (!user?.id) {
          Alert.alert("Erreur", "Utilisateur non identifié.");
          setUploading(false);
          return;
        }

        await api.post(`/users/${user.id}/photo`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        await refreshPermissions();
        Alert.alert("Succès", "Photo de profil mise à jour.");
      } catch (error: any) {
        console.error("Upload error:", error);
        const msg = error.response?.data?.error || error.message || "Erreur inconnue";
        Alert.alert("Erreur", `Impossible de télécharger la photo : ${msg}`);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleLogout = () => {
    console.log("🟢 [handleLogout] Called");
    onClose();
    setTimeout(() => {
      console.log("🟢 [handleLogout] Calling logout()");
      logout();
    }, 300);
  };

  const handleNavigate = (screen: string) => {
    onClose();
    if (screen === "profil") {
      router.push("/(dashboard)/profile"); // ✅ navigate to profile screen
    } else {
      Alert.alert("Navigation", `Naviguer vers ${screen}`);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close-outline" size={24} color="#0F2A1D" />
          </TouchableOpacity>

          <View style={styles.avatarContainer}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: "#E6F8ED" }]}>
                <Ionicons name="person-outline" size={40} color="#15803D" />
              </View>
            )}
            <TouchableOpacity
              style={styles.editPhotoBtn}
              onPress={handleChangePhoto}
              disabled={uploading}
            >
              <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
            {uploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
          </View>

          <Text style={styles.userName}>
            {user?.firstName || "Utilisateur"} {user?.lastName || ""}
          </Text>
          <Text style={styles.userEmail}>{user?.email || "email@exemple.com"}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{userRole || "Rôle"}</Text>
          </View>

          <View style={styles.optionsList}>
            <TouchableOpacity style={styles.optionItem} onPress={() => handleNavigate("profil")}>
              <Ionicons name="person-outline" size={22} color="#0F2A1D" />
              <Text style={styles.optionText}>Mon profil</Text>
              <Ionicons name="chevron-forward-outline" size={20} color="#5C8A72" style={styles.optionArrow} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionItem} onPress={() => handleNavigate("parametres")}>
              <Ionicons name="settings-outline" size={22} color="#0F2A1D" />
              <Text style={styles.optionText}>Paramètres</Text>
              <Ionicons name="chevron-forward-outline" size={20} color="#5C8A72" style={styles.optionArrow} />
            </TouchableOpacity>

            <View style={styles.optionItem}>
              <Ionicons name={isDarkMode ? "moon-outline" : "sunny-outline"} size={22} color="#0F2A1D" />
              <Text style={styles.optionText}>Mode sombre</Text>
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: "#D1D5DB", true: "#15803D" }}
                thumbColor="#FFFFFF"
                style={styles.switch}
              />
            </View>

            <TouchableOpacity style={styles.optionItem} onPress={() => handleNavigate("langue")}>
              <Ionicons name="globe-outline" size={22} color="#0F2A1D" />
              <Text style={styles.optionText}>Langue</Text>
              <Text style={styles.optionValue}>Français</Text>
              <Ionicons name="chevron-forward-outline" size={20} color="#5C8A72" style={styles.optionArrow} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.optionItem, styles.logoutItem]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="#DC2626" />
              <Text style={[styles.optionText, { color: "#DC2626" }]}>Déconnexion</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    width: "85%",
    maxWidth: 340,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 10,
  },
  closeBtn: {
    alignSelf: "flex-end",
    marginBottom: 4,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#15803D",
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  editPhotoBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#15803D",
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F2A1D",
    marginTop: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#5C8A72",
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: "#E6F8ED",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#15803D",
  },
  optionsList: {
    width: "100%",
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#0F2A1D",
    marginLeft: 12,
    flex: 1,
  },
  optionArrow: {
    marginLeft: 8,
  },
  optionValue: {
    fontSize: 14,
    color: "#5C8A72",
    marginRight: 4,
  },
  switch: {
    marginLeft: 8,
  },
  logoutItem: {
    borderBottomWidth: 0,
    marginTop: 4,
  },
});
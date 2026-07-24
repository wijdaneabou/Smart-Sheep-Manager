import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from "react-native";


export default function ResetPasswordScreen() {
  const { code } = useLocalSearchParams<{
    code: string;
  }>();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  async function handleResetPassword() {
    if (!password || !confirmPassword) {
      Alert.alert(
        "Erreur",
        "Veuillez remplir tous les champs."
      );
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        "Erreur",
        "Le mot de passe doit contenir au moins 8 caractères."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Erreur",
        "Les mots de passe ne correspondent pas."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/reset-password", {
        code,
        password,
      });

      const data = response.data;

      if (!data.success) {
        Alert.alert(
          "Erreur",
          data.message
        );
        return;
      }

      Alert.alert(
        "Succès",
        "Votre mot de passe a été modifié avec succès.",
        [
          {
            text: "OK",
            onPress: () =>
              router.replace("/login"),
          },
        ]
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Erreur",
        "Impossible de contacter le serveur."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Nouveau mot de passe
      </Text>

      <Text style={styles.subtitle}>
        Choisissez un nouveau mot de passe sécurisé.
      </Text>

      {/* Nouveau mot de passe */}

      <Text style={styles.label}>
        Nouveau mot de passe
      </Text>

      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color="#8A8A8A"
          style={styles.leftIcon}
        />

        <TextInput
          placeholder="********"
          placeholderTextColor="#B5B5B5"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        <TouchableOpacity
          onPress={() =>
            setShowPassword(!showPassword)
          }
        >
          <Ionicons
            name={
              showPassword
                ? "eye-off-outline"
                : "eye-outline"
            }
            size={20}
            color="#8A8A8A"
          />
        </TouchableOpacity>
      </View>

      {/* Confirmation */}

      <Text style={styles.label}>
        Confirmer le mot de passe
      </Text>

      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color="#8A8A8A"
          style={styles.leftIcon}
        />

        <TextInput
          placeholder="********"
          placeholderTextColor="#B5B5B5"
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.input}
        />

        <TouchableOpacity
          onPress={() =>
            setShowConfirmPassword(
              !showConfirmPassword
            )
          }
        >
          <Ionicons
            name={
              showConfirmPassword
                ? "eye-off-outline"
                : "eye-outline"
            }
            size={20}
            color="#8A8A8A"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          loading && { opacity: 0.7 },
        ]}
        disabled={loading}
        onPress={handleResetPassword}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>
            Modifier le mot de passe
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.replace("/login")}
      >
        <Text style={styles.back}>
          Retour à la connexion
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 25,
    backgroundColor: "#FFFFFF",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    color: "#0F2A1D",
  },

  subtitle: {
    textAlign: "center",
    color: "#5C8A72",
    marginTop: 10,
    marginBottom: 35,
    lineHeight: 22,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2F6B46",
    marginBottom: 8,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D9D9D9",
    borderRadius: 10,
    height: 55,
    paddingHorizontal: 12,
    marginBottom: 18,
  },

  leftIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#0F2A1D",
  },

  button: {
    backgroundColor: "#2E7D32",
    height: 55,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  back: {
    textAlign: "center",
    marginTop: 25,
    color: "#2E7D32",
    fontWeight: "600",
  },
});
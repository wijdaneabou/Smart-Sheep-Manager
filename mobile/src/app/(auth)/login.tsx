import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import api, { saveToken } from "@/services/api";

import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleLogin = async () => {
    setEmailError("");
    setPasswordError("");

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email,
        password,
      });

      await saveToken("accessToken", response.data.accessToken);
      await saveToken("refreshToken", response.data.refreshToken);

      console.log("Access Token:", response.data.accessToken);
      console.log("Refresh Token:", response.data.refreshToken);

      Alert.alert("Succès", response.data.message);
      router.replace("/(dashboard)");

    } catch (error: any) {
      const data = error.response?.data;

      if (data?.errors) {
        if (data.errors.email) setEmailError(data.errors.email[0]);
        if (data.errors.password) setPasswordError(data.errors.password[0]);
        return;
      }

      Alert.alert("Erreur", data?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Smart Sheep Manager
      </Text>

      <Text style={styles.subtitle}>
        Connectez-vous à votre compte
      </Text>

      {/* Email */}

      <Text style={styles.label}>
        Adresse Email
      </Text>

      <View style={styles.inputContainer}>

        <Ionicons
          name="mail-outline"
          size={20}
          color="#8A8A8A"
          style={styles.leftIcon}
        />

        <TextInput
          placeholder="nom@gmail.com"
          placeholderTextColor="#B5B5B5"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />

      </View>

      {emailError !== "" && (
        <Text style={styles.errorText}>
          {emailError}
        </Text>
      )}

      {/* Mot de passe */}

      <View style={styles.passwordHeader}>

        <Text style={styles.label}>
          Mot de passe
        </Text>

        <TouchableOpacity
          onPress={() =>
            router.push("/(auth)/forgot-password")
          }
        >
          <Text style={styles.forgotPassword}>
            Mot de passe oublié ?
          </Text>
        </TouchableOpacity>

      </View>

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

      {passwordError !== "" && (
        <Text style={styles.errorText}>
          {passwordError}
        </Text>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading
            ? "Connexion..."
            : "Se connecter"}
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#222",
    textAlign: "center",
  },

  subtitle: {
    textAlign: "center",
    color: "#777",
    marginTop: 8,
    marginBottom: 40,
    fontSize: 15,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 8,
  },

  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },

  forgotPassword: {
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "500",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D9D9D9",
    borderRadius: 10,
    height: 55,
    paddingHorizontal: 12,
    marginBottom: 6,
  },

  leftIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#222",
  },

  errorText: {
    color: "#DC2626",
    fontSize: 13,
    marginBottom: 12,
    marginLeft: 4,
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

});
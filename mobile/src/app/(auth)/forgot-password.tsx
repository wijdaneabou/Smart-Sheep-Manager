import { useState } from "react";
import { router } from "expo-router";
import api from "@/services/api";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";


const API_URL = "http://192.168.1.105:3000/api";


export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleForgotPassword() {
    if (!email.trim()) {
      Alert.alert(
        "Erreur",
        "Veuillez saisir votre adresse email."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/forgot-password", {
        email,
      });

      const data = response.data;

      if (!data.success) {
        Alert.alert(
          "Erreur",
          data.message || "Une erreur est survenue."
        );
        return;
      }

      Alert.alert(
        "Code envoyé",
        "Un code de vérification a été envoyé à votre adresse email.",
        [
          {
            text: "Continuer",
            onPress: () =>
              router.replace({
                pathname: "/verify-code",
                params: { email },
              }),
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
        Mot de passe oublié
      </Text>

      <Text style={styles.subtitle}>
        Entrez votre adresse email pour recevoir un code de vérification.
      </Text>

      <Text style={styles.label}>
        Adresse Email
      </Text>

      <TextInput
        placeholder="nom@gmail.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <TouchableOpacity
        style={[
          styles.button,
          loading && { opacity: 0.6 },
        ]}
        disabled={loading}
        onPress={handleForgotPassword}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>
            Envoyer le code
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
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
    color: "#222",
    marginBottom: 10,
  },

  subtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: 25,
    lineHeight: 22,
  },

  label: {
    fontWeight: "600",
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: "#D9D9D9",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
  },

  button: {
    backgroundColor: "#2E7D32",
    padding: 15,
    borderRadius: 10,
    marginTop: 25,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 17,
  },

  back: {
    textAlign: "center",
    marginTop: 25,
    color: "#2E7D32",
    fontWeight: "600",
  },
});
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
  

export default function VerifyCodeScreen() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerifyCode() {
    if (code.length !== 6) {
      Alert.alert(
        "Erreur",
        "Veuillez saisir le code à 6 chiffres."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/verify-reset-code", {
        code,
      });

      const data = response.data;

      if (!data.success) {
        Alert.alert(
          "Erreur",
          data.message
        );
        return;
      }

      router.replace({
        pathname: "/reset-password",
        params: {
          code,
        },
      });

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
        Vérification
      </Text>

      <Text style={styles.subtitle}>
        Entrez le code de vérification reçu par email.
      </Text>

      <Text style={styles.label}>
        Code de vérification
      </Text>

      <TextInput
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
        style={styles.input}
      />

      <TouchableOpacity
        style={[
          styles.button,
          loading && { opacity: 0.7 },
        ]}
        disabled={loading}
        onPress={handleVerifyCode}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>
            Vérifier le code
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.back()}
      >
        <Text style={styles.back}>
          Retour
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
  },

  subtitle: {
    textAlign: "center",
    color: "#666",
    marginVertical: 20,
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
    fontSize: 20,
    textAlign: "center",
    letterSpacing: 10,
  },

  button: {
    backgroundColor: "#2E7D32",
    padding: 15,
    borderRadius: 10,
    marginTop: 30,
    alignItems: "center",
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
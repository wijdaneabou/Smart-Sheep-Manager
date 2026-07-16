import { router } from "expo-router";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ForgotPasswordScreen() {
  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Mot de passe oublié
      </Text>

      <Text style={styles.subtitle}>
        Entrez votre adresse email pour recevoir un lien de réinitialisation.
      </Text>

      <Text style={styles.label}>Adresse Email</Text>

      <TextInput
        placeholder="nom@gmail.com"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>
          Envoyer le lien
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.back()}
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

  logo: {
    fontSize: 70,
    textAlign: "center",
    marginBottom: 15,
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
    marginVertical: 25,
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
  },

  buttonText: {
    color: "#FFF",
    textAlign: "center",
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
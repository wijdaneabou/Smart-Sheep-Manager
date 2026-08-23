import { View, Text, Pressable, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const GREEN = "#15803D";

export default function CommercialScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name="cart-outline" size={32} color={GREEN} />
        </View>
        <Text style={styles.title}>Commercialisation</Text>
        <Text style={styles.subtitle}>
          Gérez vos clients et prospects pour structurer votre réseau commercial.
        </Text>
        <Link href={"/commercial/clients" as any} asChild>
          <Pressable style={styles.button}>
            <Ionicons name="people-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}>Accéder aux clients</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F2FAF5",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    maxWidth: 360,
    width: "100%",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#E6F8ED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GREEN,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});

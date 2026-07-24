import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ModulePlaceholderProps {
  title: string;
  icon: string;
  color?: string;
}

export default function ModulePlaceholder({
  title,
  icon,
  color = "#2E7D32",
}: ModulePlaceholderProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon as any} size={48} color={color} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Module en construction</Text>
      <Text style={styles.description}>
        Cette fonctionnalité sera disponible dans une prochaine mise à jour.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },
});
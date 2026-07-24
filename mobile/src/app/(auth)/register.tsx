import { View, Text, StyleSheet } from "react-native";
import { BackButton } from "@/components/BackButton";

export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      <BackButton variant="light" style={styles.backButton} />
      <Text>Register Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 10,
  },
});

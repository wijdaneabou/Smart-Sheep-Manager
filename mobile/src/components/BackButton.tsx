import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from "react-native";

type BackButtonProps = {
  variant?: "light" | "dark";
  label?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function BackButton({ variant = "light", label, onPress, style }: BackButtonProps) {
  const isDark = variant === "dark";

  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      style={({ pressed }) => [
        styles.button,
        isDark ? styles.dark : styles.light,
        pressed && styles.pressed,
        style,
      ]}
      hitSlop={10}
    >
      <Ionicons
        name="arrow-back"
        size={18}
        color={isDark ? "#FFFFFF" : "#14532D"}
      />
      {label ? (
        <Text style={[styles.label, isDark ? styles.darkLabel : styles.lightLabel]}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  pressed: {
    opacity: 0.82,
  },
  light: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  dark: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
  lightLabel: {
    color: "#14532D",
  },
  darkLabel: {
    color: "#FFFFFF",
  },
});

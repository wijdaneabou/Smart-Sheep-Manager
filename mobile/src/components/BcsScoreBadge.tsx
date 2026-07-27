import React from "react";
import { View, Text, StyleSheet } from "react-native";

export interface BcsScoreBadgeProps {
  score: number;
  label?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
}

export function getBcsColorAndLabel(score: number): { color: string; label: string } {
  if (score < 2.0) return { color: "#DC2626", label: "Maigre" };
  if (score < 3.0) return { color: "#EA580C", label: "Mince" };
  if (score < 4.0) return { color: "#16A34A", label: "Idéal" };
  if (score < 4.5) return { color: "#CA8A04", label: "Gras" };
  return { color: "#B91C1C", label: "Obèse" };
}

export function BcsScoreBadge({ score, label, color, size = "md" }: BcsScoreBadgeProps) {
  const info = getBcsColorAndLabel(score);
  const badgeColor = color ?? info.color;
  const badgeLabel = label ?? info.label;

  const isSmall = size === "sm";
  const isLarge = size === "lg";

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: `${badgeColor}15`, borderColor: badgeColor },
        isSmall && styles.badgeSm,
        isLarge && styles.badgeLg,
      ]}
    >
      <Text
        style={[
          styles.scoreText,
          { color: badgeColor },
          isSmall && styles.scoreTextSm,
          isLarge && styles.scoreTextLg,
        ]}
      >
        BCS {score.toFixed(1)}
      </Text>
      <View style={[styles.dot, { backgroundColor: badgeColor }]} />
      <Text
        style={[
          styles.labelText,
          { color: badgeColor },
          isSmall && styles.labelTextSm,
          isLarge && styles.labelTextLg,
        ]}
      >
        {badgeLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  badgeLg: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 8,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: "700",
  },
  scoreTextSm: {
    fontSize: 11,
  },
  scoreTextLg: {
    fontSize: 16,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  labelText: {
    fontSize: 12,
    fontWeight: "600",
  },
  labelTextSm: {
    fontSize: 10,
  },
  labelTextLg: {
    fontSize: 15,
  },
});

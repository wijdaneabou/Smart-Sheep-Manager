import { type ReactNode } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type {
  FeedCategory,
  FeedItem,
  FeedRation,
  TargetType,
  TimeOfDay,
  DistributionTargetType,
} from "../../../../services/feedingService";

function FeedingShared() {
  return null;
}

export default FeedingShared;

export type RationLine = {
  feedItemId: number | null;
  quantityKg: string;
};

export const categories: { value: FeedCategory; label: string }[] = [
  { value: "FOURRAGE", label: "Foin" },
  { value: "CONCENTRE", label: "Concentre" },
  { value: "SILAGE" as FeedCategory, label: "Silage" },
  { value: "MINERAL", label: "Mineraux" },
  { value: "COMPLEMENT", label: "Complement" },
  { value: "AUTRE", label: "Autre" },
];

export const targets: { value: TargetType; label: string }[] = [
  { value: "TOUS", label: "Tout le troupeau" },
  { value: "AGNELAUX", label: "Agnelaux" },
  { value: "AGNEAUX_SEVRAGE", label: "Agneaux sevrage" },
  { value: "BREBILLONS", label: "Brebillons" },
  { value: "BELIERS", label: "Beliers" },
  { value: "AGNELLES", label: "Agnelles" },
  { value: "AUTRE", label: "Autre" },
];

export const initialLines: RationLine[] = [
  { feedItemId: null, quantityKg: "1" },
  { feedItemId: null, quantityKg: "0.4" },
  { feedItemId: null, quantityKg: "0.1" },
];

export function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.metricCard}>
      <Ionicons name={icon} size={20} color="#17633A" />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export function NumberBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.numberBlock}>
      <Text style={styles.numberValue}>{value}</Text>
      <Text style={styles.numberLabel}>{label}</Text>
    </View>
  );
}

export function ModalHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <View style={styles.modalHeader}>
      <Text style={styles.modalTitle}>{title}</Text>
      <Pressable style={styles.closeButton} onPress={onClose}>
        <Ionicons name="close" size={22} color="#123326" />
      </Pressable>
    </View>
  );
}

export function Input({
  label,
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "decimal-pad";
  multiline?: boolean;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        {...props}
        style={[styles.input, props.multiline && styles.textArea]}
        placeholderTextColor="#8FA79A"
      />
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function parseNumber(value?: string | number | null) {
  if (value === null || value === undefined) return 0;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatNumber(value?: string | number | null) {
  return parseNumber(value).toFixed(2);
}

export function averageCost(rations: FeedRation[]) {
  if (rations.length === 0) return "0.00";
  const total = rations.reduce((sum, ration) => sum + parseNumber(ration.costPerKg), 0);
  return (total / rations.length).toFixed(2);
}

export function targetLabel(value: TargetType) {
  return targets.find((target) => target.value === value)?.label || value;
}

export function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function startOfTodayIso() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export function endOfTodayIso() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

export function LoadingScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.loaderContainer}>
        <ActivityIndicator color="#17633A" size="large" />
      </View>
    </SafeAreaView>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return <Text style={styles.error}>{message}</Text>;
}

export function EmptyState({
  icon,
  title,
  text,
  actionLabel,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={36} color="#17633A" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
      {actionLabel && onAction ? (
        <Pressable style={styles.primaryButton} onPress={onAction}>
          <Text style={styles.primaryButtonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5FAF6",
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  error: {
    color: "#B42318",
    fontSize: 13,
    fontWeight: "700",
  },
  metricCard: {
    flex: 1,
    minHeight: 104,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    padding: 12,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E2EFE7",
  },
  metricValue: {
    color: "#10281D",
    fontSize: 20,
    fontWeight: "900",
  },
  metricLabel: {
    color: "#5C7468",
    fontSize: 12,
    fontWeight: "700",
  },
  numberBlock: {
    flex: 1,
    minHeight: 62,
    borderRadius: 8,
    backgroundColor: "#F5FAF6",
    padding: 10,
    justifyContent: "center",
  },
  numberValue: {
    color: "#10281D",
    fontSize: 16,
    fontWeight: "900",
  },
  numberLabel: {
    color: "#5C7468",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    color: "#10281D",
    fontSize: 24,
    fontWeight: "900",
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2EFE7",
  },
  inputGroup: {
    gap: 7,
  },
  inputLabel: {
    color: "#2B4638",
    fontSize: 13,
    fontWeight: "800",
  },
  input: {
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DCEBE2",
    backgroundColor: "#FBFEFC",
    paddingHorizontal: 12,
    color: "#10281D",
    fontSize: 15,
    ...Platform.select({ web: { outlineStyle: "none" as any } }),
  },
  textArea: {
    minHeight: 88,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    minHeight: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DCEBE2",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: "#17633A",
    borderColor: "#17633A",
  },
  chipText: {
    color: "#2B4638",
    fontSize: 13,
    fontWeight: "800",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  emptyState: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DCEBE2",
    backgroundColor: "#FFFFFF",
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: {
    color: "#10281D",
    fontSize: 18,
    fontWeight: "900",
  },
  emptyText: {
    color: "#5C7468",
    fontSize: 14,
    textAlign: "center",
  },
  primaryButton: {
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: "#17633A",
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});

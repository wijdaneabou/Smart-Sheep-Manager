import { View, Text, Pressable, StyleSheet } from "react-native";

type Props = {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
};

export default function Pagination({ page, totalPages, onPrev, onNext }: Props) {
  if (totalPages <= 1) return null;

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, page === 1 && styles.buttonDisabled]}
        onPress={onPrev}
        disabled={page === 1}
      >
        <Text style={[styles.buttonText, page === 1 && styles.buttonTextDisabled]}>‹ Précédent</Text>
      </Pressable>

      <View style={styles.pageInfo}>
        <Text style={styles.pageText}>
          Page {page} / {totalPages}
        </Text>
      </View>

      <Pressable
        style={[styles.button, page === totalPages && styles.buttonDisabled]}
        onPress={onNext}
        disabled={page === totalPages}
      >
        <Text style={[styles.buttonText, page === totalPages && styles.buttonTextDisabled]}>Suivant ›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#14532d",
  },
  buttonTextDisabled: {
    color: "#999",
  },
  pageInfo: {
    flex: 1,
    alignItems: "center",
  },
  pageText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
  },
});

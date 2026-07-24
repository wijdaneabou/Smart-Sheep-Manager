import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
} from "react-native";
import { ROLES } from "../constants/roles";

type RolePickerProps = {
  label?: string;
  value: number | null;
  onChange: (roleId: number, roleName: string) => void;
};

export default function RolePicker({
  label = "Role",
  value,
  onChange,
}: RolePickerProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedRole = ROLES.find((r) => r.id === value);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>

      <Pressable style={styles.field} onPress={() => setModalVisible(true)}>
        <Text
          style={[styles.fieldText, !selectedRole && styles.placeholderText]}
        >
          {selectedRole ? selectedRole.name : "Selectionner un role"}
        </Text>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Choisir un role</Text>

            <FlatList
              data={ROLES}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onChange(item.id, item.name);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.optionText}>{item.name}</Text>
                  {item.id === value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "600", color: "#2F6B46", marginBottom: 6 },
  field: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fieldText: { fontSize: 15, color: "#0F2A1D" },
  placeholderText: { color: "#A6C8B2" },
  chevron: { fontSize: 16, color: "#8EBC9B" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 42, 29, 0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: "60%",
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    color: "#0F2A1D",
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5F4EA",
  },
  optionText: { fontSize: 15, color: "#0F2A1D" },
  checkmark: { fontSize: 16, color: "#15803D", fontWeight: "700" },
});
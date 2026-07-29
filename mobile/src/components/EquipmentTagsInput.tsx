import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type Props = {
  value: string[];
  onChange: (value: string[]) => void;
};

export default function EquipmentTagsInput({ value, onChange }: Props) {
  const [draft, setDraft] = useState("");

  function addEquipment() {
    const equipment = draft.trim();
    if (!equipment || value.includes(equipment)) return;
    onChange([...value, equipment]);
    setDraft("");
  }

  return (
    <View>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Ex. Abreuvoir"
          placeholderTextColor="#aaa"
          onSubmitEditing={addEquipment}
          returnKeyType="done"
        />
        <Pressable style={styles.addButton} onPress={addEquipment}>
          <Text style={styles.addButtonText}>Ajouter</Text>
        </Pressable>
      </View>
      {value.length > 0 && (
        <View style={styles.tags}>
          {value.map((equipment) => (
            <Pressable
              key={equipment}
              onPress={() => onChange(value.filter((item) => item !== equipment))}
              style={styles.tag}
            >
              <Text style={styles.tagText}>{equipment} ×</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  addButton: {
    justifyContent: "center",
    paddingHorizontal: 12,
    backgroundColor: "#166534",
    borderRadius: 10,
  },
  addButtonText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  tag: { backgroundColor: "#dcfce7", borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { color: "#166534", fontSize: 12, fontWeight: "600" },
});

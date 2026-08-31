import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  listMessages,
  sendMessage,
  markMessageRead,
  type MarketplaceMessage,
} from "../../../../../services/marketplaceService";
import { usePermissions } from "@/contexts/PermissionsContext";

const GREEN = "#0F7A3C";

export default function ListingMessagesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { hasPermission } = usePermissions();
  const [messages, setMessages] = useState<MarketplaceMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const canSend = hasPermission("MARKETPLACE", "CREATE");

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      const result = await listMessages({
        listingId: Number(id),
        page: 1,
        limit: 50,
      });
      setLoading(false);
      if (result.success) {
        setMessages(result.data);
      } else {
        setError(result.message);
      }
    }
    load();
  }, [id]);

  async function handleSend() {
    if (!newMessage.trim() || !id) return;
    setSending(true);
    setError(null);

    const senderId = currentUserId || 1;
    const receiverId = messages.length > 0 ? messages[0].senderId === senderId ? messages[0].receiverId : messages[0].senderId : 1;

    const result = await sendMessage({
      listingId: Number(id),
      senderId,
      receiverId,
      message: newMessage.trim(),
    });

    setSending(false);
    if (result.success) {
      setMessages((prev) => [...prev, result.message]);
      setNewMessage("");
    } else {
      setError(result.message);
    }
  }

  function renderMessage({ item }: { item: MarketplaceMessage }) {
    const isMe = item.senderId === currentUserId;
    return (
      <View
        style={[
          styles.messageBubble,
          isMe ? styles.messageBubbleMe : styles.messageBubbleOther,
        ]}
      >
        <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
          {item.message}
        </Text>
        <Text style={styles.messageTime}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={GREEN} />
          </Pressable>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={{ width: 32 }} />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <FlatList
          data={messages}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={renderMessage}
          ListEmptyComponent={
            <Text style={styles.empty}>Aucun message pour le moment.</Text>
          }
        />

        {canSend && (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Écrire un message..."
              placeholderTextColor="#999"
              value={newMessage}
              onChangeText={setNewMessage}
            />
            <Pressable
              style={[styles.sendButton, sending && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  backButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center", marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: "800", color: "#111" },
  error: { color: "#dc2626", marginBottom: 8, fontSize: 13, paddingHorizontal: 16 },
  listContent: { paddingHorizontal: 16, paddingBottom: 80 },
  empty: { textAlign: "center", color: "#888", marginTop: 24 },

  messageBubble: {
    maxWidth: "80%",
    padding: 10,
    borderRadius: 14,
    marginBottom: 8,
  },
  messageBubbleMe: {
    alignSelf: "flex-end",
    backgroundColor: "#DCFCE7",
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
  },
  messageText: { fontSize: 14, lineHeight: 18 },
  messageTextMe: { color: "#14532d" },
  messageTextOther: { color: "#111" },
  messageTime: { fontSize: 10, color: "#888", marginTop: 4, textAlign: "right" },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#ECECE6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: { opacity: 0.6 },
});

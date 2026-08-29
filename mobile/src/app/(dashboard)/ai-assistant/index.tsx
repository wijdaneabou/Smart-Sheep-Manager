import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import {
  sendChatMessage,
  getConversationMessages,
  listConversations,
  type AiMessage,
  type AiConversation,
} from "@/services/aiService";

const GREEN = "#14532d";
const CREAM = "#f5f5f0";
const BORDER = "#ECECE6";

type DisplayMessage = {
  id: string;
  role: "user" | "model";
  content: string;
  pending?: boolean;
};

const SUGGESTIONS = [
  "Combien d'animaux ai-je actuellement ?",
  "Y a-t-il des alertes santé en cours ?",
  "Quel est le GMQ de mes lots d'engraissement ?",
  "Résume ma trésorerie sur 30 jours",
];

function formatConversationDate(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export default function AIAssistantScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList>(null);

  const [conversationId, setConversationId] = useState<number | undefined>(undefined);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Historique des conversations
  const [historyVisible, setHistoryVisible] = useState(false);
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);

  const loadHistory = useCallback(async (id: number) => {
    setLoadingHistory(true);
    const result = await getConversationMessages(id);
    if (result.success) {
      setMessages(
        result.messages.map((m: AiMessage) => ({
          id: String(m.id),
          role: m.role,
          content: m.content,
        }))
      );
    } else {
      Alert.alert("Erreur", result.message);
    }
    setLoadingHistory(false);
  }, []);

  const openHistory = useCallback(async () => {
    setHistoryVisible(true);
    setLoadingConversations(true);
    const result = await listConversations();
    if (result.success) {
      // Les plus récentes en premier
      setConversations([...result.conversations].reverse());
    } else {
      Alert.alert("Erreur", result.message);
    }
    setLoadingConversations(false);
  }, []);

  function handleSelectConversation(id: number) {
    setHistoryVisible(false);
    if (id !== conversationId) {
      setConversationId(id);
      loadHistory(id);
    }
  }

  function handleNewConversation() {
    setHistoryVisible(false);
    setConversationId(undefined);
    setMessages([]);
    setInput("");
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    const userMessage: DisplayMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: text,
    };
    const pendingReply: DisplayMessage = {
      id: `pending-${Date.now()}`,
      role: "model",
      content: "",
      pending: true,
    };

    setMessages((prev) => [...prev, userMessage, pendingReply]);
    setInput("");
    setSending(true);

    const result = await sendChatMessage(text, conversationId);

    setSending(false);

    if (result.success) {
      setConversationId(result.conversationId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingReply.id
            ? { id: `reply-${Date.now()}`, role: "model", content: result.reply }
            : m
        )
      );
    } else {
      // Retire le message factice et affiche l'erreur
      setMessages((prev) => prev.filter((m) => m.id !== pendingReply.id));
      Alert.alert("Erreur", result.message);
    }
  }

  function handleSuggestion(text: string) {
    setInput(text);
  }

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const showSuggestions = messages.length === 0 && !loadingHistory;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerIconButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={GREEN} />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={styles.headerAvatar}>
              <Ionicons name="sparkles" size={16} color="#fff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Assistant IA</Text>
              <Text style={styles.headerSubtitle}>Smart Sheep Manager</Text>
            </View>
          </View>
          <Pressable onPress={openHistory} style={styles.headerIconButton} hitSlop={12}>
            <Ionicons name="time-outline" size={22} color={GREEN} />
          </Pressable>
        </View>

        {loadingHistory ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={GREEN} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <MessageBubble message={item} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="sparkles-outline" size={28} color={GREEN} />
                </View>
                <Text style={styles.emptyTitle}>Comment puis-je vous aider ?</Text>
                <Text style={styles.emptyText}>
                  Posez-moi une question sur votre troupeau, la santé de vos animaux, vos
                  lots d'engraissement ou vos finances.
                </Text>
              </View>
            }
          />
        )}

        {showSuggestions && (
          <View style={styles.suggestionsWrap}>
            {SUGGESTIONS.map((s) => (
              <Pressable key={s} style={styles.suggestionChip} onPress={() => handleSuggestion(s)}>
                <Text style={styles.suggestionText} numberOfLines={1}>
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Barre de saisie */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Écrivez votre message..."
            placeholderTextColor="#B0B0B0"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={2000}
          />
          <Pressable
            style={[styles.sendButton, (!input.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="send" size={18} color="#fff" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Modal historique des conversations */}
      <Modal
        visible={historyVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setHistoryVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setHistoryVisible(false)} />
        <SafeAreaView style={styles.modalSheet} edges={["bottom"]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Conversations</Text>
            <Pressable onPress={() => setHistoryVisible(false)} hitSlop={12}>
              <Ionicons name="close" size={22} color="#666" />
            </Pressable>
          </View>

          <Pressable style={styles.newConversationButton} onPress={handleNewConversation}>
            <Ionicons name="add-circle-outline" size={18} color={GREEN} />
            <Text style={styles.newConversationText}>Nouvelle conversation</Text>
          </Pressable>

          {loadingConversations ? (
            <View style={styles.center}>
              <ActivityIndicator size="small" color={GREEN} />
            </View>
          ) : conversations.length === 0 ? (
            <View style={styles.modalEmptyState}>
              <Text style={styles.modalEmptyText}>Aucune conversation pour l'instant.</Text>
            </View>
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ paddingBottom: 24 }}
              renderItem={({ item }) => {
                const isActive = item.id === conversationId;
                return (
                  <Pressable
                    style={[styles.conversationRow, isActive && styles.conversationRowActive]}
                    onPress={() => handleSelectConversation(item.id)}
                  >
                    <View style={styles.conversationIcon}>
                      <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={16}
                        color={isActive ? "#fff" : GREEN}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.conversationTitle, isActive && styles.conversationTitleActive]}
                        numberOfLines={1}
                      >
                        {item.title || "Nouvelle conversation"}
                      </Text>
                      <Text
                        style={[styles.conversationDate, isActive && styles.conversationDateActive]}
                      >
                        {formatConversationDate(item.updatedAt)}
                      </Text>
                    </View>
                  </Pressable>
                );
              }}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function MessageBubble({ message }: { message: DisplayMessage }) {
  const isUser = message.role === "user";

  if (message.pending) {
    return (
      <View style={[styles.bubbleRow, styles.bubbleRowModel]}>
        <View style={styles.modelAvatar}>
          <Ionicons name="sparkles" size={13} color="#fff" />
        </View>
        <View style={[styles.bubble, styles.bubbleModel, styles.bubbleTyping]}>
          <ActivityIndicator size="small" color={GREEN} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowModel]}>
      {!isUser && (
        <View style={styles.modelAvatar}>
          <Ionicons name="sparkles" size={13} color="#fff" />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleModel]}>
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: CREAM },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerIconButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  headerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 15, fontWeight: "700", color: GREEN, textAlign: "center" },
  headerSubtitle: { fontSize: 11, color: "#888", textAlign: "center" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  listContent: { padding: 16, paddingBottom: 8, flexGrow: 1 },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingTop: 60 },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#111", marginBottom: 6 },
  emptyText: { fontSize: 13, color: "#888", textAlign: "center", lineHeight: 19 },

  suggestionsWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  suggestionText: { fontSize: 13, color: "#444", fontWeight: "500" },

  bubbleRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 12, gap: 8 },
  bubbleRowUser: { justifyContent: "flex-end" },
  bubbleRowModel: { justifyContent: "flex-start" },
  modelAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: GREEN,
    borderBottomRightRadius: 4,
  },
  bubbleModel: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleTyping: { paddingVertical: 12, paddingHorizontal: 16 },
  bubbleText: { fontSize: 14.5, lineHeight: 21, color: "#1f2937" },
  bubbleTextUser: { color: "#fff" },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  input: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14.5,
    color: "#1f2937",
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: { opacity: 0.4 },

  // Modal historique
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modalSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "75%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#111" },

  newConversationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  newConversationText: { fontSize: 14, fontWeight: "600", color: GREEN },

  modalEmptyState: { paddingVertical: 40, alignItems: "center" },
  modalEmptyText: { fontSize: 13, color: "#999" },

  conversationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 4,
  },
  conversationRowActive: { backgroundColor: GREEN },
  conversationIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  conversationTitle: { fontSize: 14, fontWeight: "600", color: "#1f2937" },
  conversationTitleActive: { color: "#fff" },
  conversationDate: { fontSize: 12, color: "#999", marginTop: 2 },
  conversationDateActive: { color: "#D1FAE5" },
});
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { BackButton } from "@/components/BackButton";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import api, { saveToken } from "@/services/api";
import { usePermissions } from "@/contexts/PermissionsContext";

type Language = "fr" | "en" | "ar";

const COPY = {
  fr: {
    subtitle: "",
    sectionTitle: "Connexion",
    email: "Adresse Email",
    password: "Mot de passe",
    forgot: "Mot de passe oublié ?",
    button: "Se connecter",
    loading: "Connexion...",
    emailPlaceholder: "nom@gmail.com",
    passwordPlaceholder: "********",
    language: "Langue",
  },
  en: {
    subtitle: "",
    sectionTitle: "Sign in",
    email: "Email Address",
    password: "Password",
    forgot: "Forgot password?",
    button: "Sign in",
    loading: "Signing in...",
    emailPlaceholder: "name@gmail.com",
    passwordPlaceholder: "********",
    language: "Language",
  },
  ar: {
    subtitle: "",
    sectionTitle: "تسجيل الدخول",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    forgot: "نسيت كلمة المرور؟",
    button: "تسجيل الدخول",
    loading: "جاري تسجيل الدخول...",
    emailPlaceholder: "name@gmail.com",
    passwordPlaceholder: "********",
    language: "اللغة",
  },
} as const;

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [language, setLanguage] = useState<Language>("fr");
  const { refreshPermissions } = usePermissions();

  const copy = COPY[language];
  const isArabic = language === "ar";

  const handleLogin = async () => {
    setEmailError("");
    setPasswordError("");

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email,
        password,
      });

      await saveToken("accessToken", response.data.accessToken);
      await saveToken("refreshToken", response.data.refreshToken);
      router.replace("/(dashboard)");
      void refreshPermissions();
    } catch (error: any) {
      console.log("LOGIN ERROR STATUS:", error.response?.status);
      console.log("LOGIN ERROR DATA:", error.response?.data);
      console.log("LOGIN ERROR MESSAGE:", error.message);
      
      const data = error.response?.data;

      if (data?.errors) {
        if (data.errors.email) setEmailError(data.errors.email[0]);
        if (data.errors.password) setPasswordError(data.errors.password[0]);
        return;
      }

      Alert.alert("Erreur", data?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.bgShapeTop} />
      <View style={styles.bgShapeBottom} />
      <BackButton variant="light" style={styles.backButton} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandBlock}>
            <View style={styles.logoWrap}>
              <Image
                source={require("../logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.brandSubtitle, isArabic && styles.rtlText]}>
              {copy.subtitle}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{copy.sectionTitle}</Text>

            <Text style={[styles.label, isArabic && styles.rtlText]}>{copy.email}</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#7C8A97" style={styles.leftIcon} />
              <TextInput
                placeholder={copy.emailPlaceholder}
                placeholderTextColor="#A8B3BD"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                style={[styles.input, isArabic && styles.rtlInput]}
                textAlign={isArabic ? "right" : "left"}
              />
            </View>
            {emailError !== "" && <Text style={styles.errorText}>{emailError}</Text>}

            <View style={styles.passwordHeader}>
              <Text style={[styles.label, isArabic && styles.rtlText]}>{copy.password}</Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password") }>
                <Text style={styles.forgotPassword}>{copy.forgot}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#7C8A97" style={styles.leftIcon} />
              <TextInput
                placeholder={copy.passwordPlaceholder}
                placeholderTextColor="#A8B3BD"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                style={[styles.input, isArabic && styles.rtlInput]}
                textAlign={isArabic ? "right" : "left"}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#7C8A97"
                />
              </TouchableOpacity>
            </View>
            {passwordError !== "" && <Text style={styles.errorText}>{passwordError}</Text>}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.buttonText}>
                {loading ? copy.loading : copy.button}
              </Text>
            </TouchableOpacity>

            <View style={styles.languageFooter}>
              <Text style={styles.languageLabel}>{copy.language}</Text>
              <View style={styles.languagePills}>
                {(["ar", "fr", "en"] as Language[]).map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setLanguage(item)}
                    style={[styles.languagePill, language === item && styles.languagePillActive]}
                  >
                    <Text
                      style={[
                        styles.languagePillText,
                        language === item && styles.languagePillTextActive,
                      ]}
                    >
                      {item.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, // ✅ unique définition de flex
  screen: {
    flex: 1,
    backgroundColor: "#F2FAF5",
  },
  backButton: {
    position: "absolute",
    top: 18,
    left: 18,
    zIndex: 10,
  },
  bgShapeTop: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 240,
    top: -100,
    right: -90,
    backgroundColor: "rgba(21, 128, 61, 0.08)",
  },
  bgShapeBottom: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 260,
    bottom: -110,
    left: -110,
    backgroundColor: "rgba(21, 128, 61, 0.08)",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 28,
  },
  languageFooter: {
    marginTop: 18,
    alignItems: "center",
    gap: 10,
  },
  languageLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#166534",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  languagePills: {
    flexDirection: "row",
    gap: 12,
  },
  languagePill: {
    minWidth: 44,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#15803D",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  languagePillActive: {
    backgroundColor: "#15803D",
    borderColor: "#15803D",
  },
  languagePillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#15803D",
  },
  languagePillTextActive: {
    color: "#FFFFFF",
  },
  brandBlock: {
    alignItems: "center",
    marginBottom: 22,
  },
  logoWrap: {
    width: 118,
    height: 118,
    borderRadius: 34,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDEFE4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#0F2A1D",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  logo: {
    width: 88,
    height: 88,
  },
  brandSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#5C8A72",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  rtlText: {
    writingDirection: "rtl",
    textAlign: "right",
  },
  rtlInput: {
    writingDirection: "rtl",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 22,
    borderWidth: 1,
    borderColor: "#DDEFE4",
    shadowColor: "#0F2A1D",
    shadowOpacity: 0.06,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#102033",
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2F6B46",
    marginBottom: 8,
  },
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  forgotPassword: {
    fontSize: 12,
    color: "#1D4ED8",
    fontWeight: "700",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D6DEE8",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 14,
  },
  leftIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#0F2A1D",
  },
  errorText: {
    color: "#166534",
    fontSize: 12,
    marginTop: 7,
    marginLeft: 4,
  },
  button: {
    marginTop: 22,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#15803D",
    shadowColor: "#15803D",
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
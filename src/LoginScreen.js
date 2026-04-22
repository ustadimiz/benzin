import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { login, register } from "./auth";

const PALETTE = {
  bg: "#081B26",
  card: "#0C202D",
  border: "#1A3E53",
  inputBg: "#0D2230",
  inputBorder: "#1E465D",
  inputFocus: "#0EA5E9",
  textPrimary: "#EAF7FF",
  textSecondary: "#8CB8CF",
  textMuted: "#4E7A92",
  accent: "#0EA5E9",
  accentDark: "#0B7DB5",
  success: "#22C55E",
  error: "#F87171",
  tabInactiveBg: "#0D2230",
  tabInactiveText: "#5A8BA3",
};

export default function LoginScreen({ onAuthSuccess, lang = "tr" }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState(null);

  const T = lang === "tr" ? TR : EN;

  function resetForm() {
    setDisplayName("");
    setEmail("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setShowPassword(false);
    setShowConfirm(false);
  }

  function switchMode(next) {
    resetForm();
    setMode(next);
  }

  function handleGuestContinue() {
    Alert.alert(T.guestWarningTitle, T.guestWarningMsg, [
      {
        text: T.guestWarningCancel,
        style: "cancel",
        onPress: () => switchMode("register"),
      },
      {
        text: T.guestWarningConfirm,
        onPress: () =>
          onAuthSuccess({
            id: "guest-local",
            username: "guest",
            displayName: T.guestDisplayName,
          }),
      },
    ]);
  }

  function handleForgotPassword() {
    Alert.alert(T.forgotPasswordTitle, T.forgotPasswordMsg, [
      {
        text: T.forgotPasswordRegister,
        onPress: () => switchMode("register"),
      },
      {
        text: T.ok,
        style: "cancel",
      },
    ]);
  }

  async function handleSubmit() {
    setError("");

    if (mode === "register") {
      if (!displayName.trim()) return setError(T.errorDisplayName);
      if (!email.trim()) return setError(T.errorEmailEmpty);
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError(T.errorEmailInvalid);
      if (username.trim().length < 3) return setError(T.errorUsernameShort);
      if (/\s/.test(username)) return setError(T.errorUsernameSpace);
      if (password.length < 4) return setError(T.errorPasswordShort);
      if (password !== confirmPassword) return setError(T.errorPasswordMismatch);
    } else {
      if (!username.trim()) return setError(T.errorUsernameEmpty);
      if (!password) return setError(T.errorPasswordEmpty);
    }

    setLoading(true);
    try {
      let user;
      if (mode === "register") {
        user = await register(displayName, email, username, password);
      } else {
        user = await login(username, password);
      }
      onAuthSuccess(user);
    } catch (e) {
      if (e.message === "USERNAME_TAKEN") setError(T.errorUsernameTaken);
      else if (e.message === "EMAIL_TAKEN") setError(T.errorEmailTaken);
      else if (e.message === "ACCOUNT_DELETED") setError(T.errorAccountDeleted);
      else if (e.message === "ACCOUNT_DELETE_NOT_AVAILABLE") setError(T.errorAccountDeleteUnavailable);
      else if (e.message === "USER_NOT_FOUND") setError(T.errorUserNotFound);
      else if (e.message === "WRONG_PASSWORD") setError(T.errorWrongPassword);
      else if (e.message === "EMAIL_NOT_CONFIRMED") setError(T.errorEmailNotConfirmed);
      else if (e.message === "SIGNUP_DISABLED") setError(T.errorSignupDisabled);
      else if (e.message === "WEAK_PASSWORD") setError(T.errorWeakPassword);
      else if (e.message === "SUPABASE_NOT_CONFIGURED") setError(T.errorSupabaseConfig);
      else if (typeof e.message === "string" && e.message.startsWith("AUTH_DETAIL:")) {
        setError(`${T.errorGenericPrefix}${e.message.replace("AUTH_DETAIL:", "")}`);
      }
      else setError(T.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = (field) => [
    styles.input,
    focusedField === field && styles.inputFocused,
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Decorative blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />
      <View style={styles.blobMidAccent} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo ───────────────────────────────────── */}
          <View style={styles.logoSection}>
            <View style={styles.logoMark}>
              <View style={styles.logoGlyphWrap}>
                <MaterialCommunityIcons name="car" size={36} color="#434B5C" />
              </View>
              <View style={styles.logoLineStack}>
                <View style={[styles.logoLine, { width: 30 }]} />
                <View style={[styles.logoLine, { width: 24 }]} />
                <View style={[styles.logoLine, { width: 18 }]} />
              </View>
            </View>
            <Text style={styles.appName}>{T.appName}</Text>
            <Text style={styles.appSub}>{T.appSub}</Text>
          </View>

          {/* ── Auth Card ───────────────────────────────── */}
          <View style={styles.card}>
            {/* Tab switcher */}
            <View style={styles.tabRow}>
              <Pressable
                style={[styles.tab, mode === "login" && styles.tabActive]}
                onPress={() => switchMode("login")}
              >
                <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>
                  {T.tabLogin}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tab, mode === "register" && styles.tabActive]}
                onPress={() => switchMode("register")}
              >
                <Text style={[styles.tabText, mode === "register" && styles.tabTextActive]}>
                  {T.tabRegister}
                </Text>
              </Pressable>
            </View>

            <View style={styles.formBody}>
              {/* Display Name — register only */}
              {mode === "register" && (
                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>{T.labelDisplayName}</Text>
                  <View style={inputStyle("displayName")}>
                    <MaterialCommunityIcons
                      name="account-outline"
                      size={18}
                      color={focusedField === "displayName" ? PALETTE.accent : PALETTE.textMuted}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.inputText}
                      placeholder={T.placeholderDisplayName}
                      placeholderTextColor={PALETTE.textMuted}
                      value={displayName}
                      onChangeText={setDisplayName}
                      autoCapitalize="words"
                      onFocus={() => setFocusedField("displayName")}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>
              )}

              {/* Email — register only */}
              {mode === "register" && (
                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>{T.labelEmail}</Text>
                  <View style={inputStyle("email")}>
                    <MaterialCommunityIcons
                      name="email-outline"
                      size={18}
                      color={focusedField === "email" ? PALETTE.accent : PALETTE.textMuted}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.inputText}
                      placeholder={T.placeholderEmail}
                      placeholderTextColor={PALETTE.textMuted}
                      value={email}
                      onChangeText={(t) => setEmail(t.trim().toLowerCase())}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>
              )}

              {/* Username */}
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>{mode === "login" ? T.labelLoginIdentifier : T.labelUsername}</Text>
                <View style={inputStyle("username")}>
                  <MaterialCommunityIcons
                    name="at"
                    size={18}
                    color={focusedField === "username" ? PALETTE.accent : PALETTE.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.inputText}
                    placeholder={mode === "login" ? T.placeholderLoginIdentifier : T.placeholderUsername}
                    placeholderTextColor={PALETTE.textMuted}
                    value={username}
                    onChangeText={(t) => setUsername(t.toLowerCase().replace(/\s/g, ""))}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="default"
                    onFocus={() => setFocusedField("username")}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>{T.labelPassword}</Text>
                <View style={inputStyle("password")}>
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={18}
                    color={focusedField === "password" ? PALETTE.accent : PALETTE.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.inputText, styles.flex]}
                    placeholder={T.placeholderPassword}
                    placeholderTextColor={PALETTE.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                  />
                  <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn} hitSlop={8}>
                    <MaterialCommunityIcons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color={PALETTE.textMuted}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Confirm Password — register only */}
              {mode === "register" && (
                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>{T.labelConfirmPassword}</Text>
                  <View style={inputStyle("confirm")}>
                    <MaterialCommunityIcons
                      name="lock-check-outline"
                      size={18}
                      color={focusedField === "confirm" ? PALETTE.accent : PALETTE.textMuted}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.inputText, styles.flex]}
                      placeholder={T.placeholderConfirmPassword}
                      placeholderTextColor={PALETTE.textMuted}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirm}
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setFocusedField("confirm")}
                      onBlur={() => setFocusedField(null)}
                    />
                    <Pressable onPress={() => setShowConfirm((v) => !v)} style={styles.eyeBtn} hitSlop={8}>
                      <MaterialCommunityIcons
                        name={showConfirm ? "eye-off-outline" : "eye-outline"}
                        size={18}
                        color={PALETTE.textMuted}
                      />
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Error */}
              {!!error && (
                <View style={styles.errorWrap}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={15} color={PALETTE.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Submit */}
              <Pressable
                style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed, loading && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name={mode === "login" ? "login" : "account-plus-outline"}
                      size={18}
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.submitBtnText}>
                      {mode === "login" ? T.btnLogin : T.btnRegister}
                    </Text>
                  </>
                )}
              </Pressable>

              {mode === "login" && (
                <View style={styles.forgotRow}>
                  <Pressable onPress={handleForgotPassword} hitSlop={6}>
                    <Text style={styles.forgotLink}>{T.forgotPasswordLink}</Text>
                  </Pressable>
                </View>
              )}

              {/* Switch mode hint */}
              <View style={styles.switchWrap}>
                <Text style={styles.switchText}>
                  {mode === "login" ? T.hintNoAccount : T.hintHaveAccount}
                </Text>
                <Pressable
                  onPress={() =>
                    mode === "login" ? handleGuestContinue() : switchMode("login")
                  }
                  hitSlop={6}
                >
                  <Text style={styles.switchLink}>
                    {mode === "login" ? T.linkGuestContinue : T.linkLogin}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* ── Footer ─────────────────────────────────── */}
          <Text style={styles.footer}>Araç Defterim · v1.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Translations ─────────────────────────────────────────────────
const TR = {
  appName: "Araç Defterim",
  appSub: "Yakıt & Bakım Takibi",
  tabLogin: "Giriş Yap",
  tabRegister: "Kayıt Ol",
  labelDisplayName: "Ad Soyad",
  labelEmail: "E-posta",
  labelLoginIdentifier: "Kullanıcı Adı / E-posta",
  labelUsername: "Kullanıcı Adı",
  labelPassword: "Şifre",
  labelConfirmPassword: "Şifre Tekrar",
  placeholderDisplayName: "Ahmet Yılmaz",
  placeholderEmail: "ornek@mail.com",
  placeholderLoginIdentifier: "ahmet123 veya ornek@mail.com",
  placeholderUsername: "ahmet123",
  placeholderPassword: "En az 4 karakter",
  placeholderConfirmPassword: "Şifreyi tekrar gir",
  btnLogin: "Giriş Yap",
  btnRegister: "Hesap Oluştur",
  forgotPasswordLink: "Şifremi unuttum",
  forgotPasswordTitle: "Şifre Sıfırlama",
  forgotPasswordMsg:
    "Şifre sıfırlama için sunucu tabanlı hesap altyapısı gerekir. Şu an yerel hesaplarda otomatik şifre kurtarma yok. İsterseniz yeni hesap oluşturabilirsiniz.",
  forgotPasswordRegister: "Kayıt ekranına git",
  ok: "Tamam",
  hintNoAccount: "Hesabın yok mu?",
  linkGuestContinue: "Üyeliksiz devam et",
  hintHaveAccount: "Zaten hesabın var mı?",
  linkLogin: "Giriş yap",
  guestDisplayName: "Misafir",
  guestWarningTitle: "Uyarı!",
  guestWarningMsg:
    "Üyeliksiz devam ettiğinizde verileriniz sadece bu cihazda saklanır. Uygulama silinirse veya telefon değiştirirseniz verileriniz kaybolabilir. Devam etmek istiyor musunuz?",
  guestWarningConfirm: "Evet, devam et",
  guestWarningCancel: "Vazgeç, kayıt ol",
  errorDisplayName: "Ad soyad boş bırakılamaz.",
  errorEmailEmpty: "E-posta boş bırakılamaz.",
  errorEmailInvalid: "Geçerli bir e-posta adresi giriniz.",
  errorEmailTaken: "Bu e-posta zaten kullanılıyor.",
  errorUsernameEmpty: "Kullanıcı adı boş bırakılamaz.",
  errorUsernameShort: "Kullanıcı adı en az 3 karakter olmalıdır.",
  errorUsernameSpace: "Kullanıcı adında boşluk olamaz.",
  errorUsernameTaken: "Bu kullanıcı adı zaten alınmış.",
  errorUserNotFound: "Kullanıcı bulunamadı.",
  errorAccountDeleted: "Bu hesap silinmiş durumda. Giriş yapılamaz.",
  errorAccountDeleteUnavailable: "Hesap silme servisi hazır değil. Edge Function deploy edilmelidir.",
  errorPasswordEmpty: "Şifre boş bırakılamaz.",
  errorPasswordShort: "Şifre en az 4 karakter olmalıdır.",
  errorPasswordMismatch: "Şifreler eşleşmiyor.",
  errorWrongPassword: "Şifre hatalı.",
  errorEmailNotConfirmed: "E-posta doğrulanmamış. Mail kutunu kontrol edip tekrar giriş yap.",
  errorSignupDisabled: "Kayıt şu an kapalı. Supabase Authentication ayarlarından Email sign-up'ı aç.",
  errorWeakPassword: "Şifre yetersiz. Daha güçlü bir şifre deneyin.",
  errorSupabaseConfig: "Supabase ayarları eksik. app.json içindeki supabaseUrl ve supabaseAnonKey değerlerini doldur.",
  errorGenericPrefix: "Hata: ",
  errorGeneric: "Bir hata oluştu. Lütfen tekrar dene.",
};

const EN = {
  appName: "Vehicle Diary",
  appSub: "Fuel & Maintenance Tracking",
  tabLogin: "Login",
  tabRegister: "Register",
  labelDisplayName: "Full Name",
  labelEmail: "Email",
  labelLoginIdentifier: "Username / Email",
  labelUsername: "Username",
  labelPassword: "Password",
  labelConfirmPassword: "Confirm Password",
  placeholderDisplayName: "John Smith",
  placeholderEmail: "example@mail.com",
  placeholderLoginIdentifier: "john123 or example@mail.com",
  placeholderUsername: "john123",
  placeholderPassword: "At least 4 characters",
  placeholderConfirmPassword: "Re-enter password",
  btnLogin: "Login",
  btnRegister: "Create Account",
  forgotPasswordLink: "Forgot password?",
  forgotPasswordTitle: "Reset Password",
  forgotPasswordMsg:
    "Password reset needs a server-based account system. For now, local accounts do not support automatic password recovery. You can create a new account.",
  forgotPasswordRegister: "Go to register",
  ok: "OK",
  hintNoAccount: "Don't have an account?",
  linkGuestContinue: "Continue without account",
  hintHaveAccount: "Already have an account?",
  linkLogin: "Login",
  guestDisplayName: "Guest",
  guestWarningTitle: "Continue Without Account",
  guestWarningMsg:
    "If you continue without an account, your data will only be stored on this device. If the app is removed or you change your phone, your data may be lost. Do you want to continue?",
  guestWarningConfirm: "Yes, continue",
  guestWarningCancel: "Cancel, register",
  errorDisplayName: "Full name cannot be empty.",
  errorEmailEmpty: "Email cannot be empty.",
  errorEmailInvalid: "Please enter a valid email address.",
  errorEmailTaken: "This email is already in use.",
  errorUsernameEmpty: "Username cannot be empty.",
  errorUsernameShort: "Username must be at least 3 characters.",
  errorUsernameSpace: "Username cannot contain spaces.",
  errorUsernameTaken: "This username is already taken.",
  errorUserNotFound: "User not found.",
  errorAccountDeleted: "This account has been deleted and cannot sign in.",
  errorAccountDeleteUnavailable: "Account delete service is not available yet. Deploy the Edge Function first.",
  errorPasswordEmpty: "Password cannot be empty.",
  errorPasswordShort: "Password must be at least 4 characters.",
  errorPasswordMismatch: "Passwords do not match.",
  errorWrongPassword: "Incorrect password.",
  errorEmailNotConfirmed: "Email is not confirmed yet. Verify your email and try again.",
  errorSignupDisabled: "Sign up is currently disabled. Enable Email sign-up in Supabase Authentication settings.",
  errorWeakPassword: "Password is too weak. Please use a stronger password.",
  errorSupabaseConfig: "Supabase config is missing. Fill supabaseUrl and supabaseAnonKey in app.json.",
  errorGenericPrefix: "Error: ",
  errorGeneric: "Something went wrong. Please try again.",
};

// ── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.bg },
  flex: { flex: 1 },

  blobTopRight: {
    position: "absolute", top: -100, right: -80,
    width: 240, height: 240, borderRadius: 999,
    backgroundColor: "#0EA5E91A",
  },
  blobBottomLeft: {
    position: "absolute", bottom: -100, left: -100,
    width: 260, height: 260, borderRadius: 999,
    backgroundColor: "#22C55E12",
  },
  blobMidAccent: {
    position: "absolute", top: "38%", left: -60,
    width: 160, height: 160, borderRadius: 999,
    backgroundColor: "#0EA5E908",
  },

  scroll: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 32,
  },

  // Logo section
  logoSection: { alignItems: "center", marginBottom: 36 },
  logoMark: {
    width: 90, height: 90, borderRadius: 26,
    backgroundColor: "#E8EDF3", borderWidth: 1, borderColor: "#D3DBE4",
    alignItems: "center", justifyContent: "center", gap: 8,
    marginBottom: 16,

    shadowColor: "#0EA5E9", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 16, elevation: 8,
  },
  logoGlyphWrap: { width: 40, height: 32, alignItems: "center", justifyContent: "center" },
  logoLineStack: { alignItems: "center", gap: 3 },
  logoLine: { height: 3, borderRadius: 2, backgroundColor: "#4B5365" },
  appName: { color: PALETTE.textPrimary, fontSize: 26, fontWeight: "800", letterSpacing: 0.3 },
  appSub: { color: PALETTE.textSecondary, fontSize: 13, fontWeight: "600", marginTop: 4 },

  // Card
  card: {
    width: "100%",
    backgroundColor: PALETTE.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: "hidden",

    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },

  // Tab row
  tabRow: {
    flexDirection: "row",
    backgroundColor: PALETTE.inputBg,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: PALETTE.card,
    borderBottomWidth: 2,
    borderBottomColor: PALETTE.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: PALETTE.tabInactiveText,
  },
  tabTextActive: {
    color: PALETTE.accent,
    fontWeight: "800",
  },

  // Form
  formBody: { padding: 20, gap: 4 },
  fieldWrap: { marginBottom: 14 },
  label: {
    color: PALETTE.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PALETTE.inputBg,
    borderWidth: 1,
    borderColor: PALETTE.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  inputFocused: {
    borderColor: PALETTE.inputFocus,
    shadowColor: PALETTE.inputFocus,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  inputIcon: { marginRight: 10 },
  inputText: {
    flex: 1,
    color: PALETTE.textPrimary,
    fontSize: 15,
    fontWeight: "500",
  },
  eyeBtn: { padding: 4, marginLeft: 4 },

  // Error
  errorWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F8717114",
    borderWidth: 1,
    borderColor: "#F8717130",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
  },
  errorText: { color: PALETTE.error, fontSize: 13, fontWeight: "600", flex: 1 },

  // Submit button
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PALETTE.accent,
    borderRadius: 13,
    height: 52,
    marginTop: 4,

    shadowColor: PALETTE.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  submitBtnPressed: { backgroundColor: PALETTE.accentDark, transform: [{ scale: 0.98 }] },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: 0.3 },

  forgotRow: {
    alignItems: "flex-end",
    marginTop: 10,
  },
  forgotLink: {
    color: "#86C7E9",
    fontSize: 12,
    fontWeight: "700",
  },

  // Switch hint
  switchWrap: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 18,
  },
  switchText: { color: PALETTE.textSecondary, fontSize: 13 },
  switchLink: { color: PALETTE.accent, fontSize: 13, fontWeight: "700" },

  // Footer
  footer: {
    color: PALETTE.textMuted,
    fontSize: 11,
    fontWeight: "500",
    marginTop: 28,
    letterSpacing: 0.5,
  },
});

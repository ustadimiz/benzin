import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Alert, FlatList, Linking, Modal, Pressable, SafeAreaView, StyleSheet, Switch, Text, View } from "react-native";
import FuelTrackerScreen from "./src/FuelTrackerScreen";
import PricesScreen from "./src/PricesScreen";
import MaintenanceScreen from "./src/MaintenanceScreen";
import StatisticsScreen from "./src/StatisticsScreen";
import LoginScreen from "./src/LoginScreen";
import { restoreSession, logout as authLogout, softDeleteAccount as authSoftDeleteAccount } from "./src/auth";
import { t as getT, LANGUAGES } from "./src/i18n";
import { clearLocalUserData } from "./src/userData";

const STORAGE_DARK_THEME = "@settings_dark_theme";
const STORAGE_NOTIFICATIONS = "@settings_notifications";
const STORAGE_LANGUAGE = "@settings_language";
const RATE_APP_URL = "https://play.google.com/store/apps/details?id=com.aracdefterim.app";
const STARTUP_AUTH_TIMEOUT_MS = 7000;

function withTimeout(promise, timeoutMs, fallbackValue = null) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      setTimeout(() => resolve(fallbackValue), timeoutMs);
    }),
  ]);
}

export default function App() {
  const [activeTab, setActiveTab] = useState("prices");
  const [showSplash, setShowSplash] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [language, setLanguage] = useState("tr");
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accountActionLoading, setAccountActionLoading] = useState(false);

  const i = getT(language);

  const theme = isDarkTheme
    ? {
        safeBg: "#081B26",
        statusBar: "light",
        tabBg: "#0C202D",
        tabBorder: "#1A3E53",
        tabActiveBg: "#12384D",
        tabLabel: "#9ABFD2",
        tabLabelActive: "#DFF4FF",
        modalBg: "#0F2838",
        modalText: "#F0F9FF",
        modalSubText: "#A7C8DB",
        inputBg: "#0D2230",
        inputBorder: "#1E465D",
        inputText: "#E3F1F9",
        settingsIconBg: "#0D2230CC",
        settingsIconBorder: "#2A4E65",
        settingsIconColor: "#A7C8DB",
      }
    : {
        safeBg: "#EAF3F9",
        statusBar: "dark",
        tabBg: "#FFFFFFE6",
        tabBorder: "#C4D9E7",
        tabActiveBg: "#DCEEF9",
        tabLabel: "#47657A",
        tabLabelActive: "#12384D",
        modalBg: "#F8FCFF",
        modalText: "#163041",
        modalSubText: "#5A7588",
        inputBg: "#FFFFFF",
        inputBorder: "#C7D9E5",
        inputText: "#163041",
        settingsIconBg: "#FFFFFFE6",
        settingsIconBorder: "#C4D9E7",
        settingsIconColor: "#2E607B",
      };

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [rawTheme, rawNotif] = await Promise.all([
          AsyncStorage.getItem(STORAGE_DARK_THEME),
          AsyncStorage.getItem(STORAGE_NOTIFICATIONS),
        ]);
        if (rawTheme !== null) setIsDarkTheme(rawTheme === "1");
        if (rawNotif !== null) setNotificationsEnabled(rawNotif === "1");
        const rawLang = await AsyncStorage.getItem(STORAGE_LANGUAGE);
        if (rawLang) setLanguage(rawLang);

        const savedUser = await withTimeout(restoreSession(), STARTUP_AUTH_TIMEOUT_MS, null);
        setUser(savedUser);
      } catch (_) {}
      setAuthLoading(false);
    })();
  }, []);

  const onToggleTheme = async (value) => {
    setIsDarkTheme(value);
    try {
      await AsyncStorage.setItem(STORAGE_DARK_THEME, value ? "1" : "0");
    } catch (_) {}
  };

  const onToggleNotifications = async (value) => {
    setNotificationsEnabled(value);
    try {
      await AsyncStorage.setItem(STORAGE_NOTIFICATIONS, value ? "1" : "0");
    } catch (_) {}
  };

  const onChangeLanguage = async (code) => {
    setLanguage(code);
    setShowLangDropdown(false);
    try {
      await AsyncStorage.setItem(STORAGE_LANGUAGE, code);
    } catch (_) {}
  };

  const rateApp = async () => {
    try {
      await Linking.openURL(RATE_APP_URL);
    } catch (_) {
      Alert.alert(i.infoTitle, i.errorRateOpen);
    }
  };

  const handleLogout = () => {
    Alert.alert(i.logoutConfirmTitle, i.logoutConfirmMsg, [
      { text: i.cancel, style: "cancel" },
      {
        text: i.logout, style: "destructive", onPress: async () => {
          await authLogout();
          setUser(null);
          setShowSettings(false);
        }
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(i.deleteAccountConfirmTitle, i.deleteAccountConfirmMsg, [
      { text: i.cancel, style: "cancel" },
      {
        text: i.deleteAccount,
        style: "destructive",
        onPress: async () => {
          setAccountActionLoading(true);
          try {
            await authSoftDeleteAccount();
            await clearLocalUserData(user.id);
            setUser(null);
            setShowSettings(false);
            Alert.alert(i.infoTitle, i.deleteAccountSuccess);
          } catch (error) {
            if (error?.message === "ACCOUNT_DELETE_NOT_AVAILABLE") {
              Alert.alert(i.errorTitle, i.deleteAccountUnavailable);
            } else {
              Alert.alert(i.errorTitle, i.deleteAccountError);
            }
          } finally {
            setAccountActionLoading(false);
          }
        },
      },
    ]);
  };

  // Splash screen — shown before auth check completes too
  if (showSplash || authLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.safeBg }]}>
        <StatusBar style="light" />

        <View style={styles.bgBlobTop} />
        <View style={styles.bgBlobBottom} />

        <View style={styles.splashWrap}>
          <View style={styles.splashLogoMark}>
            <View style={styles.logoGlyphWrap}>
              <MaterialCommunityIcons name="car" size={36} color="#434B5C" />
            </View>
            <View style={styles.logoLineStack}>
              <View style={[styles.logoLine, { width: 30 }]} />
              <View style={[styles.logoLine, { width: 24 }]} />
              <View style={[styles.logoLine, { width: 18 }]} />
            </View>
          </View>
          <Text style={styles.splashTitle}>{i.appName}</Text>
          <Text style={styles.splashSubtitle}>{i.appSubtitle}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return <LoginScreen onAuthSuccess={setUser} lang={language} />;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.safeBg }]}>
      <StatusBar style={theme.statusBar} />

      <View style={isDarkTheme ? styles.bgBlobTop : styles.bgBlobTopLight} />
      <View style={isDarkTheme ? styles.bgBlobBottom : styles.bgBlobBottomLight} />

      <View style={styles.topActionRow}>
        <View
          style={[
            styles.appBrand,
            {
              backgroundColor: isDarkTheme ? "#0D2230CC" : "#FFFFFFE6",
              borderColor: isDarkTheme ? "#2A4E65" : "#C4D9E7"
            }
          ]}
        >
          <View style={styles.appLogoMark}>
            <View style={styles.appLogoGlyphWrap}>
              <MaterialCommunityIcons name="car" size={16} color="#434B5C" />
            </View>
            <View style={styles.appLogoLineStack}>
              <View style={[styles.appLogoLine, { width: 12 }]} />
              <View style={[styles.appLogoLine, { width: 10 }]} />
              <View style={[styles.appLogoLine, { width: 8 }]} />
            </View>
          </View>
          <View style={styles.appBrandTextWrap}>
            <Text style={[styles.appBrandName, { color: isDarkTheme ? "#D8ECF8" : "#163041" }]}>Araç Defterim</Text>
            <Text style={[styles.appBrandSub, { color: isDarkTheme ? "#8FB4C8" : "#5C7E92" }]}>Yakıt & Bakım Takibi</Text>
          </View>
          <Pressable
            style={styles.settingsIconBtn}
            onPress={() => {
              setShowSettings(true);
              setShowLangDropdown(false);
            }}
          >
            <MaterialCommunityIcons name="cog-outline" size={22} color={theme.settingsIconColor} />
          </Pressable>
        </View>
      </View>

      <View style={styles.bottomNavWrap}>
        <View style={[styles.tabBar, !isDarkTheme && styles.tabBarLight, { backgroundColor: theme.tabBg, borderColor: theme.tabBorder }]}>
          <Pressable
            onPress={() => setActiveTab("prices")}
            style={[styles.tabBtn, activeTab === "prices" && { backgroundColor: theme.tabActiveBg }]}
          >
            <Text style={styles.tabIcon}>⛽</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.tabLabel, { color: theme.tabLabel }, activeTab === "prices" && { color: theme.tabLabelActive }]}>{i.tabPrices}</Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("tracker")}
            style={[styles.tabBtn, activeTab === "tracker" && { backgroundColor: theme.tabActiveBg }]}
          >
            <Text style={styles.tabIcon}>📊</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.tabLabel, { color: theme.tabLabel }, activeTab === "tracker" && { color: theme.tabLabelActive }]}>{i.tabFuel}</Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("maintenance")}
            style={[styles.tabBtn, activeTab === "maintenance" && { backgroundColor: theme.tabActiveBg }]}
          >
            <Text style={styles.tabIcon}>🔧</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.tabLabel, { color: theme.tabLabel }, activeTab === "maintenance" && { color: theme.tabLabelActive }]}>{i.tabMaintenance}</Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("stats")}
            style={[styles.tabBtn, activeTab === "stats" && { backgroundColor: theme.tabActiveBg }]}
          >
            <Text style={styles.tabIcon}>📈</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.tabLabel, { color: theme.tabLabel }, activeTab === "stats" && { color: theme.tabLabelActive }]}>{i.tabStats}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        {activeTab === "prices" && <PricesScreen themeMode={isDarkTheme ? "dark" : "light"} lang={language} />}
        {activeTab === "tracker" && <FuelTrackerScreen themeMode={isDarkTheme ? "dark" : "light"} lang={language} userId={user.id} />}
        {activeTab === "maintenance" && <MaintenanceScreen themeMode={isDarkTheme ? "dark" : "light"} lang={language} userId={user.id} />}
        {activeTab === "stats" && <StatisticsScreen themeMode={isDarkTheme ? "dark" : "light"} lang={language} />}
      </View>

      <Modal visible={showSettings} transparent animationType="slide" onRequestClose={() => setShowSettings(false)}>
        <View style={styles.settingsOverlay}>
          <View style={[styles.settingsModal, { backgroundColor: theme.modalBg, borderColor: theme.tabBorder }]}>
            <Text style={[styles.settingsTitle, { color: theme.modalText }]}>{i.settings}</Text>

            {/* Kullanıcı bilgisi */}
            <View style={[styles.userInfoRow, { backgroundColor: isDarkTheme ? "#0D2230" : "#EAF3F9", borderColor: theme.tabBorder }]}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{user.displayName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.userInfoText}>
                <Text style={[styles.userDisplayName, { color: theme.modalText }]}>{user.displayName}</Text>
                <Text style={[styles.userUsername, { color: theme.modalSubText }]}>@{user.username}</Text>
              </View>
            </View>

            {/* Dil / Language */}
            <View style={styles.settingsRow}>
              <Text style={[styles.settingsRowLabel, { color: theme.modalText }]}>{i.language}</Text>
              <Pressable
                style={[styles.langDropdownBtn, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}
                onPress={() => setShowLangDropdown((v) => !v)}
              >
                <Text style={[styles.langDropdownBtnText, { color: theme.inputText }]}>
                  {LANGUAGES.find((l) => l.code === language)?.label ?? "Türkçe"}
                </Text>
                <Text style={{ color: theme.modalSubText, fontSize: 11 }}>{showLangDropdown ? "▲" : "▼"}</Text>
              </Pressable>
            </View>
            {showLangDropdown && (
              <View style={[styles.langDropdownList, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                {LANGUAGES.map((lang) => (
                  <Pressable
                    key={lang.code}
                    style={[
                      styles.langDropdownItem,
                      language === lang.code && { backgroundColor: isDarkTheme ? "#12384D" : "#DCEEF9" }
                    ]}
                    onPress={() => onChangeLanguage(lang.code)}
                  >
                    <Text style={[styles.langDropdownItemText, { color: theme.inputText }, language === lang.code && { fontWeight: "800" }]}>
                      {lang.label}
                    </Text>
                    {language === lang.code && (
                      <Text style={{ color: "#1B7FAB", fontSize: 14 }}>✓</Text>
                    )}
                  </Pressable>
                ))}
              </View>
            )}

            <View style={styles.settingsRow}>
              <Text style={[styles.settingsRowLabel, { color: theme.modalText }]}>{i.darkTheme}</Text>
              <Switch value={isDarkTheme} onValueChange={onToggleTheme} />
            </View>

            <View style={styles.settingsRow}>
              <Text style={[styles.settingsRowLabel, { color: theme.modalText }]}>{i.notifications}</Text>
              <Switch value={notificationsEnabled} onValueChange={onToggleNotifications} />
            </View>

            <Pressable style={styles.rateBtn} onPress={rateApp}>
              <Text style={styles.rateBtnText}>{i.rateApp}</Text>
            </Pressable>

            <Pressable style={styles.logoutBtn} onPress={handleLogout}>
              <MaterialCommunityIcons name="logout" size={16} color="#F87171" style={{ marginRight: 6 }} />
              <Text style={styles.logoutBtnText}>{i.logout}</Text>
            </Pressable>

            {user.id !== "guest-local" && (
              <Pressable
                style={[styles.deleteAccountBtn, accountActionLoading && styles.actionBtnDisabled]}
                onPress={handleDeleteAccount}
                disabled={accountActionLoading}
              >
                <MaterialCommunityIcons name="account-remove-outline" size={16} color="#FCA5A5" style={{ marginRight: 6 }} />
                <Text style={styles.deleteAccountBtnText}>{i.deleteAccount}</Text>
              </Pressable>
            )}

            <Pressable
              style={styles.closeSettingsBtn}
              onPress={() => {
                setShowSettings(false);
                setShowLangDropdown(false);
              }}
            >
              <Text style={styles.closeSettingsText}>{i.close}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#081B26" },
  bgBlobTop: {
    position: "absolute", top: -120, right: -90,
    width: 260, height: 260, borderRadius: 999, backgroundColor: "#0EA5E91A"
  },
  bgBlobBottom: {
    position: "absolute", bottom: -120, left: -110,
    width: 280, height: 280, borderRadius: 999, backgroundColor: "#22C55E14"
  },
  bgBlobTopLight: {
    position: "absolute", top: -120, right: -90,
    width: 260, height: 260, borderRadius: 999, backgroundColor: "#8FD1F833"
  },
  bgBlobBottomLight: {
    position: "absolute", bottom: -120, left: -110,
    width: 300, height: 300, borderRadius: 999, backgroundColor: "#7EDCB31F"
  },
  headerCard: {
    backgroundColor: "#0D2432", borderRadius: 22, padding: 14,
    flexDirection: "row", alignItems: "center", borderWidth: 1,
    borderColor: "#1D3E52", marginHorizontal: 16, marginTop: 10
  },
  logoMark: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: "#E8EDF3",
    alignItems: "center", justifyContent: "center", marginRight: 14,
    gap: 4, borderWidth: 1, borderColor: "#D3DBE4"
  },
  logoGlyphWrap: {
    width: 32,
    height: 28,
    alignItems: "center",
    justifyContent: "center"
  },
  logoLineStack: { alignItems: "center", gap: 3 },
  logoLine: { height: 3, borderRadius: 2, backgroundColor: "#4B5365" },
  headerTextWrap: { flex: 1 },
  title: { color: "#EAF7FF", fontSize: 21, fontWeight: "800", marginTop: 2 },
  subtitle: { color: "#8CB8CF", fontSize: 12, marginTop: 2 },

  splashWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24
  },
  splashLogoMark: {
    width: 94,
    height: 94,
    borderRadius: 26,
    backgroundColor: "#E8EDF3",
    borderWidth: 1,
    borderColor: "#D3DBE4",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  splashTitle: {
    marginTop: 20,
    color: "#EAF7FF",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.3
  },
  splashSubtitle: {
    marginTop: 6,
    color: "#93B8CC",
    fontSize: 13,
    fontWeight: "600"
  },

  topActionRow: {
    marginTop: 24,
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center"
  },
  appBrand: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 8
  },
  appLogoMark: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#E8EDF3",
    borderWidth: 1,
    borderColor: "#CFD8E3",
    alignItems: "center",
    justifyContent: "center"
  },
  appLogoGlyphWrap: {
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  appLogoLineStack: { alignItems: "center", gap: 1.5, marginTop: 1 },
  appLogoLine: { height: 1.5, borderRadius: 1, backgroundColor: "#4B5365" },
  appBrandTextWrap: { flex: 1 },
  appBrandName: { fontSize: 13, fontWeight: "800" },
  appBrandSub: { fontSize: 10, fontWeight: "600", marginTop: 1 },
  settingsIconBtn: {
    marginLeft: 8,
    paddingLeft: 4,
    paddingVertical: 8,
  },

  bottomNavWrap: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 8,
    backgroundColor: "transparent"
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#0C202D",
    borderRadius: 18,
    padding: 5,
    borderWidth: 1,
    borderColor: "#1A3E53"
  },
  tabBarLight: {
    shadowColor: "#7AA9C4",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 13,
    minWidth: 0,
  },
  tabIcon: { fontSize: 13, lineHeight: 14 },
  tabLabel: { fontWeight: "700", fontSize: 10, maxWidth: "100%" },

  content: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },

  settingsOverlay: { flex: 1, backgroundColor: "#00000088", justifyContent: "flex-end" },
  settingsModal: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    padding: 16
  },
  settingsTitle: { fontSize: 18, fontWeight: "800", marginBottom: 10 },
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  settingsRowLabel: { fontSize: 14, fontWeight: "700" },
  rateBtn: {
    backgroundColor: "#0EA5E9",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10
  },
  rateBtnText: { color: "#F2FAFF", fontWeight: "800", fontSize: 13 },
  closeSettingsBtn: {
    backgroundColor: "#355568",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  closeSettingsText: { color: "#F2FAFF", fontWeight: "800", fontSize: 13 },

  langDropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  langDropdownBtnText: { fontSize: 13, fontWeight: "700" },
  langDropdownList: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  langDropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  langDropdownItemText: { fontSize: 14, fontWeight: "600" },

  // User info & logout
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0EA5E9",
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  userInfoText: { flex: 1 },
  userDisplayName: { fontSize: 14, fontWeight: "700" },
  userUsername: { fontSize: 12, fontWeight: "500", marginTop: 1 },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8717118",
    borderWidth: 1,
    borderColor: "#F8717135",
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  logoutBtnText: { color: "#F87171", fontWeight: "800", fontSize: 13 },
  deleteAccountBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7F1D1D22",
    borderWidth: 1,
    borderColor: "#FCA5A544",
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  deleteAccountBtnText: { color: "#FCA5A5", fontWeight: "800", fontSize: 13 },
  actionBtnDisabled: { opacity: 0.6 },
});



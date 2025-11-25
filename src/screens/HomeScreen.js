import React, { useState, useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  StyleSheet,
  Text,
  Image,
  Animated,
  Easing,
} from "react-native";
import {
  Card,
  Title,
  Button,
  ActivityIndicator,
  Appbar,
  Menu,
  Divider,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../utils/api";
import { auth } from "../utils/firebase";
import { signOut } from "firebase/auth";
import { useAppTheme } from "../context/AppThemeContext";

const FLAGS = {
  USD: require("../../assets/usd.png"),
  EUR: require("../../assets/eur.png"),
  GBP: require("../../assets/gbp.png"),
  CHF: require("../../assets/chf.png"),
  PLN: require("../../assets/pl.png"),
};

const ACCENT = "#00d4ff";
const SUCCESS = "#00ff88";
const DANGER = "#ff3366";
const DARK_BG = "#0f172a";
const LIGHT_BG = "#f8fbff";
const DARK_CARD = "#1e293b";
const LIGHT_CARD = "#ffffff";

export default function HomeScreen({ navigation }) {
  const { isDark, toggleTheme } = useAppTheme();

  const [data, setData] = useState(null);
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("");
  const [modalCurrency, setModalCurrency] = useState("");
  const [amount, setAmount] = useState("");

  const currencies = ["USD", "EUR", "GBP", "CHF"];

  const spinValue = useRef(new Animated.Value(0)).current;
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  useEffect(() => {
    if (refreshing) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.stopAnimation();
      spinValue.setValue(0);
    }
  }, [refreshing]);

  const loadData = async () => {
    try {
      const [userRes, ratesRes] = await Promise.all([
        api.get("/user"),
        api.get("/rates"),
      ]);
      setData(userRes.data);
      setRates(ratesRes.data || {});
    } catch (e) {
      setData({
        balance: { PLN: 10000, USD: 0, EUR: 0, GBP: 0, CHF: 0 },
        transactions: [],
      });
      setRates({ USD: 4.0, EUR: 4.3, GBP: 5.0, CHF: 4.5 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleTransaction = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return Alert.alert("Błąd", "Wpisz poprawną kwotę");
    try {
      await api.post("/transaction", {
        type: modalType,
        currency: modalCurrency,
        amount: num,
      });
      Alert.alert("Sukces!", "Transakcja wykonana!");
      setModalVisible(false);
      setAmount("");
      loadData();
    } catch (e) {
      Alert.alert("Błąd", e.response?.data?.error || "Spróbuj ponownie");
    }
  };

  const handleDeposit = async () => {
    const num = parseFloat(amount);
    if (num < 1000) return Alert.alert("Błąd", "Minimalna wpłata: 1000 PLN");
    try {
      await api.post("/deposit", { amount: num });
      Alert.alert("Sukces!", `Zasilono konto o ${num} PLN!`);
      setModalVisible(false);
      setAmount("");
      loadData();
    } catch (e) {
      Alert.alert("Błąd", e.response?.data?.error || "Błąd wpłaty");
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: isDark ? DARK_BG : LIGHT_BG }}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={[styles.loadingText, { color: ACCENT }]}>
            Ładowanie Kantor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? DARK_BG : LIGHT_BG }}>
      <Appbar.Header
        style={{
          backgroundColor: isDark ? DARK_BG : ACCENT,
          height: 56,
          justifyContent: "center",
          elevation: 0,
          borderBottomWidth: 1,
          borderBottomColor: ACCENT + "33",
        }}
      >
        <Appbar.Content title="Kantor" titleStyle={styles.appbarTitle} />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action
              icon="dots-vertical"
              color="white"
              onPress={() => setMenuVisible((prev) => !prev)}
              size={28}
            />
          }
          contentStyle={{
            backgroundColor: isDark ? DARK_CARD : LIGHT_CARD,
            borderRadius: 16,
            marginTop: 8,
            borderWidth: 1,
            borderColor: ACCENT,
          }}
        >
          <Menu.Item
            onPress={() => {
              toggleTheme();
              setMenuVisible(false);
            }}
            title={isDark ? "Jasny motyw" : "Ciemny motyw"}
            leadingIcon={isDark ? "weather-sunny" : "weather-night"}
            titleStyle={{ color: ACCENT, fontWeight: "bold" }}
          />
          <Divider style={{ backgroundColor: ACCENT + "44" }} />
          <Menu.Item
            onPress={() => {
              setModalType("deposit");
              setModalCurrency("PLN");
              setModalVisible(true);
              setMenuVisible(false);
            }}
            title="Zasil konto"
            leadingIcon="bank-transfer-in"
            titleStyle={{ color: SUCCESS }}
          />
          <Divider style={{ backgroundColor: ACCENT + "44" }} />
          <Menu.Item
            onPress={() => {
              signOut(auth);
              setMenuVisible(false);
            }}
            title="Wyloguj"
            leadingIcon="logout"
            titleStyle={{ color: DANGER, fontWeight: "bold" }}
          />
        </Menu>
      </Appbar.Header>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[ACCENT]}
            tintColor={ACCENT}
            progressBackgroundColor={isDark ? DARK_CARD : LIGHT_CARD}
            title={
              refreshing ? "Odświeżanie kursów..." : "Pociągnij, by odświeżyć"
            }
            titleColor={isDark ? "#94a3b8" : "#64748b"}
          />
        }
      >
        {refreshing && (
          <Animated.View
            style={{
              alignItems: "center",
              paddingVertical: 16,
              transform: [{ rotate: spin }],
            }}
          >
            <Image
              source={require("../../assets/refresh.png")}
              style={{ width: 36, height: 36, tintColor: ACCENT }}
            />
          </Animated.View>
        )}
        <Card
          style={[
            styles.card,
            { backgroundColor: isDark ? DARK_CARD : LIGHT_CARD },
          ]}
        >
          <Card.Content>
            <Title style={styles.sectionTitle}>Twój portfel</Title>
            {Object.entries(data.balance || {}).map(([curr, amt]) => (
              <View key={curr} style={styles.balanceItem}>
                <View style={styles.currencyRow}>
                  <Image
                    source={FLAGS[curr] || FLAGS.PLN}
                    style={styles.flagLarge}
                  />
                  <Text style={[styles.currencyText, { color: ACCENT }]}>
                    {curr}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.balanceAmount,
                    { color: isDark ? SUCCESS : ACCENT },
                  ]}
                >
                  {amt.toLocaleString("pl-PL", { minimumFractionDigits: 2 })}{" "}
                  {curr}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>
        <Card
          style={[
            styles.card,
            { backgroundColor: isDark ? DARK_CARD : LIGHT_CARD },
          ]}
        >
          <Card.Content>
            <Title style={styles.sectionTitle}>Aktualne kursy</Title>
            {currencies.map((curr) => (
              <View key={curr} style={styles.rateItem}>
                <View style={styles.currencyRow}>
                  <Image source={FLAGS[curr]} style={styles.flagMedium} />
                  <Text
                    style={[
                      styles.rateLabel,
                      { color: isDark ? "#cbd5e1" : "#475569" },
                    ]}
                  >
                    1 {curr}
                  </Text>
                </View>
                <Text style={[styles.rateValue, { color: ACCENT }]}>
                  {(rates.rates[curr] || 0).toFixed(4)} PLN
                </Text>
              </View>
            ))}
            <View style={{ alignItems: "center", marginTop: 12 }}>
              <Text style={{ color: "#888", fontSize: 12 }}>
                Tabela z: {rates.date || "brak danych"}
              </Text>
              {new Date().getHours() < 12}
            </View>
          </Card.Content>
        </Card>
        <Card
          style={[
            styles.card,
            { backgroundColor: isDark ? DARK_CARD : LIGHT_CARD },
          ]}
        >
          <Card.Content>
            <Title style={styles.sectionTitle}>Szybka transakcja</Title>
            {currencies.map((curr) => (
              <View key={curr} style={styles.transactionItem}>
                <View style={styles.currencyRow}>
                  <Image source={FLAGS[curr]} style={styles.flagMedium} />
                  <Text style={[styles.currencyText, { color: ACCENT }]}>
                    {curr}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Button
                    mode="contained"
                    onPress={() => {
                      setModalType("buy");
                      setModalCurrency(curr);
                      setModalVisible(true);
                    }}
                    style={{ backgroundColor: SUCCESS }}
                    labelStyle={{ color: "#000", fontWeight: "bold" }}
                  >
                    KUP
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => {
                      setModalType("sell");
                      setModalCurrency(curr);
                      setModalVisible(true);
                    }}
                    style={{ backgroundColor: DANGER }}
                    labelStyle={{ color: "#fff", fontWeight: "bold" }}
                  >
                    SPRZEDAJ
                  </Button>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
        <Card
          style={[
            styles.card,
            { backgroundColor: isDark ? DARK_CARD : LIGHT_CARD },
          ]}
        >
          <Card.Content>
            <Title style={styles.sectionTitle}>Ostatnie operacje</Title>
            {[...(data.transactions || [])]
              .reverse()
              .slice(0, 7)
              .map((t, i) => (
                <View key={i} style={styles.historyItem}>
                  <View>
                    <Text
                      style={[
                        styles.historyDate,
                        { color: isDark ? "#94a3b8" : "#64748b" },
                      ]}
                    >
                      {new Date(t.timestamp).toLocaleString("pl-PL", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    <Text
                      style={[
                        styles.historyDesc,
                        { color: isDark ? "#e2e8f0" : "#1e293b" },
                      ]}
                    >
                      {t.type === "deposit"
                        ? "Zasilenie"
                        : t.type === "buy"
                        ? "Kupno"
                        : "Sprzedaż"}{" "}
                      {t.amount} {t.currency}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.historyAmount,
                      {
                        color:
                          t.type === "buy"
                            ? SUCCESS
                            : t.type === "sell"
                            ? DANGER
                            : ACCENT,
                      },
                    ]}
                  >
                    {t.type === "buy" ? "+" : t.type === "sell" ? "-" : "+"}
                    {(
                      t.pln || t.amount * (t.rate || rates[t.currency] || 1)
                    ).toFixed(2)}{" "}
                    PLN
                  </Text>
                </View>
              ))}
          </Card.Content>
        </Card>
      </ScrollView>
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <SafeAreaView
          style={{ flex: 1, backgroundColor: isDark ? DARK_BG : LIGHT_BG }}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: isDark ? DARK_CARD : LIGHT_CARD,
                  borderColor: ACCENT,
                },
              ]}
            >
              <Text style={[styles.modalTitle, { color: ACCENT }]}>
                {modalType === "deposit"
                  ? "Zasil konto"
                  : modalType === "buy"
                  ? `Kup ${modalCurrency}`
                  : `Sprzedaj ${modalCurrency}`}
              </Text>
              <Image
                source={FLAGS[modalCurrency] || FLAGS.PLN}
                style={styles.modalFlag}
              />
              <TextInput
                placeholder={`Kwota w ${
                  modalCurrency === "PLN" ? "PLN (min. 1000)" : modalCurrency
                }`}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: isDark ? "#334155" : "#f1f5f9",
                    color: isDark ? "#fff" : "#000",
                  },
                ]}
                placeholderTextColor={isDark ? "#94a3b8" : "#64748b"}
              />
              <View style={styles.modalActions}>
                <Button
                  mode="contained"
                  onPress={
                    modalType === "deposit" ? handleDeposit : handleTransaction
                  }
                  style={{ backgroundColor: ACCENT }}
                >
                  Potwierdź
                </Button>
                <Button
                  onPress={() => {
                    setModalVisible(false);
                    setAmount("");
                  }}
                  mode="outlined"
                >
                  Anuluj
                </Button>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  appbarTitle: { color: "white", fontSize: 26, fontWeight: "bold" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 20, fontSize: 18, fontWeight: "bold" },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: ACCENT + "22",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: ACCENT,
    textAlign: "center",
    marginBottom: 16,
  },
  balanceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: ACCENT + "15",
  },
  currencyRow: { flexDirection: "row", alignItems: "center" },
  flagLarge: { width: 42, height: 42, borderRadius: 21, marginRight: 14 },
  flagMedium: { width: 32, height: 32, borderRadius: 16, marginRight: 12 },
  currencyText: { fontSize: 20, fontWeight: "bold" },
  balanceAmount: { fontSize: 20, fontWeight: "bold" },
  rateItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  rateLabel: { fontSize: 17 },
  rateValue: { fontSize: 22, fontWeight: "bold" },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderColor: ACCENT + "15",
  },
  historyDate: { fontSize: 12, opacity: 0.8 },
  historyDesc: { fontSize: 15, fontWeight: "600" },
  historyAmount: { fontSize: 15, fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 28,
    padding: 30,
    alignItems: "center",
    borderWidth: 2,
    elevation: 10,
  },
  modalTitle: { fontSize: 26, fontWeight: "bold", marginBottom: 20 },
  modalFlag: { width: 80, height: 80, borderRadius: 40, marginBottom: 20 },
  modalInput: {
    width: "100%",
    padding: 18,
    borderRadius: 16,
    fontSize: 20,
    textAlign: "center",
    marginBottom: 30,
  },
  modalActions: { flexDirection: "row", gap: 16 },
});

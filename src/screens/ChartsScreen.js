import React, { useState, useCallback, useRef } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Text,
  Image,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { LineChart, PieChart } from "react-native-chart-kit";
import { Card, Title, Appbar, Menu, Divider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import api from "../utils/api";
import { auth } from "../utils/firebase";
import { signOut } from "firebase/auth";
import { useAppTheme } from "../context/AppThemeContext";

const screenWidth = Dimensions.get("window").width;

const FLAGS = {
  USD: require("../../assets/usd.png"),
  EUR: require("../../assets/eur.png"),
  GBP: require("../../assets/gbp.png"),
  CHF: require("../../assets/chf.png"),
  PLN: require("../../assets/pl.png"),
};

const CURRENCY_COLORS = {
  PLN: "#00d4ff",
  USD: "#ff6b6b",
  EUR: "#4ecdc4",
  GBP: "#ffe66d",
  CHF: "#95e1d3",
};

const ACCENT = "#00d4ff";
const DANGER = "#ff3366";
const DARK_BG = "#0f172a";
const LIGHT_BG = "#f8fbff";
const DARK_CARD = "#1e293b";
const LIGHT_CARD = "#ffffff";

export default function ChartsScreen({ navigation }) {
  const { isDark, toggleTheme } = useAppTheme();

  const [pieData, setPieData] = useState([]);
  const [historyData, setHistoryData] = useState({});
  const [currentRates, setCurrentRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const currencies = ["USD", "EUR", "GBP", "CHF"];

  const spinValue = useRef(new Animated.Value(0)).current;
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  React.useEffect(() => {
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
      setLoading(true);
      const [archiveRes, ratesRes, userRes] = await Promise.all([
        api.get("/rates/archive"),
        api.get("/rates"),
        api.get("/user"),
      ]);

      const archive = archiveRes.data;
      const rates = ratesRes.data.rates || {};
      setCurrentRates(rates);
      const balance = userRes.data.balance || { PLN: 10000 };

      const totalPLNValue = Object.entries(balance).reduce(
        (sum, [curr, amt]) => {
          if (curr === "PLN") return sum + amt;
          return sum + amt * (rates[curr] || 4.0);
        },
        0
      );

      const pie = Object.entries(balance)
        .filter(([_, amt]) => amt > 0)
        .map(([curr, amt]) => {
          const rate = curr === "PLN" ? 1 : rates[curr] || 4.0;
          const valueInPLN = amt * rate;
          const percentage =
            totalPLNValue > 0 ? (valueInPLN / totalPLNValue) * 100 : 0;

          return {
            name: curr,
            amount: Number(amt.toFixed(2)),
            valueInPLN: valueInPLN,
            percentage: percentage.toFixed(1),
            color: CURRENCY_COLORS[curr] || "#888",
          };
        });

      setPieData(
        pie.length > 0
          ? pie
          : [
              {
                name: "PLN",
                amount: 10000.0,
                valueInPLN: 10000,
                percentage: "100.0",
                color: "#00d4ff",
              },
            ]
      );

      const history = {};
      currencies.forEach((curr) => {
        const data = Object.entries(archive)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-14)
          .map(([_, item]) =>
            parseFloat((item.rates?.[curr] || rates[curr] || 4.0).toFixed(4))
          );
        history[curr] =
          data.length > 0 ? data : Array(14).fill(rates[curr] || 4.0);
      });
      setHistoryData(history);
    } catch (e) {
      console.warn("Błąd wykresów:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: isDark ? DARK_BG : LIGHT_BG }}
      >
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={{ marginTop: 16, color: ACCENT, fontSize: 16 }}>
            Ładowanie wykresów...
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
        <Appbar.Content
          title="Wykresy"
          titleStyle={{ color: "white", fontSize: 26, fontWeight: "bold" }}
        />
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
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: 120,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[ACCENT]}
            tintColor={ACCENT}
            progressBackgroundColor={isDark ? DARK_CARD : LIGHT_CARD}
            title={
              refreshing ? "Odświeżanie wykresów..." : "Pociągnij, by odświeżyć"
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
          style={{
            marginVertical: 7,
            borderRadius: 20,
            backgroundColor: isDark ? DARK_CARD : LIGHT_CARD,
            elevation: 10,
            borderWidth: 1,
            borderColor: ACCENT + "22",
          }}
        >
          <Card.Content style={{ padding: 16, alignItems: "center" }}>
            <Title
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: ACCENT,
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Struktura portfela
            </Title>
            <Text
              style={{
                textAlign: "center",
                color: "#888",
                marginBottom: 20,
                fontSize: 14,
              }}
            >
              Wartość w PLN
            </Text>

            <View style={{ alignItems: "center", width: "100%" }}>
              <PieChart
                data={pieData.map((p) => ({
                  name: p.name,
                  amount: p.valueInPLN,
                  color: p.color,
                }))}
                width={screenWidth - 100}
                height={280}
                chartConfig={{ color: () => ACCENT }}
                accessor="amount"
                backgroundColor="transparent"
                absolute
                paddingLeft="75"
                hasLegend={false}
                style={{ borderRadius: 16 }}
              />
            </View>

            <View style={{ marginTop: 24, width: "100%" }}>
              {pieData.map((item, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor: isDark ? "#1e293b99" : "#f1f5f999",
                    borderRadius: 16,
                    marginBottom: 10,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: item.color,
                        marginRight: 14,
                      }}
                    />
                    {FLAGS[item.name] && (
                      <Image
                        source={FLAGS[item.name]}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          marginRight: 12,
                        }}
                      />
                    )}
                    <Text
                      style={{
                        color: isDark ? "#e2e8f0" : "#1e293b",
                        fontSize: 18,
                        fontWeight: "bold",
                      }}
                    >
                      {item.amount.toLocaleString("pl-PL", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {item.name}
                    </Text>
                  </View>
                  <Text
                    style={{ color: ACCENT, fontSize: 19, fontWeight: "bold" }}
                  >
                    {item.percentage}%
                  </Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {currencies.map((curr) => (
          <Card
            key={curr}
            style={{
              marginVertical: 8,
              borderRadius: 20,
              backgroundColor: isDark ? DARK_CARD : LIGHT_CARD,
              elevation: 10,
              borderWidth: 1,
              borderColor: ACCENT + "22",
            }}
          >
            <Card.Content style={{ padding: 16 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <Image
                  source={FLAGS[curr]}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    marginRight: 12,
                  }}
                />
                <Title
                  style={{ fontSize: 20, fontWeight: "bold", color: ACCENT }}
                >
                  Kurs {curr}/PLN – 14 dni
                </Title>
              </View>
              <LineChart
                data={{
                  datasets: [
                    { data: historyData[curr] || Array(14).fill(4.0) },
                  ],
                }}
                width={screenWidth - 80}
                height={220}
                yAxisSuffix=" zł"
                chartConfig={{
                  backgroundColor: "transparent",
                  backgroundGradientFrom: isDark ? DARK_CARD : LIGHT_CARD,
                  backgroundGradientTo: isDark ? DARK_CARD : LIGHT_CARD,
                  decimalPlaces: 3,
                  color: () => CURRENCY_COLORS[curr],
                  labelColor: () => (isDark ? "#cbd5e1" : "#475569"),
                  propsForDots: {
                    r: "5",
                    strokeWidth: "3",
                    stroke: CURRENCY_COLORS[curr],
                  },
                }}
                bezier
                style={{ borderRadius: 16, alignSelf: "center" }}
              />
            </Card.Content>
          </Card>
        ))}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

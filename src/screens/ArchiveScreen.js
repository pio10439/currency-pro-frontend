import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
} from "react-native";
import {
  Card,
  Title,
  Text,
  Appbar,
  Menu,
  Divider,
  useTheme,
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
};

const ACCENT = "#00d4ff";
const SUCCESS = "#00ff88";
const DANGER = "#ff3366";
const DARK_BG = "#0f172a";
const LIGHT_BG = "#f8fbff";
const DARK_CARD = "#1e293b";
const LIGHT_CARD = "#ffffff";

export default function ArchiveScreen({ navigation }) {
  const { isDark, toggleTheme } = useAppTheme();
  const { colors } = useTheme();

  const [archive, setArchive] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const currencies = ["USD", "EUR", "GBP", "CHF"];

  const loadArchive = async () => {
    try {
      const res = await api.get("/rates/archive");
      setArchive(res.data);
    } catch (e) {
      console.log("Archiwum puste lub błąd:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadArchive();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadArchive();
  };

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
            Ładowanie archiwum...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const sortedDates = Object.keys(archive).sort((a, b) => b.localeCompare(a));

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
          title="Archiwum kursów"
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
          />
        }
      >
        <Text
          style={{
            textAlign: "center",
            color: "#888",
            marginBottom: 20,
            fontSize: 14,
          }}
        >
          Ostatnie 30 dni
        </Text>

        {sortedDates.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Text style={{ color: "#888", fontSize: 16 }}>Archiwum puste</Text>
            <Text style={{ color: "#666", fontSize: 14, marginTop: 8 }}>
              Poczekaj na aktualizację kursów
            </Text>
          </View>
        ) : (
          sortedDates.map((date) => {
            const item = archive[date];
            const itemDate = item.date || date;

            return (
              <Card
                key={date}
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
                  <View style={{ alignItems: "center", marginBottom: 12 }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "bold",
                        color: ACCENT,
                      }}
                    >
                      {new Date(itemDate).toLocaleDateString("pl-PL", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </Text>
                    <Text style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
                      {new Date(itemDate).toLocaleDateString() ===
                      new Date().toLocaleDateString()
                        ? "Dzisiaj"
                        : new Date(itemDate).toLocaleDateString("pl-PL", {
                            weekday: "short",
                          })}
                    </Text>
                  </View>

                  {currencies.map((curr, index) => (
                    <View
                      key={curr}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingVertical: 12,
                        borderBottomWidth:
                          index === currencies.length - 1 ? 0 : 1,
                        borderBottomColor: ACCENT + "15",
                      }}
                    >
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Image
                          source={FLAGS[curr]}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            marginRight: 14,
                          }}
                        />
                        <Text
                          style={{
                            fontSize: 18,
                            color: isDark ? "#e2e8f0" : "#1e293b",
                          }}
                        >
                          1 {curr}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: "bold",
                          color: SUCCESS,
                        }}
                      >
                        {(item.rates?.[curr] || 0).toFixed(4)} PLN
                      </Text>
                    </View>
                  ))}
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

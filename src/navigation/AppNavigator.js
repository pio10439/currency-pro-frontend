import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthScreen from "../screens/AuthScreen";
import HomeScreen from "../screens/HomeScreen";
import ArchiveScreen from "../screens/ArchiveScreen";
import ChartsScreen from "../screens/ChartsScreen";
import { auth } from "../utils/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { IconButton } from "react-native-paper";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Kantor"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <IconButton icon="bank" color={color} />,
        }}
      />
      <Tab.Screen
        name="Archiwum"
        component={ArchiveScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <IconButton icon="history" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Wykresy"
        component={ChartsScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <IconButton icon="chart-line" color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

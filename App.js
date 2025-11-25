import React, { useEffect } from "react";
import { Provider as PaperProvider } from "react-native-paper";
import AppNavigator from "./src/navigation/AppNavigator";
import { auth } from "./src/utils/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { registerForPushNotifications } from "./src/utils/notifications";
import { AppThemeProvider, useAppTheme } from "./src/context/AppThemeContext";

const Root = () => {
  const { paper } = useAppTheme();

  return (
    <PaperProvider theme={paper}>
      <AppNavigator />
    </PaperProvider>
  );
};

export default function App() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) registerForPushNotifications();
    });
    return unsubscribe;
  }, []);

  return (
    <AppThemeProvider>
      <Root />
    </AppThemeProvider>
  );
}

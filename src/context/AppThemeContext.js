import React, { createContext, useContext, useState, useMemo } from "react";
import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import {
  DefaultTheme as NavigationLightTheme,
  DarkTheme as NavigationDarkTheme,
} from "@react-navigation/native";

const AppThemeContext = createContext(undefined);

export const useAppTheme = () => {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error("useAppTheme musi być używany w AppThemeProvider");
  }
  return context;
};

export const AppThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const theme = useMemo(() => {
    const paperLight = {
      ...MD3LightTheme,
      colors: {
        ...MD3LightTheme.colors,
        primary: "#00d4ff",
        secondary: "#00ff88",
        background: "#f8fbff",
        surface: "#ffffff",
      },
    };

    const paperDark = {
      ...MD3DarkTheme,
      colors: {
        ...MD3DarkTheme.colors,
        primary: "#00d4ff",
        secondary: "#00ff88",
        background: "#0f172a",
        surface: "#1e293b",
      },
    };

    return {
      isDark,
      toggleTheme,
      paper: isDark ? paperDark : paperLight,
      navigation: isDark ? NavigationDarkTheme : NavigationLightTheme,
    };
  }, [isDark]);

  return (
    <AppThemeContext.Provider value={theme}>
      {children}
    </AppThemeContext.Provider>
  );
};

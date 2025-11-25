import React, { useState } from "react";
import { View, Alert, KeyboardAvoidingView, Platform } from "react-native";
import {
  TextInput,
  Button,
  Title,
  useTheme,
  ActivityIndicator,
} from "react-native-paper";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../utils/firebase";

export default function AuthScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Błąd", "Wypełnij wszystkie pola");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert("Sukces!", "Konto utworzone! Witaj w Kantor Pro");
      }
    } catch (e) {
      console.log("BŁĄD FIREBASE:", e.code, e.message);

      let message = "Nieznany błąd. Spróbuj ponownie.";
      if (e.code === "auth/invalid-credential") {
        message = "Nieprawidłowy email lub hasło. Spróbuj ponownie.";
      } else if (e.code === "auth/user-not-found") {
        message = "Nie znaleziono konta o podanym adresie email.";
      } else if (e.code === "auth/wrong-password") {
        message = "Błędne hasło. Spróbuj ponownie.";
      } else if (e.code === "auth/invalid-email") {
        message = "Nieprawidłowy adres email.";
      } else if (e.code === "auth/email-already-in-use") {
        message = "Ten email jest już zajęty. Zaloguj się.";
      } else if (e.code === "auth/weak-password") {
        message = "Hasło musi mieć minimum 6 znaków.";
      } else if (e.code === "auth/too-many-requests") {
        message = "Za dużo prób. Poczekaj chwilę i spróbuj ponownie.";
      } else if (e.code === "auth/network-request-failed") {
        message = "Brak połączenia z internetem.";
      } else {
        message = "Błąd logowania. Spróbuj ponownie.";
      }

      Alert.alert("Błąd", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          padding: 30,
          backgroundColor: colors.background,
        }}
      >
        <Title
          style={{
            textAlign: "center",
            marginBottom: 40,
            fontSize: 28,
            fontWeight: "bold",
            color: colors.primary,
          }}
        >
          {isLogin ? "Witaj ponownie!" : "Dołącz do Nas!"}
        </Title>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          style={{ marginBottom: 15 }}
          disabled={loading}
        />

        <TextInput
          label="Hasło"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          mode="outlined"
          style={{ marginBottom: 30 }}
          disabled={loading}
        />

        <Button
          mode="contained"
          onPress={handleAuth}
          loading={loading}
          disabled={loading}
          contentStyle={{ paddingVertical: 10 }}
          labelStyle={{ fontSize: 16 }}
        >
          {loading ? "Trwa..." : isLogin ? "Zaloguj się" : "Zarejestruj się"}
        </Button>

        <Button
          mode="text"
          onPress={() => setIsLogin(!isLogin)}
          disabled={loading}
          style={{ marginTop: 20 }}
        >
          {isLogin
            ? "Nie masz konta? Zarejestruj się"
            : "Masz konto? Zaloguj się"}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

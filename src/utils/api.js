import axios from "axios";
import { auth } from "./firebase";
import Constants from "expo-constants";

const api = axios.create({
  baseURL:
    Constants.expoConfig?.extra?.backendUrl ||
    process.env.EXPO_PUBLIC_BACKEND_URL,
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

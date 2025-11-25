import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import api from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications() {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;

    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig.extra.projectId,
      })
    ).data;

    await api.post("/save-token", { token });
  } catch (e) {
    console.warn("Push registration error", e);
  }
}

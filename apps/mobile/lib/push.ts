import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import { api } from './api';
import { navigateFromNotification } from './navigation';
import { invalidateByNotificationType } from './query-client';

/**
 * Remote push requires a development/production build with expo-notifications installed.
 * Expo Go (SDK 53+) does not support push — importing that package crashes LogBox.
 */
export async function registerPushToken() {
  if (Platform.OS === 'web' || isRunningInExpoGo()) return;

  try {
    // @ts-ignore optional dependency, only present in dev/prod builds (not Expo Go)
    const Notifications = await import('expo-notifications');
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await api.post('/notifications/register-device', { pushToken: token });

    Notifications.addNotificationReceivedListener((notification: {
      request: { content: { data?: Record<string, unknown> } };
    }) => {
      const type = (notification.request.content.data?.type as string) ?? '';
      invalidateByNotificationType(type).catch(() => {});
    });

    Notifications.addNotificationResponseReceivedListener((response: {
      notification: { request: { content: { data?: Record<string, unknown> } } };
    }) => {
      const data = response.notification.request.content.data;
      const type = (data?.type as string) ?? '';
      invalidateByNotificationType(type).catch(() => {});
      try {
        const { router } = require('expo-router');
        navigateFromNotification(router, type, data);
      } catch {
        // router not ready
      }
    });
  } catch {
    // expo-notifications not installed (Expo Go) or permissions denied
  }
}

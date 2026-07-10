import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '../stores/auth';
import { api } from '../lib/api';
import { registerPushToken } from '../lib/push';
import { homeRoute } from '../lib/routes';
import { getPlatformConfig, clearPlatformConfigCache } from '../lib/platform-config';
import { SplashScreen } from '../components/layout/SplashScreen';
import { queryClient } from '../lib/query-client';
import { useAppForegroundSync } from '../lib/realtime';

function AppSync({ children }: { children: React.ReactNode }) {
  useAppForegroundSync();
  return <>{children}</>;
}

export default function RootLayout() {
  const { user, isLoading, loadAuth, patchUser } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) router.replace('/(auth)/login');
    else if (user && inAuth) router.replace(homeRoute(user.role) as never);
  }, [user, isLoading, segments]);

  useEffect(() => {
    if (!user || isLoading) return;
    const onKvkk = segments[0] === 'kvkk';
    if (onKvkk) return;
    api.get<{ hasConsent: boolean }>('/kvkk/consent-status')
      .then((c) => { if (!c.hasConsent) router.replace('/kvkk'); })
      .catch(() => {});
  }, [user, isLoading, segments]);

  useEffect(() => {
    if (!user || isLoading) return;
    registerPushToken().catch(() => {});
  }, [user?.id, isLoading]);

  useEffect(() => {
    if (!user || isLoading) return;
    clearPlatformConfigCache();
    getPlatformConfig(true)
      .then((cfg) => patchUser({ requireEmployeeLocation: cfg.requireEmployeeLocation }))
      .catch(() => {});
  }, [user?.id, isLoading, patchUser]);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SplashScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AppSync>
          <StatusBar style="dark" />
          <View style={styles.root}>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(reseller)" />
              <Stack.Screen name="(marketer)" />
              <Stack.Screen name="(admin)" />
              <Stack.Screen name="(company)" />
              <Stack.Screen name="kvkk" options={{ presentation: 'modal' }} />
            </Stack>
          </View>
        </AppSync>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
});

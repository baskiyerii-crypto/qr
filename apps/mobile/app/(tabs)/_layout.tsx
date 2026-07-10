import { Stack } from 'expo-router';
import { AppShell } from '../../components/layout/AppShell';

export default function TabLayout() {
  return (
    <AppShell>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'slide_from_right',
        }}
      />
    </AppShell>
  );
}

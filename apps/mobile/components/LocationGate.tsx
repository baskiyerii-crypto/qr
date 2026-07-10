import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Linking, AppState } from 'react-native';
import * as Location from 'expo-location';
import { Button } from '../components/ui';
import { theme } from '../lib/theme';

interface LocationGateProps {
  children: React.ReactNode;
  required?: boolean;
}

export function LocationGate({ children, required = true }: LocationGateProps) {
  const [enabled, setEnabled] = useState<boolean | null>(required ? null : true);

  const check = async () => {
    if (!required) {
      setEnabled(true);
      return;
    }
    const services = await Location.hasServicesEnabledAsync();
    const { status } = await Location.getForegroundPermissionsAsync();
    setEnabled(services && status === 'granted');
  };

  useEffect(() => {
    check();
    if (!required) return;
    const sub = AppState.addEventListener('change', () => check());
    return () => sub.remove();
  }, [required]);

  if (enabled === null) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Konum kontrol ediliyor...</Text>
      </View>
    );
  }

  if (!enabled) {
    return (
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>📍</Text>
        </View>
        <Text style={styles.title}>Konum Gerekli</Text>
        <Text style={styles.desc}>
          Giriş ve çıkış işlemleri için konum servisinizin açık olması zorunludur. Konum yalnızca QR okutma anında kullanılır.
        </Text>
        <Button title="Ayarlara Git" onPress={() => Linking.openSettings()} />
        <Button title="Tekrar Dene" variant="secondary" onPress={check} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: theme.colors.background },
  iconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  icon: { fontSize: 36 },
  title: { fontSize: 24, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },
  desc: { fontSize: 15, color: theme.colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  muted: { color: theme.colors.textMuted },
});

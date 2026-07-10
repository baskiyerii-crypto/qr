import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { useAuth } from '../../stores/auth';
import { Card, Button, Avatar, Chip } from '../../components/ui';
import { screen, ScreenScroll, ScreenHeader } from '../../components/screen';
import { theme } from '../../lib/theme';

type MyData = {
  profile: { firstName: string; lastName: string; email: string };
  position: string | null;
  hireDate: string | null;
  recentAttendance: Array<{ type: string; date: string }>;
  registeredDevices: number;
  note: string;
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [myData, setMyData] = useState<MyData | null>(null);

  useEffect(() => {
    if (user?.role === 'EMPLOYEE') {
      api.get<MyData>('/kvkk/my-data').then(setMyData).catch(() => {});
    }
  }, [user?.role]);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScreenScroll>
      <ScreenHeader title="Profil" />

      <Card style={styles.profileCard}>
        <Avatar name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} size={56} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
        {user?.role ? <Chip label={user.role} tone="primary" /> : null}
      </Card>

      {myData && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Verilerim (KVKK)</Text>
          {myData.position && <Text style={screen.muted}>Pozisyon: {myData.position}</Text>}
          <View style={styles.dataRow}><Text style={styles.dataLabel}>Kayıtlı cihaz</Text><Text style={styles.dataValue}>{myData.registeredDevices}</Text></View>
          <View style={styles.dataRow}><Text style={styles.dataLabel}>Son devam kaydı</Text><Text style={styles.dataValue}>{myData.recentAttendance.length}</Text></View>
          <Text style={styles.note}>{myData.note}</Text>
        </Card>
      )}

      <View style={{ gap: 12, marginTop: 4 }}>
        <Button title="KVKK Aydınlatma Metni" variant="secondary" icon="shield-checkmark-outline" onPress={() => router.push('/kvkk')} />
        <Button title="Çıkış Yap" variant="ghost" icon="log-out-outline" onPress={handleLogout} />
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  name: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  email: { color: theme.colors.textMuted, marginTop: 2, fontSize: 13 },
  section: { marginTop: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: theme.colors.text },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  dataLabel: { color: theme.colors.textMuted },
  dataValue: { color: theme.colors.text, fontWeight: '600' },
  note: { fontSize: 12, color: theme.colors.textMuted, marginTop: 12, fontStyle: 'italic' },
});

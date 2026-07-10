import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../lib/api';
import { Button } from '../components/ui';
import { theme } from '../lib/theme';

export default function KvkkScreen() {
  const [disclosure, setDisclosure] = useState<{ sections: Array<{ title: string; content: string }> } | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    api.get<typeof disclosure>('/kvkk/disclosure').then(setDisclosure);
  }, []);

  const accept = async () => {
    await api.post('/kvkk/consent');
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>KVKK Aydınlatma Metni</Text>
        {disclosure?.sections.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.body}>{s.content}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button title="Okudum ve Kabul Ediyorum" icon="checkmark-circle" onPress={accept} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 24, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 24, color: theme.colors.text, letterSpacing: -0.5 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6, color: theme.colors.text },
  body: { fontSize: 14, color: theme.colors.textMuted, lineHeight: 22 },
  footer: { padding: 20, paddingTop: 16, borderTopWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
});

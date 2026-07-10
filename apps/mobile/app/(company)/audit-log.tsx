import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { api } from '../../lib/api';
import { Card, Chip } from '../../components/ui';
import { ScreenScroll, ScreenHeader, EmptyState } from '../../components/screen';
import { theme } from '../../lib/theme';

type AuditEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  actor: { firstName: string; lastName: string } | null;
};

export default function AuditLogScreen() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    api.get<AuditEntry[]>('/audit?limit=200').then(setEntries).catch(() => {});
  }, []);

  return (
    <ScreenScroll>
      <ScreenHeader title="Denetim Kaydı" subtitle="Sistem üzerindeki kritik işlemler" />
      {entries.map((e) => (
        <Card key={e.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.actor}>{e.actor ? `${e.actor.firstName} ${e.actor.lastName}` : 'Sistem'}</Text>
            <Chip label={e.action} tone="default" />
          </View>
          <Text style={styles.entity}>{e.entityType} · {e.entityId.slice(0, 8)}</Text>
          <Text style={styles.time}>{new Date(e.createdAt).toLocaleString('tr-TR')}</Text>
        </Card>
      ))}
      {!entries.length && <EmptyState icon="document-text-outline" title="Kayıt yok" subtitle="Denetim kaydı bulunmuyor." />}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  actor: { fontSize: 14, fontWeight: '600', color: theme.colors.text, flex: 1 },
  entity: { fontSize: 12, color: theme.colors.textMuted, marginTop: 6 },
  time: { fontSize: 11, color: theme.colors.textSubtle, marginTop: 4 },
});

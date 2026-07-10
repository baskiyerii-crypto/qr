import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { api } from '../../lib/api';
import { Card, Button, Chip } from '../../components/ui';
import { screen, ScreenScroll, ScreenHeader, Loading, EmptyState } from '../../components/screen';
import { Icon } from '../../components/Icon';
import { theme } from '../../lib/theme';

type AnnouncementItem = {
  id: string;
  readAt: string | null;
  acknowledgedAt: string | null;
  announcement: {
    id: string;
    title: string;
    body: string;
    requiresAck: boolean;
    createdAt: string;
  };
};

export default function AnnouncementsScreen() {
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.get<AnnouncementItem[]>('/announcements/my');
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id: string, ack = false) => {
    await api.post(`/announcements/${id}/read`, { acknowledge: ack });
    await load();
  };

  return (
    <ScreenScroll refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}>
      <ScreenHeader title="Duyurular" subtitle="Şirket duyuruları" />

      {loading && <Loading />}
      {!loading && items.length === 0 && (
        <EmptyState icon="megaphone-outline" title="Duyuru yok" subtitle="Henüz bir duyuru bulunmuyor." />
      )}

      <View style={{ gap: 12 }}>
        {items.map((item) => {
          const needsAck = item.announcement.requiresAck && !item.acknowledgedAt;
          const unread = !item.readAt;
          return (
            <Card key={item.id} style={needsAck ? styles.urgent : undefined}>
              <View style={styles.row}>
                <Text style={styles.itemTitle}>{item.announcement.title}</Text>
                {(unread || needsAck) && <Chip label="Yeni" tone={needsAck ? 'warning' : 'primary'} dot />}
              </View>
              <Text style={styles.body}>{item.announcement.body}</Text>
              <Text style={styles.date}>{new Date(item.announcement.createdAt).toLocaleDateString('tr-TR')}</Text>
              {needsAck ? (
                <Button title="Okudum ve Kabul Ediyorum" icon="checkmark-done" onPress={() => markRead(item.announcement.id, true)} />
              ) : unread ? (
                <Button title="Okundu İşaretle" variant="secondary" onPress={() => markRead(item.announcement.id)} />
              ) : (
                <View style={styles.doneRow}>
                  <Icon name="checkmark-circle" size={16} color={theme.colors.success} />
                  <Text style={styles.done}>Okundu{item.acknowledgedAt ? ' ve kabul edildi' : ''}</Text>
                </View>
              )}
            </Card>
          );
        })}
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  itemTitle: { fontSize: 16, fontWeight: '700', flex: 1, color: theme.colors.text },
  body: { marginTop: 8, color: theme.colors.text, lineHeight: 22 },
  date: { fontSize: 12, color: theme.colors.textMuted, marginTop: 8, marginBottom: 12 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  done: { color: theme.colors.success, fontWeight: '600' },
  urgent: { borderColor: theme.colors.warning, borderWidth: 1 },
});

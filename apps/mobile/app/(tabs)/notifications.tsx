import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Chip } from '../../components/ui';
import { ScreenScroll, ScreenHeader, EmptyState } from '../../components/screen';
import { theme } from '../../lib/theme';
import { navigateFromNotification } from '../../lib/navigation';
import { useMarkNotificationRead, useNotifications } from '../../lib/queries';

export default function NotificationsScreen() {
  const router = useRouter();
  const { data: items = [], isFetching, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();

  const open = async (n: (typeof items)[0]) => {
    if (!n.isRead) await markRead.mutateAsync(n.id);
    navigateFromNotification(router, n.type, n.data);
    refetch();
  };

  return (
    <ScreenScroll refreshing={isFetching} onRefresh={refetch}>
      <ScreenHeader title="Bildirimler" subtitle="15 saniyede bir otomatik yenilenir" />
      <View style={{ gap: 10 }}>
        {items.map((n) => (
          <TouchableOpacity key={n.id} onPress={() => open(n)} activeOpacity={0.8}>
            <Card style={!n.isRead ? styles.unread : undefined}>
              <View style={styles.row}>
                <View style={styles.titleRow}>
                  {!n.isRead ? <View style={styles.dot} /> : null}
                  <Text style={styles.cardTitle}>{n.title}</Text>
                </View>
                <Chip label={n.type} tone="default" />
              </View>
              <Text style={styles.body}>{n.body}</Text>
              <Text style={styles.time}>{new Date(n.createdAt).toLocaleString('tr-TR')}</Text>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
      {!items.length && <EmptyState icon="notifications-outline" title="Bildirim yok" subtitle="Yeni bir bildiriminiz bulunmuyor." />}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  unread: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary },
  cardTitle: { fontSize: 15, fontWeight: '700', flex: 1, color: theme.colors.text },
  body: { fontSize: 14, color: theme.colors.textMuted, marginTop: 6 },
  time: { fontSize: 11, color: theme.colors.textSubtle, marginTop: 8 },
});

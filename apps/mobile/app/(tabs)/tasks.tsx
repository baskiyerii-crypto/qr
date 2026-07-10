import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { api } from '../../lib/api';
import { Card, Button, Chip } from '../../components/ui';
import { ScreenScroll, ScreenHeader, EmptyState } from '../../components/screen';
import { Icon } from '../../components/Icon';
import { theme } from '../../lib/theme';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Array<{ id: string; status: string; task: { title: string; description: string; dueDate: string; priority: string } }>>([]);

  useEffect(() => {
    api.get<typeof tasks>('/tasks/my').then(setTasks).catch(() => {});
  }, []);

  const complete = async (id: string) => {
    await api.patch(`/tasks/assignments/${id}/status`, { status: 'COMPLETED' });
    setTasks((t) => t.map((x) => (x.id === id ? { ...x, status: 'COMPLETED' } : x)));
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <ScreenScroll>
      <ScreenHeader title="Görevlerim" subtitle="Size atanan görevler" />
      {tasks.length === 0 ? (
        <EmptyState icon="checkmark-done-outline" title="Görev yok" subtitle="Şu anda atanmış göreviniz bulunmuyor." />
      ) : (
        <View style={{ gap: 12 }}>
          {tasks.map((t) => {
            const isToday = t.task.dueDate.startsWith(today);
            return (
              <Card key={t.id} style={isToday ? styles.today : undefined}>
                <View style={styles.header}>
                  <Text style={styles.taskTitle}>{t.task.title}</Text>
                  {isToday ? <Chip label="Bugün" tone="primary" /> : null}
                </View>
                {t.task.description ? <Text style={styles.desc}>{t.task.description}</Text> : null}
                <Text style={styles.meta}>Son: {new Date(t.task.dueDate).toLocaleDateString('tr-TR')} · {t.task.priority}</Text>
                {t.status !== 'COMPLETED' ? (
                  <Button title="Tamamla" icon="checkmark" onPress={() => complete(t.id)} />
                ) : (
                  <View style={styles.doneRow}>
                    <Icon name="checkmark-circle" size={18} color={theme.colors.success} />
                    <Text style={styles.done}>Tamamlandı</Text>
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  today: { borderColor: theme.colors.primary, borderWidth: 1.5 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  taskTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: theme.colors.text },
  desc: { fontSize: 14, color: theme.colors.textMuted, marginTop: 6 },
  meta: { fontSize: 12, color: theme.colors.textMuted, marginVertical: 12 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  done: { color: theme.colors.success, fontWeight: '700' },
});

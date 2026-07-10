import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, Button, StatCard, IconBubble } from '../../components/ui';
import { screen, ScreenScroll, ScreenHeader, FormInput, EmptyState } from '../../components/screen';
import { Icon } from '../../components/Icon';
import { theme } from '../../lib/theme';
import { useEmployees, useLiveEmployees, usePendingLeaves } from '../../lib/queries';
import { queryKeys } from '../../lib/query-keys';

const QUICK = [
  { label: 'Personel', href: '/(company)/employees', icon: 'people-outline' as const },
  { label: 'Şubeler', href: '/(company)/branches', icon: 'business-outline' as const },
  { label: 'Bordro', href: '/(company)/payroll', icon: 'cash-outline' as const },
  { label: 'Abonelik', href: '/(company)/billing', icon: 'card-outline' as const },
];

export default function AdminScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: live = [], isFetching, refetch: refetchLive } = useLiveEmployees();
  const { data: pendingLeaves = [], refetch: refetchLeaves } = usePendingLeaves();
  const { data: employees = [] } = useEmployees();

  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annTarget, setAnnTarget] = useState<'ALL' | 'DEPARTMENT' | 'SELECTED'>('ALL');
  const [annDeptIds, setAnnDeptIds] = useState<string[]>([]);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskEmployeeId, setTaskEmployeeId] = useState('');
  const [msg, setMsg] = useState('');

  const loadMeta = useCallback(async () => {
    try {
      const depts = await api.get<typeof departments>('/companies/departments');
      setDepartments(depts);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    if (!taskEmployeeId && employees[0]) setTaskEmployeeId(employees[0].id);
  }, [employees, taskEmployeeId]);

  const refresh = async () => {
    await Promise.all([refetchLive(), refetchLeaves(), qc.invalidateQueries({ queryKey: queryKeys.dashboard })]);
    await loadMeta();
  };

  const reviewLeave = async (id: string, approve: boolean) => {
    await api.post(`/leaves/${id}/review`, { approve });
    setMsg(approve ? 'İzin onaylandı' : 'İzin reddedildi');
    await refetchLeaves();
    qc.invalidateQueries({ queryKey: queryKeys.dashboard });
  };

  const sendAnnouncement = async () => {
    if (!annTitle || !annBody) return;
    await api.post('/announcements', {
      title: annTitle,
      body: annBody,
      targetType: annTarget,
      departmentIds: annTarget === 'DEPARTMENT' ? annDeptIds : undefined,
      employeeIds: annTarget === 'SELECTED' ? [taskEmployeeId].filter(Boolean) : undefined,
    });
    setAnnTitle('');
    setAnnBody('');
    setMsg('Duyuru gönderildi');
    qc.invalidateQueries({ queryKey: queryKeys.myAnnouncements });
  };

  const assignTask = async () => {
    if (!taskTitle || !taskEmployeeId) return;
    const due = new Date();
    due.setDate(due.getDate() + 7);
    await api.post('/tasks', { title: taskTitle, employeeIds: [taskEmployeeId], dueDate: due.toISOString() });
    setTaskTitle('');
    setMsg('Görev atandı');
    qc.invalidateQueries({ queryKey: ['tasks'] });
  };

  return (
    <ScreenScroll refreshing={isFetching} onRefresh={refresh}>
      <ScreenHeader title="Yönetim" subtitle="Canlı devam ve onaylar — otomatik yenilenir" />
      {msg ? <Text style={screen.msg}>{msg}</Text> : null}

      <TouchableOpacity onPress={() => router.push('/(company)')} activeOpacity={0.8}>
        <Card style={styles.hubCard}>
          <IconBubble name="grid-outline" size={44} />
          <View style={{ flex: 1 }}>
            <Text style={styles.hubTitle}>Tüm Şirket Modülleri</Text>
            <Text style={screen.muted}>Personel, bordro, şubeler, abonelik…</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={theme.colors.textSubtle} />
        </Card>
      </TouchableOpacity>

      <View style={styles.hubRow}>
        {QUICK.map((m) => (
          <TouchableOpacity key={m.href} onPress={() => router.push(m.href as never)} style={styles.hubChip} activeOpacity={0.8}>
            <Icon name={m.icon} size={16} color={theme.colors.primary} />
            <Text style={styles.hubChipText}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.stats}>
        <StatCard label="Şu an içeride" value={live.length} icon="log-in-outline" tone="success" />
        <StatCard label="Bekleyen izin" value={pendingLeaves.length} icon="time-outline" tone="warning" />
      </View>

      {pendingLeaves.length > 0 && (
        <>
          <Text style={screen.section}>Bekleyen İzinler</Text>
          {pendingLeaves.map((l) => (
            <Card key={l.id} style={styles.row}>
              <Text style={styles.name}>{l.employee.user.firstName} {l.employee.user.lastName}</Text>
              <Text style={screen.muted}>
                {new Date(l.startDate).toLocaleDateString('tr-TR')} – {new Date(l.endDate).toLocaleDateString('tr-TR')}
              </Text>
              <View style={styles.actions}>
                <Button title="Onayla" icon="checkmark" onPress={() => reviewLeave(l.id, true)} />
                <Button title="Reddet" variant="secondary" onPress={() => reviewLeave(l.id, false)} />
              </View>
            </Card>
          ))}
        </>
      )}

      <Text style={screen.section}>Hızlı Duyuru</Text>
      <Card>
        <FormInput placeholder="Başlık" value={annTitle} onChangeText={setAnnTitle} />
        <FormInput style={[screen.input, screen.textarea]} placeholder="İçerik" value={annBody} onChangeText={setAnnBody} multiline />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.empRow}>
          {(['ALL', 'DEPARTMENT', 'SELECTED'] as const).map((t) => (
            <Button
              key={t}
              title={t === 'ALL' ? 'Tümü' : t === 'DEPARTMENT' ? 'Dept' : 'Seçili'}
              variant={annTarget === t ? 'primary' : 'secondary'}
              onPress={() => setAnnTarget(t)}
            />
          ))}
        </ScrollView>
        {annTarget === 'DEPARTMENT' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.empRow}>
            {departments.map((d) => (
              <Button
                key={d.id}
                title={d.name}
                variant={annDeptIds.includes(d.id) ? 'primary' : 'secondary'}
                onPress={() =>
                  setAnnDeptIds((ids) => (ids.includes(d.id) ? ids.filter((x) => x !== d.id) : [...ids, d.id]))
                }
              />
            ))}
          </ScrollView>
        )}
        <Button title="Duyuru Gönder" icon="megaphone-outline" onPress={sendAnnouncement} />
      </Card>

      <Text style={screen.section}>Görev Ata</Text>
      <Card>
        <FormInput placeholder="Görev başlığı" value={taskTitle} onChangeText={setTaskTitle} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.empRow}>
          {employees.map((e) => (
            <Button
              key={e.id}
              title={e.user.firstName}
              variant={taskEmployeeId === e.id ? 'primary' : 'secondary'}
              onPress={() => setTaskEmployeeId(e.id)}
            />
          ))}
        </ScrollView>
        <Button title="Görev Oluştur" icon="add" onPress={assignTask} />
      </Card>

      <Text style={screen.section}>Canlı Devam</Text>
      {live.map((r, i) => (
        <Card key={i} style={styles.row}>
          <Text style={styles.name}>{r.employee.user.firstName} {r.employee.user.lastName}</Text>
          <Text style={screen.muted}>{r.branch.name}</Text>
        </Card>
      ))}
      {live.length === 0 && <EmptyState icon="log-in-outline" title="İçeride kimse yok" subtitle="Şu anda giriş yapmış personel bulunmuyor." />}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 12, marginTop: 4 },
  hubCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  hubTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  hubRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  hubChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.radius.full, paddingHorizontal: 14, paddingVertical: 8,
  },
  hubChipText: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
  row: { marginBottom: 8, gap: 2 },
  name: { fontWeight: '700', color: theme.colors.text, fontSize: 15 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  empRow: { gap: 8, marginBottom: 12 },
});

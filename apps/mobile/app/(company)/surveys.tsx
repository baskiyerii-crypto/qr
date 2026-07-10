import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { api } from '../../lib/api';
import { Card, Button, Chip } from '../../components/ui';
import { ScreenScroll, ScreenHeader, FormInput, EmptyState } from '../../components/screen';
import { theme } from '../../lib/theme';

type Survey = {
  id: string;
  title: string;
  status: string;
  _count: { assignments: number; responses: number };
};

type SurveyStats = {
  totalAssigned: number;
  totalCompleted: number;
  completionRate: number;
};

type Participant = {
  employeeId: string;
  firstName: string;
  lastName: string;
  branchName: string | null;
  status: 'completed' | 'pending';
};

type ParticipantsData = {
  totalPending: number;
  participants: Participant[];
};

export default function CompanySurveysScreen() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stats, setStats] = useState<SurveyStats | null>(null);
  const [participants, setParticipants] = useState<ParticipantsData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [qText, setQText] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [targetType, setTargetType] = useState<'ALL' | 'DEPARTMENT' | 'SELECTED'>('ALL');
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; user: { firstName: string; lastName: string } }>>([]);
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [msg, setMsg] = useState('');

  const load = async () => {
    const list = await api.get<Survey[]>('/surveys');
    setSurveys(list);
  };

  const loadDetails = async (id: string) => {
    const [s, p] = await Promise.all([
      api.get<SurveyStats>(`/surveys/${id}/stats`),
      api.get<ParticipantsData>(`/surveys/${id}/participants`),
    ]);
    setStats(s);
    setParticipants(p);
  };

  useEffect(() => {
    load().catch(() => {});
    api.get<typeof departments>('/companies/departments').then(setDepartments).catch(() => {});
    api.get<typeof employees>('/employees').then(setEmployees).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedId) loadDetails(selectedId).catch(() => {});
    else {
      setStats(null);
      setParticipants(null);
    }
  }, [selectedId]);

  const create = async () => {
    if (!title || !qText || !opt1 || !opt2) return;
    await api.post('/surveys', {
      title,
      status: 'ACTIVE',
      targetType,
      departmentIds: targetType === 'DEPARTMENT' ? selectedDeptIds : undefined,
      employeeIds: targetType === 'SELECTED' ? selectedEmpIds : undefined,
      questions: [
        {
          order: 0,
          type: 'SINGLE_CHOICE',
          text: qText,
          required: true,
          options: [
            { label: opt1, order: 0 },
            { label: opt2, order: 1 },
          ],
        },
      ],
    });
    setShowForm(false);
    setTitle('');
    setQText('');
    setOpt1('');
    setOpt2('');
    setMsg('Anket yayınlandı');
    await load();
  };

  const remind = async () => {
    if (!selectedId) return;
    const res = await api.post<{ reminded: number }>(`/surveys/${selectedId}/remind`, {});
    setMsg(`${res.reminded} personele hatırlatma gönderildi`);
  };

  const selected = surveys.find((s) => s.id === selectedId);

  return (
    <ScreenScroll>
      <ScreenHeader
        title="Anketler"
        subtitle="Personel anketleri oluşturun"
        right={<Button title={showForm ? 'İptal' : 'Yeni'} variant="secondary" onPress={() => setShowForm(!showForm)} />}
      />
      {msg ? <Text style={styles.msg}>{msg}</Text> : null}

      {showForm && (
        <Card style={styles.form}>
          <FormInput placeholder="Anket başlığı" value={title} onChangeText={setTitle} />
          <FormInput placeholder="Soru" value={qText} onChangeText={setQText} />
          <FormInput placeholder="Seçenek 1" value={opt1} onChangeText={setOpt1} />
          <FormInput placeholder="Seçenek 2" value={opt2} onChangeText={setOpt2} />
          <View style={styles.targetRow}>
            {(['ALL', 'DEPARTMENT', 'SELECTED'] as const).map((t) => (
              <TouchableOpacity key={t} style={[styles.targetBtn, targetType === t && styles.targetActive]} onPress={() => setTargetType(t)}>
                <Text style={styles.targetText}>{t === 'ALL' ? 'Tümü' : t === 'DEPARTMENT' ? 'Dept.' : 'Seçili'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {targetType === 'DEPARTMENT' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {departments.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.chip, selectedDeptIds.includes(d.id) && styles.chipActive]}
                  onPress={() =>
                    setSelectedDeptIds((ids) =>
                      ids.includes(d.id) ? ids.filter((x) => x !== d.id) : [...ids, d.id],
                    )
                  }
                >
                  <Text style={styles.chipText}>{d.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          {targetType === 'SELECTED' && employees.slice(0, 20).map((e) => (
            <TouchableOpacity
              key={e.id}
              style={styles.empRow}
              onPress={() =>
                setSelectedEmpIds((ids) =>
                  ids.includes(e.id) ? ids.filter((x) => x !== e.id) : [...ids, e.id],
                )
              }
            >
              <Text style={styles.empText}>
                {selectedEmpIds.includes(e.id) ? '☑ ' : '☐ '}
                {e.user.firstName} {e.user.lastName}
              </Text>
            </TouchableOpacity>
          ))}
          <Button title="Yayınla" icon="send" onPress={create} />
        </Card>
      )}

      {surveys.map((s) => (
        <TouchableOpacity key={s.id} onPress={() => setSelectedId(selectedId === s.id ? null : s.id)}>
          <Card style={[styles.card, selectedId === s.id && styles.cardSelected]}>
            <Text style={styles.cardTitle}>{s.title}</Text>
            <Text style={styles.sub}>
              {s._count.responses}/{s._count.assignments} tamamlandı
            </Text>
            <Chip label={s.status} tone={s.status === 'ACTIVE' ? 'success' : 'default'} />
          </Card>
        </TouchableOpacity>
      ))}

      {selectedId && stats && participants && (
        <Card style={styles.detail}>
          <Text style={styles.detailTitle}>Sonuçlar</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{stats.totalCompleted}</Text>
              <Text style={styles.statLbl}>Tamamlayan</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{stats.totalAssigned}</Text>
              <Text style={styles.statLbl}>Hedef</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: theme.colors.success }]}>%{stats.completionRate}</Text>
              <Text style={styles.statLbl}>Oran</Text>
            </View>
          </View>
          {selected?.status === 'ACTIVE' && participants.totalPending > 0 && (
            <Button title={`Hatırlat (${participants.totalPending})`} variant="secondary" onPress={remind} />
          )}
          <Text style={styles.sectionTitle}>Tamamladı</Text>
          {participants.participants.filter((p) => p.status === 'completed').map((p) => (
            <Text key={p.employeeId} style={styles.participant}>
              ✓ {p.firstName} {p.lastName} {p.branchName ? `· ${p.branchName}` : ''}
            </Text>
          ))}
          <Text style={styles.sectionTitle}>Bekliyor</Text>
          {participants.participants.filter((p) => p.status === 'pending').map((p) => (
            <Text key={p.employeeId} style={styles.participant}>
              ○ {p.firstName} {p.lastName} {p.branchName ? `· ${p.branchName}` : ''}
            </Text>
          ))}
        </Card>
      )}

      {!surveys.length && !showForm && (
        <EmptyState icon="clipboard-outline" title="Anket yok" subtitle="İlk anketinizi oluşturun." />
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  form: { marginBottom: 16, gap: 8 },
  card: { marginBottom: 8 },
  cardSelected: { borderColor: theme.colors.primary, borderWidth: 2 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  sub: { fontSize: 13, color: theme.colors.textMuted, marginVertical: 4 },
  msg: { color: theme.colors.success, marginBottom: 12, fontWeight: '600' },
  targetRow: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  targetBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  targetActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
  targetText: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: theme.colors.border },
  chipActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
  chipText: { fontSize: 12, color: theme.colors.text },
  empRow: { paddingVertical: 6 },
  empText: { fontSize: 14, color: theme.colors.text },
  detail: { marginTop: 8, gap: 8 },
  detailTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 8 },
  statBox: { alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '700', color: theme.colors.primary },
  statLbl: { fontSize: 11, color: theme.colors.textMuted },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: theme.colors.text, marginTop: 8 },
  participant: { fontSize: 13, color: theme.colors.textMuted, paddingVertical: 2 },
});

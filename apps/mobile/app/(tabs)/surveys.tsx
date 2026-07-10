import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { Card, Button, Chip } from '../../components/ui';
import { ScreenScroll, ScreenHeader, FormInput, EmptyState } from '../../components/screen';
import { AppTopBar } from '../../components/layout/AppTopBar';
import { theme } from '../../lib/theme';

type SurveyItem = {
  id: string;
  title: string;
  description?: string;
  completed?: boolean;
  questions?: Array<{
    id: string;
    type: string;
    text: string;
    required: boolean;
    options?: Array<{ id: string; label: string }>;
  }>;
};

export default function SurveysScreen() {
  const insets = useSafeAreaInsets();
  const [surveys, setSurveys] = useState<SurveyItem[]>([]);
  const [selected, setSelected] = useState<SurveyItem | null>(null);
  const [answers, setAnswers] = useState<Record<string, { optionId?: string; textValue?: string }>>({});
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const list = await api.get<SurveyItem[]>('/surveys/my');
    setSurveys(list);
  }, []);

  useEffect(() => { load().catch(() => {}); }, [load]);

  const openSurvey = async (id: string) => {
    const detail = await api.get<SurveyItem>(`/surveys/${id}`);
    setSelected(detail);
    setAnswers({});
    setMsg('');
  };

  const submit = async () => {
    if (!selected) return;
    const payload = {
      answers: (selected.questions ?? []).map((q) => ({
        questionId: q.id,
        optionId: answers[q.id]?.optionId,
        textValue: answers[q.id]?.textValue,
      })),
    };
    await api.post(`/surveys/${selected.id}/responses`, payload);
    setMsg('Anket gönderildi');
    setSelected(null);
    await load();
  };

  if (selected) {
    return (
      <View style={styles.container}>
        <AppTopBar title={selected.title} showBack onBack={() => setSelected(null)} />
        <ScrollView style={styles.detail} contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingHorizontal: 20 }}>
          {selected.description ? <Text style={styles.desc}>{selected.description}</Text> : null}
          {(selected.questions ?? []).map((q) => (
            <Card key={q.id} style={styles.qCard}>
              <Text style={styles.qText}>
                {q.text}
                {q.required ? ' *' : ''}
              </Text>
              {q.type === 'SINGLE_CHOICE' &&
                q.options?.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.opt, answers[q.id]?.optionId === opt.id && styles.optActive]}
                    onPress={() => setAnswers((a) => ({ ...a, [q.id]: { optionId: opt.id } }))}
                  >
                    <Text style={styles.optText}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              {q.type === 'SHORT_TEXT' && (
                <FormInput
                  placeholder="Cevabınız"
                  value={answers[q.id]?.textValue ?? ''}
                  onChangeText={(textValue) => setAnswers((a) => ({ ...a, [q.id]: { textValue } }))}
                  multiline
                />
              )}
            </Card>
          ))}
          <Button title="Gönder" icon="checkmark" onPress={submit} />
        </ScrollView>
      </View>
    );
  }

  return (
    <ScreenScroll>
      <ScreenHeader title="Anketler" subtitle="Size atanan anketleri doldurun" />
      {msg ? <Text style={styles.msg}>{msg}</Text> : null}
      {surveys.map((s) => (
        <TouchableOpacity key={s.id} onPress={() => !s.completed && openSurvey(s.id)} disabled={!!s.completed} activeOpacity={0.8}>
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{s.title}</Text>
                {s.description ? <Text style={styles.sub}>{s.description}</Text> : null}
              </View>
              <Chip label={s.completed ? 'Tamamlandı' : 'Bekliyor'} tone={s.completed ? 'success' : 'warning'} />
            </View>
          </Card>
        </TouchableOpacity>
      ))}
      {!surveys.length && <EmptyState icon="clipboard-outline" title="Anket yok" subtitle="Size atanmış aktif anket bulunmuyor." />}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, paddingHorizontal: 20 },
  detail: { flex: 1, marginTop: 8 },
  title: { fontSize: 22, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
  desc: { fontSize: 14, color: theme.colors.textMuted, marginBottom: 16 },
  qCard: { marginBottom: 12, gap: 8 },
  qText: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  opt: { padding: 12, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border },
  optActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
  optText: { fontSize: 14, color: theme.colors.text },
  card: { marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  sub: { fontSize: 13, color: theme.colors.textMuted, marginTop: 4 },
  msg: { color: theme.colors.success, marginBottom: 12, fontWeight: '600' },
});

import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../lib/api';
import { Card, Button, Chip } from './ui';
import { screen, ScreenScroll, ScreenHeader, FormInput, EmptyState } from './screen';
import { Icon } from './Icon';
import { theme } from '../lib/theme';

export type FeedbackThread = {
  id: string;
  subject: string;
  status: string;
  createdAt?: string;
  createdBy?: { firstName: string; lastName: string; publicId?: string };
  reseller?: { companyName: string };
  messages: Array<{
    id: string;
    body: string;
    createdAt: string;
    sender: { firstName: string; lastName: string };
  }>;
};

type Props = {
  title: string;
  subtitle?: string;
  allowCreate?: boolean;
  allowClose?: boolean;
  threadMeta?: (t: FeedbackThread) => string | undefined;
};

export function FeedbackThreads({
  title,
  subtitle,
  allowCreate = true,
  allowClose = false,
  threadMeta,
}: Props) {
  const insets = useSafeAreaInsets();
  const [threads, setThreads] = useState<FeedbackThread[]>([]);
  const [selected, setSelected] = useState<FeedbackThread | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [reply, setReply] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const list = await api.get<FeedbackThread[]>('/feedback/my');
    setThreads(list);
    setSelected((prev) => (prev ? list.find((t) => t.id === prev.id) || null : null));
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const create = async () => {
    if (!subject.trim() || !body.trim()) return;
    setBusy(true);
    try {
      await api.post('/feedback', { subject: subject.trim(), body: body.trim() });
      setShowNew(false);
      setSubject('');
      setBody('');
      await load();
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setBusy(true);
    try {
      await api.post(`/feedback/${selected.id}/reply`, { body: reply.trim() });
      setReply('');
      await load();
    } finally {
      setBusy(false);
    }
  };

  const closeThread = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await api.patch(`/feedback/${selected.id}/close`, {});
      await load();
      setSelected(null);
    } finally {
      setBusy(false);
    }
  };

  if (selected) {
    return (
      <View style={[styles.detail, { paddingTop: insets.top + 8 }]}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => setSelected(null)} style={styles.backBtn} activeOpacity={0.7}>
            <Icon name="chevron-back" size={20} color={theme.colors.primary} />
            <Text style={screen.back}>Geri bildirimler</Text>
          </TouchableOpacity>
          <View style={styles.detailTitleRow}>
            <Text style={styles.detailTitle}>{selected.subject}</Text>
            <Chip label={selected.status} tone={selected.status === 'OPEN' ? 'warning' : 'success'} />
          </View>
          {selected.createdBy ? (
            <Text style={screen.muted}>
              {selected.createdBy.firstName} {selected.createdBy.lastName}
              {selected.createdBy.publicId ? ` · ${selected.createdBy.publicId}` : ''}
            </Text>
          ) : null}
        </View>
        <ScrollView style={styles.messages} contentContainerStyle={{ paddingBottom: 12 }}>
          {selected.messages.map((m) => (
            <View key={m.id} style={styles.bubble}>
              <Text style={styles.sender}>
                {m.sender.firstName} {m.sender.lastName} · {new Date(m.createdAt).toLocaleString('tr-TR')}
              </Text>
              <Text style={styles.bubbleText}>{m.body}</Text>
            </View>
          ))}
        </ScrollView>
        {selected.status === 'OPEN' ? (
          <View style={[styles.inputRow, { paddingBottom: insets.bottom + 12 }]}>
            <FormInput
              style={styles.flexInput}
              value={reply}
              onChangeText={setReply}
              placeholder="Yanıt yazın…"
              multiline
            />
            <View style={styles.actions}>
              <Button title="Gönder" icon="send" onPress={sendReply} loading={busy} disabled={!reply.trim()} />
              {allowClose ? (
                <Button title="Kapat" variant="secondary" onPress={closeThread} loading={busy} />
              ) : null}
            </View>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 12 }}>
            <Text style={screen.muted}>Bu geri bildirim kapatılmış.</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <ScreenScroll
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await load().catch(() => {});
        setRefreshing(false);
      }}
    >
      <ScreenHeader
        title={title}
        subtitle={subtitle}
        right={
          allowCreate ? (
            <Button
              title={showNew ? 'İptal' : 'Yeni'}
              icon={showNew ? 'close' : 'add'}
              onPress={() => setShowNew(!showNew)}
              variant="secondary"
            />
          ) : undefined
        }
      />

      {showNew && allowCreate ? (
        <Card style={styles.form}>
          <FormInput placeholder="Konu" value={subject} onChangeText={setSubject} />
          <FormInput
            style={[screen.input, screen.textarea]}
            placeholder="Mesajınız…"
            value={body}
            onChangeText={setBody}
            multiline
          />
          <Button title="Gönder" icon="send" onPress={create} loading={busy} />
        </Card>
      ) : null}

      <View style={{ gap: 8 }}>
        {threads.map((t) => {
          const meta = threadMeta?.(t);
          return (
            <TouchableOpacity key={t.id} onPress={() => setSelected(t)} activeOpacity={0.85}>
              <Card>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subject}>{t.subject}</Text>
                    {meta ? <Text style={screen.muted}>{meta}</Text> : null}
                    {t.messages[0] ? (
                      <Text style={styles.preview} numberOfLines={2}>
                        {t.messages[0].body}
                      </Text>
                    ) : null}
                  </View>
                  <Chip label={t.status} tone={t.status === 'OPEN' ? 'warning' : 'success'} />
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
        {!threads.length && !showNew ? (
          <EmptyState
            icon="chatbox-outline"
            title="Geri bildirim yok"
            subtitle={allowCreate ? 'Yeni geri bildirim oluşturabilirsiniz.' : 'Henüz geri bildirim bulunmuyor.'}
          />
        ) : null}
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  form: { marginBottom: 16, gap: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  subject: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  preview: { fontSize: 13, color: theme.colors.textMuted, marginTop: 4 },
  detail: { flex: 1, backgroundColor: 'transparent' },
  detailHeader: { paddingHorizontal: 20 },
  detailTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  detailTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: theme.colors.text },
  messages: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  bubble: {
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: theme.radius.lg,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bubbleText: { color: theme.colors.text, fontSize: 14, lineHeight: 20 },
  sender: { fontSize: 11, color: theme.colors.textMuted, marginBottom: 4, fontWeight: '600' },
  inputRow: { paddingHorizontal: 16, paddingTop: 12, gap: 8, borderTopWidth: 1, borderColor: theme.colors.border },
  flexInput: { marginBottom: 0 },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8, alignSelf: 'flex-start' },
});

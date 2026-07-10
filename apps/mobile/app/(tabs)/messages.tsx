import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../stores/auth';
import { Card, Button } from '../../components/ui';
import { AppTopBar } from '../../components/layout/AppTopBar';
import { screen, ScreenScroll, ScreenHeader, FormInput, EmptyState } from '../../components/screen';
import { Icon } from '../../components/Icon';
import { theme } from '../../lib/theme';
import { UserRole } from '@qr/shared';
import {
  useConversations,
  useConversationMessages,
  useEmployees,
  type Conversation,
} from '../../lib/queries';
import { queryKeys } from '../../lib/query-keys';

type Employee = { id: string; user: { firstName: string; lastName: string } };

const MANAGER_ROLES = [UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.REGIONAL_MANAGER, UserRole.BRANCH_MANAGER];

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const qc = useQueryClient();
  const params = useLocalSearchParams<{ conversationId?: string }>();
  const isManager = user && MANAGER_ROLES.includes(user.role as UserRole);

  const [selected, setSelected] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [showNew, setShowNew] = useState<'dm' | 'group' | null>(null);
  const [recipientId, setRecipientId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupIds, setGroupIds] = useState<string[]>([]);

  const { data: conversations = [] } = useConversations();
  const { data: messages = [], refetch: refetchMessages } = useConversationMessages(selected);
  const { data: employees = [] } = useEmployees();

  useEffect(() => {
    if (params.conversationId) setSelected(params.conversationId);
  }, [params.conversationId]);

  useEffect(() => {
    if (selected) {
      api.patch(`/messages/conversations/${selected}/read`, {}).catch(() => {});
      qc.invalidateQueries({ queryKey: queryKeys.notifications });
    }
  }, [selected, messages.length]);

  const convLabel = (c: Conversation) => {
    if (c.type === 'GROUP') return c.name ?? 'Grup';
    const emp = c.participants?.find((p) => p.employee)?.employee;
    return emp ? `${emp.user.firstName} ${emp.user.lastName}` : c.subject ?? 'Konuşma';
  };

  const send = async () => {
    if (!selected || !text.trim()) return;
    if (user?.role === UserRole.EMPLOYEE) {
      await api.post(`/messages/conversations/${selected}/reply`, { body: text });
    } else {
      await api.post('/messages', { conversationId: selected, body: text });
    }
    setText('');
    await refetchMessages();
    qc.invalidateQueries({ queryKey: queryKeys.conversations });
  };

  const createDm = async () => {
    if (!recipientId) return;
    const conv = await api.post<Conversation>('/messages/conversations', {
      type: 'DIRECT',
      recipientEmployeeId: recipientId,
    });
    setShowNew(null);
    setRecipientId('');
    qc.invalidateQueries({ queryKey: queryKeys.conversations });
    setSelected(conv.id);
  };

  const createGroup = async () => {
    if (!groupName || !groupIds.length) return;
    const conv = await api.post<Conversation>('/messages/conversations', {
      type: 'GROUP',
      name: groupName,
      memberEmployeeIds: groupIds,
    });
    setShowNew(null);
    setGroupName('');
    setGroupIds([]);
    qc.invalidateQueries({ queryKey: queryKeys.conversations });
    setSelected(conv.id);
  };

  if (selected) {
    const conv = conversations.find((c) => c.id === selected);
    return (
      <View style={styles.container}>
        <AppTopBar title={conv ? convLabel(conv) : 'Mesajlar'} showBack onBack={() => setSelected(null)} />
        <ScrollView style={styles.messages} contentContainerStyle={{ paddingBottom: 12, paddingHorizontal: 20 }}>
          {messages.map((m) => (
            <View key={m.id} style={styles.bubble}>
              <Text style={styles.sender}>
                {m.senderEmployee?.user
                  ? `${m.senderEmployee.user.firstName} ${m.senderEmployee.user.lastName}`
                  : m.senderUser
                    ? `${m.senderUser.firstName} ${m.senderUser.lastName}`
                    : ''}
              </Text>
              <Text style={styles.bubbleText}>{m.body}</Text>
              <Text style={styles.time}>{new Date(m.createdAt).toLocaleString('tr-TR')}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={[styles.inputRow, { paddingBottom: insets.bottom + 12 }]}>
          <FormInput style={styles.flexInput} value={text} onChangeText={setText} placeholder="Mesaj yazın…" />
          <Button title="" icon="send" onPress={send} />
        </View>
      </View>
    );
  }

  return (
    <ScreenScroll>
      <ScreenHeader title="Mesajlar" subtitle="Canlı senkron — web ile aynı anda güncellenir" />
      {isManager && (
        <View style={styles.actions}>
          <Button title="Yeni Mesaj" variant="secondary" icon="person-add-outline" onPress={() => setShowNew('dm')} />
          <Button title="Grup" icon="people-outline" onPress={() => setShowNew('group')} />
        </View>
      )}

      {showNew === 'dm' && (
        <Card style={styles.form}>
          {employees.map((e: Employee) => (
            <TouchableOpacity key={e.id} style={styles.empRow} onPress={() => setRecipientId(e.id)}>
              <Text style={recipientId === e.id ? styles.empActive : styles.empText}>
                {e.user.firstName} {e.user.lastName}
              </Text>
            </TouchableOpacity>
          ))}
          <Button title="Başlat" onPress={createDm} disabled={!recipientId} />
        </Card>
      )}

      {showNew === 'group' && (
        <Card style={styles.form}>
          <FormInput placeholder="Grup adı" value={groupName} onChangeText={setGroupName} />
          {employees.map((e: Employee) => (
            <TouchableOpacity
              key={e.id}
              onPress={() =>
                setGroupIds((ids) => (ids.includes(e.id) ? ids.filter((x) => x !== e.id) : [...ids, e.id]))
              }
            >
              <Text style={styles.empText}>
                {groupIds.includes(e.id) ? '☑ ' : '☐ '}
                {e.user.firstName} {e.user.lastName}
              </Text>
            </TouchableOpacity>
          ))}
          <Button title="Oluştur" onPress={createGroup} disabled={!groupName || !groupIds.length} />
        </Card>
      )}

      {conversations.map((c) => (
        <TouchableOpacity key={c.id} onPress={() => setSelected(c.id)} activeOpacity={0.8}>
          <Card style={styles.card}>
            <View style={styles.cardRow}>
              <Icon name="chatbubble-ellipses-outline" size={20} color={theme.colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.convTitle}>{convLabel(c)}</Text>
                <Text style={screen.muted} numberOfLines={1}>{c.messages[0]?.body}</Text>
              </View>
              <Icon name="chevron-forward" size={18} color={theme.colors.textSubtle} />
            </View>
          </Card>
        </TouchableOpacity>
      ))}
      {!conversations.length && <EmptyState icon="chatbubbles-outline" title="Mesaj yok" subtitle="Henüz bir konuşmanız bulunmuyor." />}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  form: { marginBottom: 12, gap: 8 },
  card: { marginBottom: 8, paddingVertical: 14 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  convTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  messages: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  bubble: { backgroundColor: theme.colors.surface, padding: 12, borderRadius: theme.radius.lg, marginBottom: 8, borderWidth: 1, borderColor: theme.colors.border },
  bubbleText: { color: theme.colors.text, fontSize: 14 },
  sender: { fontSize: 11, color: theme.colors.textMuted, marginBottom: 4, fontWeight: '600' },
  time: { fontSize: 11, color: theme.colors.textSubtle, marginTop: 4 },
  inputRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8, borderTopWidth: 1, borderColor: theme.colors.border, alignItems: 'flex-start' },
  flexInput: { flex: 1, marginBottom: 0 },
  empRow: { paddingVertical: 8 },
  empText: { fontSize: 14, color: theme.colors.text },
  empActive: { fontSize: 14, color: theme.colors.primary, fontWeight: '700' },
});

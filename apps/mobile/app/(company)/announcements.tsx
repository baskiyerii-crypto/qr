import { useCallback, useEffect, useState } from 'react';
import { Text } from 'react-native';
import { api } from '../../lib/api';
import { Button, Card } from '../../components/ui';
import { ScreenScroll, ScreenHeader, FormInput, screen, EmptyState, Loading } from '../../components/screen';

type Announcement = { id: string; title: string; body?: string; createdAt: string };

export default function CompanyAnnouncementsScreen() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const list = await api.get<Announcement[]>('/announcements');
    setItems(list);
  }, []);

  useEffect(() => {
    load()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [load]);

  const create = async () => {
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    try {
      await api.post('/announcements', {
        title: title.trim(),
        body: body.trim(),
        targetType: 'ALL',
        requiresAck: false,
      });
      setTitle('');
      setBody('');
      setShowForm(false);
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <ScreenScroll><Loading /></ScreenScroll>;

  return (
    <ScreenScroll>
      <ScreenHeader
        title="Duyurular"
        subtitle="Tüm personele duyuru gönderin"
        right={
          <Button
            title={showForm ? 'İptal' : 'Yeni'}
            variant="secondary"
            icon={showForm ? 'close' : 'add'}
            onPress={() => setShowForm(!showForm)}
          />
        }
      />

      {showForm ? (
        <Card style={{ gap: 8, marginBottom: 12 }}>
          <FormInput placeholder="Başlık" value={title} onChangeText={setTitle} />
          <FormInput
            style={[screen.input, screen.textarea]}
            placeholder="Duyuru metni"
            value={body}
            onChangeText={setBody}
            multiline
          />
          <Button title="Yayınla" onPress={create} loading={busy} />
        </Card>
      ) : null}

      {items.map((a) => (
        <Card key={a.id} style={{ marginBottom: 8 }}>
          <Text style={{ fontWeight: '600' }}>{a.title}</Text>
          <Text style={screen.muted}>{new Date(a.createdAt).toLocaleString('tr-TR')}</Text>
          {a.body ? <Text style={screen.muted}>{a.body}</Text> : null}
        </Card>
      ))}

      {!items.length && !showForm ? (
        <EmptyState icon="megaphone-outline" title="Duyuru yok" subtitle="İlk duyuruyu oluşturun." />
      ) : null}
    </ScreenScroll>
  );
}

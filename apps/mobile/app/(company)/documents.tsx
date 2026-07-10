import { useCallback, useEffect, useState } from 'react';
import { Text, TouchableOpacity, Linking } from 'react-native';
import { api, API_ORIGIN } from '../../lib/api';
import { Card } from '../../components/ui';
import { ScreenScroll, screen } from '../../components/screen';

interface Doc {
  id: string;
  type: string;
  title: string;
  fileUrl: string;
  createdAt: string;
  employee: { user: { firstName: string; lastName: string } };
}

export default function DocumentsScreen() {
  const [items, setItems] = useState<Doc[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get<Doc[]>('/documents');
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const open = (fileUrl: string) => {
    const url = fileUrl.startsWith('http') ? fileUrl : `${API_ORIGIN}${fileUrl}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <ScreenScroll
      refreshing={refreshing}
      onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
    >
      <Text style={screen.title}>Belgeler</Text>
      {items.map((d) => (
        <Card key={d.id} style={screen.row}>
          <Text style={{ fontWeight: '600' }}>{d.title}</Text>
          <Text style={screen.muted}>
            {d.employee.user.firstName} {d.employee.user.lastName} · {d.type} ·{' '}
            {new Date(d.createdAt).toLocaleDateString('tr-TR')}
          </Text>
          <TouchableOpacity onPress={() => open(d.fileUrl)}>
            <Text style={{ color: '#2563eb', marginTop: 6 }}>Görüntüle</Text>
          </TouchableOpacity>
        </Card>
      ))}
      {!items.length && <Text style={screen.empty}>Belge yok</Text>}
    </ScreenScroll>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { api } from '../../lib/api';
import { Button, Card, Chip } from '../../components/ui';
import { ScreenScroll, ScreenHeader, FormInput, screen, EmptyState, Loading } from '../../components/screen';

type Task = {
  id: string;
  title: string;
  dueDate: string;
  assignments?: Array<{ status: string; employee: { user: { firstName: string } } }>;
};

type Employee = { id: string; user: { firstName: string; lastName: string } };

export default function CompanyTasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [title, setTitle] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [t, e] = await Promise.all([
      api.get<Task[]>('/tasks'),
      api.get<Employee[]>('/employees'),
    ]);
    setTasks(t);
    setEmployees(e);
  }, []);

  useEffect(() => {
    load()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [load]);

  const toggleEmployee = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const create = async () => {
    if (!title.trim() || !selectedIds.length) return;
    setBusy(true);
    try {
      await api.post('/tasks', {
        title: title.trim(),
        employeeIds: selectedIds,
        dueDate: new Date().toISOString().split('T')[0],
      });
      setTitle('');
      setSelectedIds([]);
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
        title="Görevler"
        subtitle="Personele görev atayın"
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
          <FormInput placeholder="Görev başlığı" value={title} onChangeText={setTitle} />
          <Text style={screen.label}>Personel seçin</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {employees.map((e) => (
              <Button
                key={e.id}
                title={`${e.user.firstName} ${e.user.lastName}`}
                variant={selectedIds.includes(e.id) ? 'primary' : 'secondary'}
                onPress={() => toggleEmployee(e.id)}
              />
            ))}
          </View>
          <Button title="Görev Ata" onPress={create} loading={busy} disabled={!title.trim() || !selectedIds.length} />
        </Card>
      ) : null}

      {tasks.map((t) => (
        <Card key={t.id} style={{ marginBottom: 8 }}>
          <Text style={{ fontWeight: '600' }}>{t.title}</Text>
          <Text style={screen.muted}>Son: {new Date(t.dueDate).toLocaleDateString('tr-TR')}</Text>
          {t.assignments?.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {t.assignments.map((a, i) => (
                <Chip
                  key={i}
                  label={`${a.employee.user.firstName}: ${a.status}`}
                  tone={a.status === 'COMPLETED' ? 'success' : 'default'}
                />
              ))}
            </View>
          ) : null}
        </Card>
      ))}

      {!tasks.length && !showForm ? (
        <EmptyState icon="checkbox-outline" title="Görev yok" subtitle="İlk görevi oluşturun." />
      ) : null}
    </ScreenScroll>
  );
}

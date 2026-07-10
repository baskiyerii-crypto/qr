import { useCallback, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { api } from '../../lib/api';
import { Button, Card, Chip } from '../../components/ui';
import { ScreenScroll, ScreenHeader, FormInput, screen, EmptyState, Loading } from '../../components/screen';
import { theme } from '../../lib/theme';

type Employee = {
  id: string;
  position: string | null;
  user: { firstName: string; lastName: string; publicId: string; isActive: boolean };
  branch: { name: string } | null;
  department: { name: string } | null;
};

type Option = { id: string; name: string };

const emptyForm = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  position: '',
  monthlySalary: '',
  branchId: '',
  departmentId: '',
};

export default function CompanyEmployeesScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Option[]>([]);
  const [departments, setDepartments] = useState<Option[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [emps, brs, deps] = await Promise.all([
      api.get<Employee[]>('/employees?includeInactive=true'),
      api.get<Option[]>('/companies/branches'),
      api.get<Option[]>('/companies/departments'),
    ]);
    setEmployees(emps);
    setBranches(brs);
    setDepartments(deps);
  }, []);

  useEffect(() => {
    load()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [load]);

  const create = async () => {
    if (!form.email || !form.password || !form.firstName || !form.lastName) return;
    setBusy(true);
    setMsg('');
    try {
      const res = await api.post<{ message?: string }>('/employees', {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        position: form.position || undefined,
        monthlySalary: form.monthlySalary ? parseFloat(form.monthlySalary) : undefined,
        branchId: form.branchId || undefined,
        departmentId: form.departmentId || undefined,
      });
      setMsg(res.message || 'Personel oluşturuldu');
      setShowForm(false);
      setForm(emptyForm);
      await load();
    } catch {
      setMsg('Oluşturma başarısız');
    } finally {
      setBusy(false);
    }
  };

  const deactivate = async (id: string) => {
    setBusy(true);
    try {
      await api.patch(`/employees/${id}/deactivate`);
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <ScreenScroll><Loading /></ScreenScroll>;

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
        title="Personel"
        subtitle={`${employees.length} kayıt`}
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
          <FormInput placeholder="E-posta" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} autoCapitalize="none" keyboardType="email-address" />
          <FormInput placeholder="Şifre (min 8)" value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry />
          <FormInput placeholder="Ad" value={form.firstName} onChangeText={(v) => setForm({ ...form, firstName: v })} />
          <FormInput placeholder="Soyad" value={form.lastName} onChangeText={(v) => setForm({ ...form, lastName: v })} />
          <FormInput placeholder="Pozisyon" value={form.position} onChangeText={(v) => setForm({ ...form, position: v })} />
          <FormInput placeholder="Aylık maaş" value={form.monthlySalary} onChangeText={(v) => setForm({ ...form, monthlySalary: v })} keyboardType="decimal-pad" />
          {branches.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {branches.map((b) => (
                <Button
                  key={b.id}
                  title={b.name}
                  variant={form.branchId === b.id ? 'primary' : 'secondary'}
                  onPress={() => setForm({ ...form, branchId: form.branchId === b.id ? '' : b.id })}
                />
              ))}
            </View>
          ) : null}
          {departments.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {departments.map((d) => (
                <Button
                  key={d.id}
                  title={d.name}
                  variant={form.departmentId === d.id ? 'primary' : 'secondary'}
                  onPress={() => setForm({ ...form, departmentId: form.departmentId === d.id ? '' : d.id })}
                />
              ))}
            </View>
          ) : null}
          <Button title="Personel Oluştur" onPress={create} loading={busy} />
        </Card>
      ) : null}

      {msg ? <Text style={screen.msg}>{msg}</Text> : null}

      {employees.map((e) => (
        <Card key={e.id} style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', color: theme.colors.text }}>
                {e.user.firstName} {e.user.lastName}
              </Text>
              <Text style={screen.muted}>{e.user.publicId} · {e.position ?? '—'}</Text>
              <Text style={screen.muted}>
                {[e.branch?.name, e.department?.name].filter(Boolean).join(' · ') || '—'}
              </Text>
            </View>
            <Chip label={e.user.isActive ? 'Aktif' : 'Pasif'} tone={e.user.isActive ? 'success' : 'default'} />
          </View>
          {e.user.isActive ? (
            <Button title="Pasifleştir" variant="ghost" onPress={() => deactivate(e.id)} loading={busy} />
          ) : null}
        </Card>
      ))}

      {!employees.length && !showForm ? (
        <EmptyState icon="people-outline" title="Personel yok" subtitle="İlk personeli ekleyin." />
      ) : null}
    </ScreenScroll>
  );
}

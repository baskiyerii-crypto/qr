import { useCallback, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { api } from '../../lib/api';
import { Button, Card, Chip } from '../../components/ui';
import { ScreenScroll, ScreenHeader, FormInput, screen, EmptyState, Loading } from '../../components/screen';

const ROLES = [
  { value: 'HR_MANAGER', label: 'İK Yöneticisi' },
  { value: 'REGIONAL_MANAGER', label: 'Bölge Yöneticisi' },
  { value: 'BRANCH_MANAGER', label: 'Şube Yöneticisi' },
  { value: 'COMPANY_ADMIN', label: 'Şirket Yöneticisi' },
];

const BRANCH_SCOPED = ['REGIONAL_MANAGER', 'BRANCH_MANAGER'];

type StaffUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
};

type Branch = { id: string; name: string };

const emptyForm = { email: '', password: '', firstName: '', lastName: '', role: 'HR_MANAGER' };

export default function CompanyUsersScreen() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [u, b] = await Promise.all([
      api.get<StaffUser[]>('/users'),
      api.get<Branch[]>('/companies/branches'),
    ]);
    setUsers(u);
    setBranches(b);
  }, []);

  useEffect(() => {
    load()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [load]);

  const isBranchScoped = BRANCH_SCOPED.includes(form.role);
  const singleBranch = form.role === 'BRANCH_MANAGER';

  const toggleBranch = (id: string) => {
    setSelectedBranches((prev) => {
      if (singleBranch) return prev.includes(id) ? [] : [id];
      return prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id];
    });
  };

  const create = async () => {
    if (!form.email || !form.password || !form.firstName || !form.lastName) return;
    setBusy(true);
    try {
      await api.post('/users', {
        ...form,
        ...(isBranchScoped ? { branchIds: selectedBranches } : {}),
      });
      setShowForm(false);
      setForm(emptyForm);
      setSelectedBranches([]);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    setBusy(true);
    try {
      await api.patch(`/users/${id}/active`, { isActive });
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <ScreenScroll><Loading /></ScreenScroll>;

  const roleLabel = (role: string) => ROLES.find((r) => r.value === role)?.label ?? role;

  return (
    <ScreenScroll>
      <ScreenHeader
        title="Kullanıcılar"
        subtitle="Şirket yönetici hesapları"
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
          <FormInput placeholder="Şifre" value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry />
          <FormInput placeholder="Ad" value={form.firstName} onChangeText={(v) => setForm({ ...form, firstName: v })} />
          <FormInput placeholder="Soyad" value={form.lastName} onChangeText={(v) => setForm({ ...form, lastName: v })} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {ROLES.map((r) => (
              <Button
                key={r.value}
                title={r.label}
                variant={form.role === r.value ? 'primary' : 'secondary'}
                onPress={() => {
                  setForm({ ...form, role: r.value });
                  setSelectedBranches([]);
                }}
              />
            ))}
          </View>
          {isBranchScoped && branches.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {branches.map((b) => (
                <Button
                  key={b.id}
                  title={b.name}
                  variant={selectedBranches.includes(b.id) ? 'primary' : 'secondary'}
                  onPress={() => toggleBranch(b.id)}
                />
              ))}
            </View>
          ) : null}
          <Button title="Kullanıcı Oluştur" onPress={create} loading={busy} />
        </Card>
      ) : null}

      {users.map((u) => (
        <Card key={u.id} style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600' }}>{u.firstName} {u.lastName}</Text>
              <Text style={screen.muted}>{u.email}</Text>
              <Text style={screen.muted}>{roleLabel(u.role)}</Text>
            </View>
            <Chip label={u.isActive ? 'Aktif' : 'Pasif'} tone={u.isActive ? 'success' : 'default'} />
          </View>
          <Button
            title={u.isActive ? 'Pasifleştir' : 'Aktifleştir'}
            variant="ghost"
            onPress={() => toggleActive(u.id, !u.isActive)}
            loading={busy}
          />
        </Card>
      ))}

      {!users.length && !showForm ? (
        <EmptyState icon="person-circle-outline" title="Kullanıcı yok" subtitle="Yönetici hesabı ekleyin." />
      ) : null}
    </ScreenScroll>
  );
}

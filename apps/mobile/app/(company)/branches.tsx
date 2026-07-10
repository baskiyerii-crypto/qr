import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, Image, TouchableOpacity, View } from 'react-native';
import { api } from '../../lib/api';
import { Button, Card } from '../../components/ui';
import { ScreenScroll, ScreenHeader, FormInput, screen } from '../../components/screen';
import { theme } from '../../lib/theme';

interface BranchQr {
  qrImageDataUrl: string;
  branchName: string;
  rotationSeconds: number;
}

function DynamicBranchQr({ branchId }: { branchId: string }) {
  const [qr, setQr] = useState<BranchQr | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let active = true;
    const load = () => {
      api
        .get<BranchQr>(`/companies/branches/${branchId}/qr`)
        .then((r) => { if (active) setQr(r); })
        .catch(() => {});
    };
    load();
    timer.current = setInterval(load, 15000);
    return () => {
      active = false;
      if (timer.current) clearInterval(timer.current);
    };
  }, [branchId]);

  if (!qr) return <Text style={screen.muted}>QR yükleniyor...</Text>;
  return (
    <View style={{ alignItems: 'center', marginTop: 8 }}>
      <Image source={{ uri: qr.qrImageDataUrl }} style={{ width: 200, height: 200 }} resizeMode="contain" />
      <Text style={screen.muted}>Her {qr.rotationSeconds} saniyede yenilenir</Text>
    </View>
  );
}

const defaultForm = {
  name: '',
  address: '',
  latitude: '41.0082',
  longitude: '28.9784',
  geofenceRadiusM: '100',
};

export default function CompanyBranchesScreen() {
  const [branches, setBranches] = useState<Array<{ id: string; name: string; address: string }>>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    return api.get<typeof branches>('/companies/branches').then(setBranches);
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const create = async () => {
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      await api.post('/companies/branches', {
        name: form.name.trim(),
        address: form.address || undefined,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        geofenceRadiusM: parseInt(form.geofenceRadiusM, 10),
      });
      setShowForm(false);
      setForm(defaultForm);
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenScroll>
      <ScreenHeader
        title="Şubeler & QR"
        subtitle="Geofence ve dinamik QR kodları"
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
          <FormInput placeholder="Şube adı" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
          <FormInput placeholder="Adres" value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} />
          <FormInput placeholder="Enlem" value={form.latitude} onChangeText={(v) => setForm({ ...form, latitude: v })} keyboardType="decimal-pad" />
          <FormInput placeholder="Boylam" value={form.longitude} onChangeText={(v) => setForm({ ...form, longitude: v })} keyboardType="decimal-pad" />
          <FormInput placeholder="Geofence (m)" value={form.geofenceRadiusM} onChangeText={(v) => setForm({ ...form, geofenceRadiusM: v })} keyboardType="number-pad" />
          <Button title="Şube Oluştur" onPress={create} loading={busy} />
        </Card>
      ) : null}

      {branches.map((b) => (
        <Card key={b.id} style={screen.row}>
          <Text style={{ fontWeight: '600', color: theme.colors.text }}>{b.name}</Text>
          <Text style={screen.muted}>{b.address || '—'}</Text>
          <TouchableOpacity onPress={() => setOpenId(openId === b.id ? null : b.id)}>
            <Text style={{ color: theme.colors.primary, marginTop: 6, fontWeight: '600' }}>
              {openId === b.id ? 'Dinamik QR gizle' : 'Dinamik QR göster'}
            </Text>
          </TouchableOpacity>
          {openId === b.id ? <DynamicBranchQr branchId={b.id} /> : null}
        </Card>
      ))}
      {!branches.length && !showForm ? <Text style={screen.empty}>Şube yok</Text> : null}
    </ScreenScroll>
  );
}

import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { api } from '../../lib/api';
import { Card, Button } from '../../components/ui';
import { ScreenScroll, screen, FormInput } from '../../components/screen';

type Integrations = {
  evolutionApiUrl: string | null;
  evolutionApiKey: string | null;
  evolutionInstance: string | null;
  iyzicoApiKey: string | null;
  iyzicoBaseUrl: string | null;
};

export default function AdminIntegrationsScreen() {
  const [form, setForm] = useState<Integrations | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get<Integrations>('/admin/settings/integrations').then(setForm).catch(() => {});
  }, []);

  const save = async () => {
    if (!form) return;
    await api.patch('/admin/settings/integrations', form);
    setMsg('Kaydedildi');
  };

  if (!form) return <ScreenScroll><Text style={screen.empty}>Yükleniyor…</Text></ScreenScroll>;

  return (
    <ScreenScroll>
      <Text style={screen.title}>Entegrasyonlar</Text>
      {msg ? <Text style={screen.msg}>{msg}</Text> : null}
      <Card>
        <Text style={screen.section}>Evolution API</Text>
        <FormInput placeholder="API URL" value={form.evolutionApiUrl ?? ''} onChangeText={(v) => setForm({ ...form, evolutionApiUrl: v })} />
        <FormInput placeholder="API Key" value={form.evolutionApiKey ?? ''} onChangeText={(v) => setForm({ ...form, evolutionApiKey: v })} />
        <FormInput placeholder="Instance" value={form.evolutionInstance ?? ''} onChangeText={(v) => setForm({ ...form, evolutionInstance: v })} />
        <Text style={screen.section}>iyzico</Text>
        <FormInput placeholder="API Key" value={form.iyzicoApiKey ?? ''} onChangeText={(v) => setForm({ ...form, iyzicoApiKey: v })} />
        <FormInput placeholder="Base URL" value={form.iyzicoBaseUrl ?? ''} onChangeText={(v) => setForm({ ...form, iyzicoBaseUrl: v })} />
        <Button title="Kaydet" onPress={save} />
      </Card>
    </ScreenScroll>
  );
}

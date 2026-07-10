import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Plug } from 'lucide-react';

type Integrations = {
  evolutionApiUrl: string | null;
  evolutionApiKey: string | null;
  evolutionInstance: string | null;
  iyzicoApiKey: string | null;
  iyzicoSecretKey: string | null;
  iyzicoBaseUrl: string | null;
  webAppUrl: string | null;
};

export function AdminIntegrationsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Integrations | null>(null);

  const { data } = useQuery({
    queryKey: ['admin-integrations'],
    queryFn: async () => {
      const d = await api.get<Integrations>('/admin/settings/integrations');
      setForm(d);
      return d;
    },
  });

  const save = useMutation({
    mutationFn: () => api.patch('/admin/settings/integrations', form),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-integrations'] }),
  });

  const f = form ?? data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entegrasyonlar"
        description="Hassas alanlar maskeli gösterilir. Değiştirmek için yeni değer girin."
        icon={<Plug className="h-5 w-5" />}
      />

      <Card>
        <CardHeader><CardTitle>Evolution API (WhatsApp)</CardTitle></CardHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="API URL"><Input value={f?.evolutionApiUrl ?? ''} onChange={(e) => setForm({ ...f!, evolutionApiUrl: e.target.value })} placeholder="http://localhost:8080" /></Field>
          <Field label="API Key"><Input value={f?.evolutionApiKey ?? ''} onChange={(e) => setForm({ ...f!, evolutionApiKey: e.target.value })} placeholder={f?.evolutionApiKey?.startsWith('****') ? f.evolutionApiKey : 'API key'} /></Field>
          <Field label="Instance adı"><Input value={f?.evolutionInstance ?? ''} onChange={(e) => setForm({ ...f!, evolutionInstance: e.target.value })} /></Field>
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>iyzico</CardTitle></CardHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="API Key"><Input value={f?.iyzicoApiKey ?? ''} onChange={(e) => setForm({ ...f!, iyzicoApiKey: e.target.value })} /></Field>
          <Field label="Secret Key"><Input value={f?.iyzicoSecretKey ?? ''} onChange={(e) => setForm({ ...f!, iyzicoSecretKey: e.target.value })} /></Field>
          <Field label="Base URL"><Input value={f?.iyzicoBaseUrl ?? ''} onChange={(e) => setForm({ ...f!, iyzicoBaseUrl: e.target.value })} placeholder="https://sandbox-api.iyzipay.com" /></Field>
          <Field label="Callback / Web App URL"><Input value={f?.webAppUrl ?? ''} onChange={(e) => setForm({ ...f!, webAppUrl: e.target.value })} /></Field>
        </div>
      </Card>

      <Button onClick={() => save.mutate()} disabled={save.isPending || !f}>Kaydet</Button>
      {save.isSuccess && <p className="text-sm text-emerald-600">Entegrasyon ayarları güncellendi</p>}
    </div>
  );
}

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Label';
import { PageHeader } from '@/components/ui/PageHeader';
import { Download, Plus, QrCode, RefreshCw, Building2 } from 'lucide-react';

interface BranchQr {
  qrImageDataUrl: string;
  branchName: string;
  rotationSeconds: number;
  secondsUntilRefresh: number;
}

function BranchQrViewer({ branchId }: { branchId: string }) {
  const { data, isFetching } = useQuery({
    queryKey: ['branch-qr', branchId],
    queryFn: () => api.get<BranchQr>(`/companies/branches/${branchId}/qr`),
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });

  if (!data) return <p className="text-slate-400">QR yükleniyor...</p>;
  return (
    <div className="flex flex-col items-center">
      <img src={data.qrImageDataUrl} alt="Şube QR" className="rounded-2xl border border-slate-100" />
      <p className="mt-3 text-sm font-medium text-slate-700">{data.branchName}</p>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
        <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
        Her {data.rotationSeconds} saniyede yenilenir
      </p>
    </div>
  );
}

export function BranchesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', address: '', latitude: '41.0082', longitude: '28.9784', geofenceRadiusM: '100',
  });
  const [qrBranchId, setQrBranchId] = useState<string | null>(null);

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get<Array<{ id: string; name: string; address: string; latitude: number; longitude: number; geofenceRadiusM: number }>>('/companies/branches'),
  });

  const { data: qr } = useQuery({
    queryKey: ['qr'],
    queryFn: () => api.get<{ qrImageDataUrl: string; companyName: string }>('/companies/qr'),
  });

  const create = useMutation({
    mutationFn: () =>
      api.post('/companies/branches', {
        name: form.name,
        address: form.address,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        geofenceRadiusM: parseInt(String(form.geofenceRadiusM), 10),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches'] });
      setShowForm(false);
      setForm({ name: '', address: '', latitude: '41.0082', longitude: '28.9784', geofenceRadiusM: '100' });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Şubeler & QR"
        description="Geofence ve şirket QR kodu"
        icon={<Building2 className="h-5 w-5" />}
        actions={<Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4" /> Yeni Şube</Button>}
      />

      {showForm && (
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Şube adı" className="sm:col-span-2"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
            <Field label="Adres" className="sm:col-span-2"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
            <Field label="Enlem"><Input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} /></Field>
            <Field label="Boylam"><Input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} /></Field>
            <Field label="Geofence (m)"><Input type="number" value={form.geofenceRadiusM} onChange={(e) => setForm({ ...form, geofenceRadiusM: e.target.value })} /></Field>
          </div>
          <Button className="mt-4" onClick={() => create.mutate()} disabled={create.isPending || !form.name}>
            {create.isPending ? 'Kaydediliyor...' : 'Şube Ekle'}
          </Button>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Şirket QR Kodu</CardTitle>
          </CardHeader>
          {qr?.qrImageDataUrl ? (
            <div className="flex flex-col items-center">
              <img src={qr.qrImageDataUrl} alt="QR" className="rounded-2xl border border-slate-100" />
              <p className="mt-4 text-sm text-slate-500">{qr.companyName}</p>
              <a href={qr.qrImageDataUrl} download="qr-kod.png">
                <Button variant="secondary" className="mt-4">
                  <Download className="h-4 w-4" /> PNG İndir
                </Button>
              </a>
            </div>
          ) : (
            <p className="text-slate-400">QR kodu yüklenemedi</p>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Şubeler</CardTitle>
          </CardHeader>
          {!branches?.length && <p className="text-slate-400">Henüz şube yok</p>}
          <div className="space-y-3">
            {branches?.map((b) => (
              <div key={b.id} className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{b.name}</p>
                    <p className="text-sm text-slate-500">{b.address}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Geofence: {b.geofenceRadiusM}m · {b.latitude.toFixed(4)}, {b.longitude.toFixed(4)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={qrBranchId === b.id ? 'primary' : 'secondary'}
                    onClick={() => setQrBranchId(qrBranchId === b.id ? null : b.id)}
                  >
                    <QrCode className="h-4 w-4" /> Dinamik QR
                  </Button>
                </div>
                {qrBranchId === b.id && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <BranchQrViewer branchId={b.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

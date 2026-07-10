import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Check } from 'lucide-react';

const steps = ['Şube', 'QR', 'Personel', 'Tamam'];

export function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [branch, setBranch] = useState({ name: 'Merkez', address: '', latitude: '41.0082', longitude: '28.9784' });
  const navigate = useNavigate();

  const createBranch = useMutation({
    mutationFn: () =>
      api.post('/companies/branches', {
        ...branch,
        latitude: parseFloat(branch.latitude),
        longitude: parseFloat(branch.longitude),
        geofenceRadiusM: 200,
      }),
    onSuccess: () => setStep(1),
  });

  const { data: qr } = useQuery({
    queryKey: ['qr'],
    queryFn: () => api.get<{ qrImageDataUrl: string }>('/companies/qr'),
    enabled: step >= 1,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Hoş geldiniz — Kurulum</h1>
        <p className="text-slate-500">4 adımda sistemi kullanıma hazırlayın</p>
      </div>

      <div className="flex gap-2">
        {steps.map((s, i) => (
          <div key={s} className={`h-2 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-slate-200'}`} />
        ))}
      </div>

      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Şube / Lokasyon</CardTitle>
            <CardDescription>Geofence merkezini belirleyin</CardDescription>
          </CardHeader>
          <div className="space-y-4">
            <Input placeholder="Şube adı" value={branch.name} onChange={(e) => setBranch({ ...branch, name: e.target.value })} />
            <Input placeholder="Adres" value={branch.address} onChange={(e) => setBranch({ ...branch, address: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Enlem" value={branch.latitude} onChange={(e) => setBranch({ ...branch, latitude: e.target.value })} />
              <Input placeholder="Boylam" value={branch.longitude} onChange={(e) => setBranch({ ...branch, longitude: e.target.value })} />
            </div>
            <Button onClick={() => createBranch.mutate()}>Devam</Button>
          </div>
        </Card>
      )}

      {step === 1 && qr && (
        <Card className="text-center">
          <CardHeader>
            <CardTitle>QR Kodunuz</CardTitle>
            <CardDescription>Yazdırıp girişe asın</CardDescription>
          </CardHeader>
          <img src={qr.qrImageDataUrl} alt="QR" className="mx-auto rounded-2xl" />
          <Button className="mt-6" onClick={() => setStep(2)}>Devam</Button>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Personel Davet</CardTitle>
            <CardDescription>Personel menüsünden davet gönderebilirsiniz</CardDescription>
          </CardHeader>
          <Button onClick={() => setStep(3)}>Devam</Button>
        </Card>
      )}

      {step === 3 && (
        <Card className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Check className="h-8 w-8" />
          </div>
          <CardTitle>Kurulum Tamamlandı</CardTitle>
          <Button className="mt-6" onClick={() => navigate({ to: '/dashboard' })}>Dashboard&apos;a Git</Button>
        </Card>
      )}
    </div>
  );
}

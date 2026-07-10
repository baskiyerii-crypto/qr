import { useEffect, useState } from 'react';
import { Text, Image } from 'react-native';
import { api } from '../../lib/api';
import { Card, Button } from '../../components/ui';
import { ScreenScroll, screen, FormInput } from '../../components/screen';

export default function CompanyOnboardingScreen() {
  const [step, setStep] = useState(0);
  const [branch, setBranch] = useState({ name: 'Merkez', address: '' });
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    if (step >= 1) {
      api.get<{ qrImageDataUrl: string }>('/companies/qr').then((r) => setQr(r.qrImageDataUrl)).catch(() => {});
    }
  }, [step]);

  const createBranch = async () => {
    await api.post('/companies/branches', {
      ...branch,
      latitude: 41.0082,
      longitude: 28.9784,
      geofenceRadiusM: 200,
    });
    setStep(1);
  };

  return (
    <ScreenScroll>
      <Text style={screen.title}>Kurulum</Text>
      <Text style={screen.muted}>Adım {step + 1}/3</Text>

      {step === 0 && (
        <Card>
          <Text style={screen.section}>İlk şube</Text>
          <FormInput placeholder="Şube adı" value={branch.name} onChangeText={(v) => setBranch({ ...branch, name: v })} />
          <FormInput placeholder="Adres" value={branch.address} onChangeText={(v) => setBranch({ ...branch, address: v })} />
          <Button title="Devam" onPress={createBranch} />
        </Card>
      )}

      {step === 1 && (
        <Card style={{ alignItems: 'center' }}>
          <Text style={screen.section}>QR Kodu</Text>
          {qr && (
            <Image source={{ uri: qr }} style={{ width: 200, height: 200 }} resizeMode="contain" />
          )}
          <Button title="Devam" onPress={() => setStep(2)} />
        </Card>
      )}

      {step === 2 && (
        <Card>
          <Text style={screen.section}>Tamamlandı</Text>
          <Text style={screen.muted}>Personel eklemek için Personel modülünü kullanın.</Text>
        </Card>
      )}
    </ScreenScroll>
  );
}

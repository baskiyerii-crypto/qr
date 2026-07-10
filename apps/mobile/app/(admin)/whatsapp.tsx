import { useEffect, useState } from 'react';
import { Text, Image } from 'react-native';
import { api } from '../../lib/api';
import { Card } from '../../components/ui';
import { ScreenScroll, screen } from '../../components/screen';

export default function AdminWhatsappScreen() {
  const [status, setStatus] = useState<{ state: string; phone?: string } | null>(null);
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ state: string; phone?: string }>('/admin/whatsapp/status').then(setStatus).catch(() => {});
    api.get<{ base64?: string; connected: boolean; message?: string }>('/admin/whatsapp/qr')
      .then((r) => setQr(r.base64 ? `data:image/png;base64,${r.base64.replace(/^data:image\/\w+;base64,/, '')}` : null))
      .catch(() => {});
  }, []);

  return (
    <ScreenScroll>
      <Text style={screen.title}>WhatsApp</Text>
      <Card>
        <Text style={{ fontWeight: '600' }}>Durum: {status?.state ?? '—'}</Text>
        {status?.phone ? <Text style={screen.muted}>Telefon: {status.phone}</Text> : null}
      </Card>
      {qr ? (
        <Card style={{ alignItems: 'center' }}>
          <Text style={screen.section}>QR ile Bağlan</Text>
          <Image source={{ uri: qr }} style={{ width: 220, height: 220 }} resizeMode="contain" />
        </Card>
      ) : (
        <Text style={screen.muted}>QR kodu yüklenemedi veya bağlantı aktif.</Text>
      )}
    </ScreenScroll>
  );
}

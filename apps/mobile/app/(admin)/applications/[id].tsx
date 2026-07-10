import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../../lib/api';
import { Card, Button } from '../../../components/ui';
import { BackLink, ScreenScroll, screen, FormInput } from '../../../components/screen';

const STATUS: Record<string, string> = {
  SUBMITTED: 'Gönderildi', UNDER_REVIEW: 'İnceleniyor', APPROVED: 'Onaylandı', REJECTED: 'Reddedildi',
};

export default function AdminApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [app, setApp] = useState<{
    firstName: string; lastName: string; email: string; phone: string;
    companyName: string | null; status: string; reviewNotes: string | null;
  } | null>(null);
  const [approveCode, setApproveCode] = useState('');
  const [iban, setIban] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => {
    if (!id) return;
    api.get<NonNullable<typeof app>>(`/admin/reseller-applications/${id}`).then((d) => {
      setApp(d);
      setReviewNotes(d.reviewNotes || '');
    }).catch(() => {});
  };

  useEffect(() => { load(); }, [id]);

  if (!app) return <ScreenScroll><Text style={screen.empty}>Yükleniyor…</Text></ScreenScroll>;

  return (
    <ScreenScroll>
      <BackLink />
      <Text style={screen.title}>{app.firstName} {app.lastName}</Text>
      {msg ? <Text style={screen.msg}>{msg}</Text> : null}
      <Card>
        <Text style={screen.muted}>{app.email} · {app.phone}</Text>
        <Text style={screen.muted}>{app.companyName ?? '—'} · {STATUS[app.status] ?? app.status}</Text>
      </Card>
      <Card>
        <FormInput placeholder="İnceleme notu" value={reviewNotes} onChangeText={setReviewNotes} />
        <Button title="İncelemeye Al" variant="secondary" onPress={async () => {
          await api.patch(`/admin/reseller-applications/${id}/review`, { reviewNotes });
          load();
        }} />
      </Card>
      {app.status !== 'APPROVED' && app.status !== 'REJECTED' && (
        <>
          <Card>
            <FormInput placeholder="Bayi kodu" value={approveCode} onChangeText={(v) => setApproveCode(v.toUpperCase())} />
            <FormInput placeholder="IBAN" value={iban} onChangeText={setIban} />
            <Button title="Onayla" onPress={async () => {
              await api.post(`/admin/reseller-applications/${id}/approve`, { code: approveCode.toUpperCase(), iban: iban || undefined });
              setMsg('Onaylandı');
              load();
            }} />
          </Card>
          <Card>
            <FormInput placeholder="Red nedeni" value={rejectReason} onChangeText={setRejectReason} />
            <Button title="Reddet" variant="secondary" onPress={async () => {
              await api.post(`/admin/reseller-applications/${id}/reject`, { rejectionReason: rejectReason });
              setMsg('Reddedildi');
              load();
            }} />
          </Card>
        </>
      )}
      <Button title="Listeye dön" variant="ghost" onPress={() => router.back()} />
    </ScreenScroll>
  );
}

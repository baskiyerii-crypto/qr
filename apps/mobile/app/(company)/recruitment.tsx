import { useCallback, useEffect, useState } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { api } from '../../lib/api';
import { Button, Card } from '../../components/ui';
import { ScreenScroll, screen } from '../../components/screen';

interface Posting {
  id: string;
  title: string;
  status: string;
  branch: { name: string } | null;
  _count: { applications: number };
}

interface Application {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  status: string;
  trackingCode: string;
}

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Başvuruldu', UNDER_REVIEW: 'İncelemede', INTERVIEW: 'Mülakat',
  OFFER: 'Teklif', HIRED: 'İşe Alındı', REJECTED: 'Reddedildi',
};

export default function RecruitmentScreen() {
  const [postings, setPostings] = useState<Posting[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get<Posting[]>('/recruitment/manage/postings');
      setPostings(Array.isArray(data) ? data : []);
    } catch {
      setPostings([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openPosting = async (id: string) => {
    if (openId === id) { setOpenId(null); return; }
    setOpenId(id);
    try {
      const data = await api.get<Application[]>(`/recruitment/manage/postings/${id}/applications`);
      setApps(Array.isArray(data) ? data : []);
    } catch {
      setApps([]);
    }
  };

  const review = async (appId: string, status: string) => {
    try {
      await api.patch(`/recruitment/manage/applications/${appId}/review`, { status });
      setApps((prev) => prev.map((a) => (a.id === appId ? { ...a, status } : a)));
    } catch {}
  };

  const approve = async (appId: string) => {
    try {
      await api.post(`/recruitment/manage/applications/${appId}/approve`, {});
      setApps((prev) => prev.map((a) => (a.id === appId ? { ...a, status: 'HIRED' } : a)));
    } catch {}
  };

  return (
    <ScreenScroll
      refreshing={refreshing}
      onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
    >
      <Text style={screen.title}>İşe Alım</Text>
      {postings.map((p) => (
        <Card key={p.id} style={screen.row}>
          <TouchableOpacity onPress={() => openPosting(p.id)}>
            <Text style={{ fontWeight: '600' }}>{p.title}</Text>
            <Text style={screen.muted}>
              {[p.branch?.name, p.status].filter(Boolean).join(' · ')} · {p._count.applications} başvuru
            </Text>
          </TouchableOpacity>
          {openId === p.id && (
            <View style={{ marginTop: 12, gap: 8 }}>
              <Text style={[screen.muted, { fontSize: 11 }]}>
                Toplu Excel ve PDF CV indirme web panelinden yapılabilir.
              </Text>
              {apps.map((a) => (
                <View key={a.id} style={{ borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8 }}>
                  <Text style={{ fontWeight: '600' }}>{a.firstName} {a.lastName}</Text>
                  <Text style={screen.muted}>{a.phone} · {STATUS_LABELS[a.status] || a.status}</Text>
                  {a.status !== 'HIRED' && (
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                      <Button title="İncele" variant="secondary" onPress={() => review(a.id, 'UNDER_REVIEW')} />
                      <Button title="Mülakat" variant="secondary" onPress={() => review(a.id, 'INTERVIEW')} />
                      {a.email ? <Button title="İşe Al" onPress={() => approve(a.id)} /> : null}
                      <Button title="Reddet" variant="ghost" onPress={() => review(a.id, 'REJECTED')} />
                    </View>
                  )}
                </View>
              ))}
              {!apps.length && <Text style={screen.muted}>Başvuru yok</Text>}
            </View>
          )}
        </Card>
      ))}
      {!postings.length && <Text style={screen.empty}>İlan yok</Text>}
    </ScreenScroll>
  );
}
